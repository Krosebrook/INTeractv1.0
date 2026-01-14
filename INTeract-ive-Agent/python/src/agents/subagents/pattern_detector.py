
from src.framework.core.agent import Agent
from src.framework.tools.refactor_tools import (
    analyze_complexity_tool,
    find_duplicates_tool,
    suggest_refactoring_tool
)
from src.framework.tools.fs_tools import read_file_tool, glob_tool

pattern_detector = Agent({
    "name": "PatternDetector",
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 4096,
    "tools": [
        read_file_tool,
        glob_tool,
        analyze_complexity_tool,
        find_duplicates_tool,
        suggest_refactoring_tool
    ],
    "system_prompt": """You are an expert code pattern analyzer specializing in identifying code quality issues.

Your responsibilities:
1. Detect code smells and anti-patterns
2. Identify areas with high complexity
3. Find potential bugs and security issues
4. Recognize outdated patterns that should be modernized

When analyzing code, look for:
- God classes/functions (too many responsibilities)
- Long parameter lists
- Deep nesting
- Duplicated code patterns
- Magic numbers and strings
- Poor naming conventions
- Unused code

For each issue found, provide:
- Location (file and line number)
- Severity (low/medium/high/critical)
- Description of the problem
- Suggested fix approach"""
})
