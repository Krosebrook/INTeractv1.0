"""Refactoring analysis tools for the agent."""

import json
import os
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

from claude_agent_sdk import tool, create_sdk_mcp_server


async def _find_duplicates_impl(directory: str, min_lines: int = 5, file_pattern: str = "*") -> dict[str, Any]:
    """Find duplicate code blocks across files."""
    files: list[Path] = []

    def walk_dir(dir_path: Path) -> None:
        try:
            for entry in dir_path.iterdir():
                if entry.is_dir():
                    if not entry.name.startswith(".") and entry.name != "node_modules":
                        walk_dir(entry)
                elif entry.is_file():
                    if file_pattern == "*" or entry.name.endswith(
                        file_pattern.replace("*", "")
                    ):
                        files.append(entry)
        except PermissionError:
            pass

    walk_dir(Path(directory))

    block_hashes: dict[str, list[dict]] = defaultdict(list)

    for file_path in files:
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            lines = content.split("\n")

            for i in range(len(lines) - min_lines + 1):
                block = lines[i : i + min_lines]
                block_text = "\n".join(block).strip()

                if len(block_text) < 50:
                    continue

                # Use a stable hash (like hashlib) instead of hash() as it's not stable across runs in Python 3
                import hashlib
                block_hash = hashlib.md5(block_text.encode()).hexdigest()[:16]

                block_hashes[block_hash].append({
                    "file": str(file_path.relative_to(directory)),
                    "start_line": i + 1,
                    "lines": block[:3],
                })
        except Exception:
            pass

    duplicates = [
        {
            "occurrences": len(locations),
            "locations": [
                {
                    "file": loc["file"],
                    "start_line": loc["start_line"],
                    "preview": "\n".join(loc["lines"]),
                }
                for loc in locations
            ],
        }
        for locations in block_hashes.values()
        if len(locations) > 1
    ][:20]

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "files_scanned": len(files),
                "duplicates_found": len(duplicates),
                "duplicates": duplicates,
            }, indent=2),
        }]
    }


@tool(
    "find_duplicates",
    "Find duplicate or similar code blocks across files in a directory",
    {"directory": str, "min_lines": int, "file_pattern": str},
)
async def find_duplicates(args: dict[str, Any]) -> dict[str, Any]:
    return await _find_duplicates_impl(
        args["directory"], 
        args.get("min_lines", 5), 
        args.get("file_pattern", "*")
    )


async def _analyze_complexity_impl(file_path: str) -> dict[str, Any]:
    """Analyze code complexity."""
    content = Path(file_path).read_text(encoding="utf-8", errors="ignore")
    lines = content.split("\n")

    # Simple complexity analysis
    complexity = 1
    complexity_patterns = [
        r"\bif\b",
        r"\belse\b",
        r"\bwhile\b",
        r"\bfor\b",
        r"\bcase\b",
        r"\bcatch\b",
        r"\bexcept\b",
        r"\?",
        r"&&",
        r"\|\|",
        r"\?\?",
        r"\band\b",
        r"\bor\b",
    ]

    for line in lines:
        for pattern in complexity_patterns:
            complexity += len(re.findall(pattern, line))

    # Count functions
    function_patterns = [
        r"def\s+\w+",
        r"async\s+def\s+\w+",
        r"function\s+\w+",
        r"=>\s*\{",
        r"\w+\s*\([^)]*\)\s*\{",
    ]
    function_count = sum(
        len(re.findall(p, content)) for p in function_patterns
    )

    # Find long functions
    long_functions: list[dict] = []
    function_lines = 0
    current_function = None
    func_start_line = 0

    for i, line in enumerate(lines):
        func_match = re.match(r"^(async\s+)?def\s+(\w+)", line.lstrip())
        if func_match:
            if current_function:
                # Close previous function
                length = i - func_start_line
                if length > 50:
                    long_functions.append({"name": current_function, "lines": length})
            
            current_function = func_match.group(2)
            func_start_line = i
        elif current_function and line.strip() and not line.startswith(" ") and not line.startswith("\t"):
            # If line is not indented and not empty, it might be the end of the function
            # This is a simple heuristic for Python
            length = i - func_start_line
            if length > 50:
                long_functions.append({"name": current_function, "lines": length})
            current_function = None

    # Handle the last function in the file
    if current_function:
        length = len(lines) - func_start_line
        if length > 50:
            long_functions.append({"name": current_function, "lines": length})

    rating = "low" if complexity < 10 else "medium" if complexity < 20 else "high"

    suggestions = []
    if complexity > 20:
        suggestions.append("Consider breaking down complex logic into smaller functions")
    if function_count > 20:
        suggestions.append("Many functions detected - consider splitting into modules")
    if long_functions:
        suggestions.append(f"{len(long_functions)} function(s) exceed 50 lines - consider refactoring")

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "file": file_path,
                "total_lines": len(lines),
                "code_lines": len([l for l in lines if l.strip() and not l.strip().startswith("#")]),
                "cyclomatic_complexity": complexity,
                "complexity_rating": rating,
                "function_count": function_count,
                "long_functions": long_functions,
                "suggestions": suggestions,
            }, indent=2),
        }]
    }


