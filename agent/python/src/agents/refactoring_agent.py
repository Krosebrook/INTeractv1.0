"""Main Refactoring Agent - Orchestrates the refactoring process."""

from typing import AsyncIterator, Any

from claude_agent_sdk import query, ClaudeAgentOptions

from ..tools import (
    create_git_tools_server,
    create_refactor_tools_server,
    create_preview_tools_server,
)
from ..types import RefactoringConfig
from .subagents import (
    pattern_detector_agent,
    code_analyzer_agent,
    diff_generator_agent,
)

REFACTORING_SYSTEM_PROMPT = """You are an expert code refactoring agent. Your purpose is to analyze codebases, identify improvement opportunities, and apply refactorings safely.

## Your Capabilities

You have access to:
1. **Git Tools** - For branch management, diffs, and version control
2. **Refactoring Tools** - For code analysis, duplicate detection, and complexity measurement
3. **Preview Tools** - For generating diffs and summary reports
4. **Subagents**:
   - pattern-detector: Finds code smells and anti-patterns
   - code-analyzer: Analyzes architecture and dependencies
   - diff-generator: Creates and applies code changes

## Workflow

When asked to refactor code:

1. **Understand the scope**
   - What repository/files are being targeted?
   - What type of refactoring is requested?
   - Are there specific concerns or constraints?

2. **Analyze the codebase**
   - Use git tools to understand the current state
   - Use pattern-detector to find issues
   - Use code-analyzer to understand structure

3. **Propose changes**
   - Prioritize by impact and risk
   - Generate diffs for review
   - Explain the benefits of each change

4. **Apply changes (if approved)**
   - Make changes incrementally
   - Verify each change doesn't break anything
   - Generate a summary report

## Guidelines

- Always preview changes before applying them
- Preserve existing functionality
- Follow the project's coding style
- Document significant changes
- Be conservative with risky refactorings
- Ask for clarification when the request is ambiguous

## Multi-Repository Support

You can work with multiple repositories. When switching between repos:
- Use git_status to confirm current location
- Use git_switch_branch for branch navigation
- Keep track of which repo you're analyzing

Start by asking what the user wants to refactor, or analyze the current directory if a path is provided."""


def create_refactoring_agent_options(
    config: RefactoringConfig | None = None,
) -> ClaudeAgentOptions:
    """Create the refactoring agent options."""
    git_tools = create_git_tools_server()
    refactor_tools = create_refactor_tools_server()
    preview_tools = create_preview_tools_server()

    agents = {
        "pattern-detector": pattern_detector_agent,
        "code-analyzer": code_analyzer_agent,
        "diff-generator": diff_generator_agent,
    }

    cwd = None
    if config and config.repositories:
        cwd = config.repositories[0].path

    return ClaudeAgentOptions(
        system_prompt=REFACTORING_SYSTEM_PROMPT,
        allowed_tools=[
            # Built-in tools
            "Read",
            "Write",
            "Edit",
            "Bash",
            "Glob",
            "Grep",
            "Task",
            # MCP tools - Git
            "mcp__git-tools__git_list_branches",
            "mcp__git-tools__git_switch_branch",
            "mcp__git-tools__git_diff_branches",
            "mcp__git-tools__git_log",
            "mcp__git-tools__git_status",
            # MCP tools - Refactoring
            "mcp__refactor-tools__find_duplicates",
            "mcp__refactor-tools__analyze_complexity",
            "mcp__refactor-tools__suggest_refactoring",
            # MCP tools - Preview
            "mcp__preview-tools__generate_diff_preview",
            "mcp__preview-tools__create_summary_report",
        ],
        mcp_servers={
            "git-tools": git_tools,
            "refactor-tools": refactor_tools,
            "preview-tools": preview_tools,
        },
        agents=agents,
        permission_mode="acceptEdits" if (config and config.auto_apply) else "default",
        cwd=cwd,
    )


async def run_refactoring_agent(
    prompt: str,
    config: RefactoringConfig | None = None,
) -> AsyncIterator[Any]:
    """Run the refactoring agent with a prompt."""
    options = create_refactoring_agent_options(config)

    async for message in query(prompt=prompt, options=options):
        yield message
