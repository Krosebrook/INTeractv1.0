"""Git tools for the refactoring agent."""

import asyncio
import json
from typing import Any

from claude_agent_sdk import tool, create_sdk_mcp_server


async def run_git_command(cwd: str, args: str) -> str:
    """Execute a git command in the specified directory."""
    proc = await asyncio.create_subprocess_shell(
        f"git {args}",
        cwd=cwd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()

    if proc.returncode != 0:
        raise RuntimeError(stderr.decode().strip() or f"Git command failed: {args}")

    return stdout.decode().strip()


@tool(
    "git_list_branches",
    "List all branches in a git repository, showing which one is currently checked out",
    {"repo_path": str, "include_remote": bool},
)
async def list_branches(args: dict[str, Any]) -> dict[str, Any]:
    """List all branches in a repository."""
    repo_path = args["repo_path"]
    include_remote = args.get("include_remote", False)

    flag = "-a" if include_remote else ""
    output = await run_git_command(
        repo_path,
        f'branch {flag} --format="%(refname:short)|%(HEAD)|%(objectname:short)|%(committerdate:relative)"',
    )

    branches = []
    for line in output.split("\n"):
        if line.strip():
            parts = line.split("|")
            if len(parts) >= 4:
                branches.append({
                    "name": parts[0],
                    "current": parts[1] == "*",
                    "last_commit": parts[2],
                    "last_commit_date": parts[3],
                })

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({"branches": branches, "count": len(branches)}, indent=2),
        }]
    }


@tool(
    "git_switch_branch",
    "Switch to a different branch in the repository",
    {"repo_path": str, "branch_name": str, "create": bool},
)
async def switch_branch(args: dict[str, Any]) -> dict[str, Any]:
    """Switch to a different branch."""
    repo_path = args["repo_path"]
    branch_name = args["branch_name"]
    create = args.get("create", False)

    flag = "-c" if create else ""
    await run_git_command(repo_path, f"switch {flag} {branch_name}")

    return {
        "content": [{
            "type": "text",
            "text": f"Successfully switched to branch: {branch_name}",
        }]
    }


@tool(
    "git_diff_branches",
    "Get the diff between two branches showing what changes exist",
    {"repo_path": str, "base_branch": str, "compare_branch": str, "path_filter": str},
)
async def diff_branches(args: dict[str, Any]) -> dict[str, Any]:
    """Get the diff between two branches."""
    repo_path = args["repo_path"]
    base_branch = args["base_branch"]
    compare_branch = args["compare_branch"]
    path_filter = args.get("path_filter", "")

    path_arg = f"-- {path_filter}" if path_filter else ""
    summary = await run_git_command(
        repo_path, f"diff {base_branch}...{compare_branch} --stat {path_arg}"
    )
    full_diff = await run_git_command(
        repo_path, f"diff {base_branch}...{compare_branch} {path_arg}"
    )

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "summary": summary,
                "diff": full_diff[:50000],
                "truncated": len(full_diff) > 50000,
            }, indent=2),
        }]
    }


@tool(
    "git_log",
    "Get the commit history for a branch",
    {"repo_path": str, "branch": str, "limit": int, "path_filter": str},
)
async def get_log(args: dict[str, Any]) -> dict[str, Any]:
    """Get commit log."""
    repo_path = args["repo_path"]
    branch = args.get("branch", "HEAD")
    limit = args.get("limit", 50)
    path_filter = args.get("path_filter", "")

    path_arg = f"-- {path_filter}" if path_filter else ""
    output = await run_git_command(
        repo_path,
        f'log {branch} -n {limit} --format="%H|%an|%ad|%s" --date=short {path_arg}',
    )

    commits = []
    for line in output.split("\n"):
        if line.strip():
            parts = line.split("|")
            if len(parts) >= 4:
                commits.append({
                    "hash": parts[0],
                    "author": parts[1],
                    "date": parts[2],
                    "message": parts[3],
                })

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({"commits": commits, "count": len(commits)}, indent=2),
        }]
    }


@tool(
    "git_status",
    "Get the current status of the repository",
    {"repo_path": str},
)
async def get_status(args: dict[str, Any]) -> dict[str, Any]:
    """Get repository status."""
    repo_path = args["repo_path"]

    branch = await run_git_command(repo_path, "branch --show-current")
    status = await run_git_command(repo_path, "status --porcelain")

    try:
        remote = await run_git_command(repo_path, "remote -v")
    except RuntimeError:
        remote = "No remotes configured"

    files = []
    for line in status.split("\n"):
        if line.strip():
            files.append({
                "status": line[:2].strip(),
                "path": line[3:],
            })

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "current_branch": branch,
                "remote": remote.split("\n")[0] if remote else "None",
                "modified_files": [f["path"] for f in files if f["status"] == "M"],
                "staged_files": [f["path"] for f in files if f["status"] in ("A", "MM")],
                "untracked_files": [f["path"] for f in files if f["status"] == "??"],
                "total_changes": len(files),
            }, indent=2),
        }]
    }


def create_git_tools_server():
    """Create the git tools MCP server."""
    return create_sdk_mcp_server(
        name="git-tools",
        version="1.0.0",
        tools=[list_branches, switch_branch, diff_branches, get_log, get_status],
    )