@tool(
    "analyze_complexity",
    "Analyze cyclomatic complexity and other code metrics for files",
    {"file_path": str},
)
async def analyze_complexity(args: dict[str, Any]) -> dict[str, Any]:
    return await _analyze_complexity_impl(args["file_path"])


async def _suggest_refactoring_impl(file_path: str, focus_area: str = "all") -> dict[str, Any]:
    """Suggest refactorings for a file."""
    content = Path(file_path).read_text(encoding="utf-8", errors="ignore")
    lines = content.split("\n")
    suggestions: list[dict] = []

    # Check for naming issues
    if focus_area in ("all", "naming"):
        single_letter_vars = re.findall(r"\b(let|const|var|def)\s+[a-z]\s*=", content)
        if single_letter_vars:
            suggestions.append({
                "type": "improve-naming",
                "line": 0,
                "description": f"Found {len(single_letter_vars)} single-letter variable names",
                "severity": "medium",
                "suggestion": "Use descriptive variable names that convey meaning",
            })

    # Check for structural issues
    if focus_area in ("all", "structure"):
        max_indent = 0
        deepest_line = 0
        for i, line in enumerate(lines):
            indent = len(line) - len(line.lstrip())
            if indent > max_indent:
                max_indent = indent
                deepest_line = i + 1

        if max_indent > 20:
            suggestions.append({
                "type": "simplify-conditional",
                "line": deepest_line,
                "description": f"Deep nesting detected ({max_indent // 4} levels)",
                "severity": "high",
                "suggestion": "Consider early returns, guard clauses, or extracting nested logic",
            })

    # Check for dead code
    todo_comments = len(re.findall(r"#\s*(TODO|FIXME|HACK|XXX)", content, re.I))
    commented_code = len(re.findall(r"#\s*(def|class|if|for|while|import)", content))

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "file": file_path,
                "total_suggestions": len(suggestions),
                "todo_comments": todo_comments,
                "suggestions": suggestions,
            }, indent=2),
        }]
    }

@tool(
    "suggest_refactoring",
    "Analyze code and suggest specific refactoring opportunities",
    {"file_path": str, "focus_area": str},
)
async def suggest_refactoring(args: dict[str, Any]) -> dict[str, Any]:
    return await _suggest_refactoring_impl(
        args["file_path"], 
        args.get("focus_area", "all")
    )
    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "file": file_path,
                "total_suggestions": len(suggestions),
                "todo_comments": todo_comments,
                "suggestions": suggestions,
            }, indent=2),
        }]
    }


def create_refactor_tools_server():
    """Create the refactoring tools MCP server."""
    return create_sdk_mcp_server(
        name="refactor-tools",
        version="1.0.0",
        tools=[find_duplicates, analyze_complexity, suggest_refactoring],
    )
