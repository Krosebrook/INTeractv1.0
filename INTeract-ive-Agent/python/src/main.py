#!/usr/bin/env python3
"""INTeract-ive Agent - Full-featured Refactoring Agent (Python)"""

import argparse
import asyncio
import os
import sys
from typing import Any

from .agents import run_refactoring_agent
from .types import RefactoringConfig, RepositoryConfig


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        prog="interact-ive-agent",
        description="INTeract-ive Agent - Full-featured Refactoring Agent",
    )

    parser.add_argument(
        "repos",
        nargs="*",
        help="Repository paths to analyze",
    )
    parser.add_argument(
        "-r",
        "--repo",
        action="append",
        dest="extra_repos",
        help="Additional repository path (can be used multiple times)",
    )
    parser.add_argument(
        "-p",
        "--prompt",
        help="Initial prompt for the agent",
    )
    parser.add_argument(
        "--auto-apply",
        action="store_true",
        help="Automatically apply suggested changes",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be changed without applying",
    )
    parser.add_argument(
        "-o",
        "--output",
        choices=["detailed", "summary", "json"],
        default="detailed",
        help="Output format (default: detailed)",
    )

    return parser.parse_args()


def format_message(message: Any) -> str | None:
    """Format a message for display."""
    if hasattr(message, "type"):
        if message.type == "assistant":
            if hasattr(message, "content"):
                text_parts = []
                for block in message.content:
                    if hasattr(block, "text"):
                        text_parts.append(block.text)
                if text_parts:
                    return "".join(text_parts)
        elif message.type == "result":
            result_text = []
            result_text.append("\n---")
            result_text.append("Analysis complete.")
            if hasattr(message, "result") and message.result:
                result_text.append(f"Result: {message.result}")
            if hasattr(message, "total_cost_usd") and message.total_cost_usd is not None:
                result_text.append(f"Cost: ${message.total_cost_usd:.4f}")
            return "\n".join(result_text)

    return None


async def main_async() -> int:
    """Async main function."""
    args = parse_args()

    # Check for API key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("Error: ANTHROPIC_API_KEY environment variable is required.", file=sys.stderr)
        print("Get your API key from: https://console.anthropic.com/", file=sys.stderr)
        return 1

    # Collect all repos
    repos = list(args.repos) if args.repos else []
    if args.extra_repos:
        repos.extend(args.extra_repos)

    # Default to current directory
    if not repos:
        repos.append(os.getcwd())

    repositories = [RepositoryConfig(path=r) for r in repos]

    config = RefactoringConfig(
        repositories=repositories,
        output_format=args.output,
        auto_apply=args.auto_apply,
        dry_run=args.dry_run,
    )

    # Build initial prompt
    prompt = args.prompt or ""
    if not prompt:
        if len(repositories) == 1:
            prompt = f"Analyze the repository at {repositories[0].path} and identify refactoring opportunities. Start by getting the git status and then look for code that could be improved."
        else:
            repo_list = ", ".join(r.path for r in repositories)
            prompt = f"I have {len(repositories)} repositories to refactor: {repo_list}. Help me analyze and improve them."

    print("INTeract-ive Agent - Starting refactoring analysis...")
    print(f"Repositories: {', '.join(r.path for r in repositories)}")
    print("---")

    try:
        async for message in run_refactoring_agent(prompt, config):
            formatted = format_message(message)
            if formatted:
                print(formatted)
    except Exception as e:
        print(f"Error running refactoring agent: {e}", file=sys.stderr)
        return 1

    return 0


def main() -> None:
    """Entry point."""
    sys.exit(asyncio.run(main_async()))


if __name__ == "__main__":
    main()
