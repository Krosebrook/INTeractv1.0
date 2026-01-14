
import os
import sys
import asyncio
import argparse
from typing import List
from src.agents.refactoring_agent import create_refactoring_orchestrator, create_master_agent

def parse_args():
    parser = argparse.ArgumentParser(description="INTeract-ive Agent - Refactoring Agent")
    parser.add_argument("repos", nargs="*", help="Repository paths to analyze")
    parser.add_argument("-r", "--repo", action="append", dest="repos_opt", help="Add a repository path to analyze")
    parser.add_argument("-p", "--prompt", help="Initial prompt for the agent")
    parser.add_argument("--auto-apply", action="store_true", help="Automatically apply suggested changes")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be changed without applying")
    parser.add_argument("-o", "--output", choices=["detailed", "summary", "json"], default="detailed", help="Output format")
    
    return parser.parse_args()

async def main():
    args = parse_args()
    
    # Combine positional args and -r args
    repos = args.repos or []
    if args.repos_opt:
        repos.extend(args.repos_opt)
        
    if not repos:
        repos = [os.getcwd()]
        
    # Check for API key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("Error: ANTHROPIC_API_KEY environment variable is required.")
        print("Get your API key from: https://console.anthropic.com/")
        sys.exit(1)
        
    # Build initial prompt
    prompt = args.prompt or ""
    
    if not prompt:
        if len(repos) == 1:
            prompt = f"Analyze the repository at {repos[0]} and identify refactoring opportunities. Start by getting the git status and then look for code that could be improved."
        else:
            prompt = f"I have {len(repos)} repositories to refactor: {', '.join(repos)}. Help me analyze and improve them."

    print("INTeract-ive Agent - Starting refactoring analysis...")
    print(f"Repositories: {', '.join(repos)}")
    print("---")

    try:
        supervisor = create_refactoring_orchestrator()
        master = create_master_agent(supervisor)

        result = await master.run(prompt)

        print("\n---")
        print("Analysis complete.")
        print(result["response"])
        
        print("\nMetadata:")
        print(f"- Iterations: {result['iterations']}")
        print(f"- Tools Used: {', '.join(result['tools_used'])}")
        print(f"- Tokens: {result['total_tokens']['input']} in / {result['total_tokens']['output']} out")

    except Exception as e:
        print(f"Error running refactoring agent: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
