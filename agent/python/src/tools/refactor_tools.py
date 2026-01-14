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
    import ast
    content = Path(file_path).read_text(encoding="utf-8", errors="ignore")
    
    try:
        tree = ast.parse(content)
    except SyntaxError as e:
        return {
            "error": f"Syntax error in {file_path}: {e}",
            "file": file_path
        }

    cyclomatic_complexity = 1
    function_count = 0
    long_functions: list[dict] = []

    class ComplexityVisitor(ast.NodeVisitor):
        nonlocal cyclomatic_complexity, function_count
        
        def visit_If(self, node):
            nonlocal cyclomatic_complexity
            cyclomatic_complexity += 1
            self.generic_visit(node)
            
        def visit_While(self, node):
            nonlocal cyclomatic_complexity
            cyclomatic_complexity += 1
            self.generic_visit(node)
            
        def visit_For(self, node):
            nonlocal cyclomatic_complexity
            cyclomatic_complexity += 1
            self.generic_visit(node)

        def visit_AsyncFor(self, node):
            nonlocal cyclomatic_complexity
            cyclomatic_complexity += 1
            self.generic_visit(node)

        def visit_With(self, node):
            # Not traditionally part of cyclomatic complexity but adds a decision point in some definitions
            # We'll stick to standard branching for now
            self.generic_visit(node)
            
        def visit_ExceptHandler(self, node):
            nonlocal cyclomatic_complexity
            cyclomatic_complexity += 1
            self.generic_visit(node)
            
        def visit_BoolOp(self, node):
            nonlocal cyclomatic_complexity
            # Each 'and' or 'or' adds a decision point
            cyclomatic_complexity += len(node.values) - 1
            self.generic_visit(node)

        def visit_IfExp(self, node):
            nonlocal cyclomatic_complexity
            cyclomatic_complexity += 1
            self.generic_visit(node)

        def visit_FunctionDef(self, node):
            nonlocal function_count
            function_count += 1
            # Check length
            length = len(node.body) # This is Number of statements, not lines.
            # To get lines reliably we need end_lineno (Python 3.8+)
            start_line = getattr(node, 'lineno', 0)
            end_line = getattr(node, 'end_lineno', start_line)
            actual_lines = end_line - start_line + 1
            
            if actual_lines > 50:
                long_functions.append({"name": node.name, "lines": actual_lines})
            self.generic_visit(node)

        def visit_AsyncFunctionDef(self, node):
            nonlocal function_count
            function_count += 1
            start_line = getattr(node, 'lineno', 0)
            end_line = getattr(node, 'end_lineno', start_line)
            actual_lines = end_line - start_line + 1
            
            if actual_lines > 50:
                long_functions.append({"name": node.name, "lines": actual_lines})
            self.generic_visit(node)

    ComplexityVisitor().visit(tree)
    
    rating = "low" if cyclomatic_complexity < 10 else "medium" if cyclomatic_complexity < 20 else "high"

    suggestions = []
    if cyclomatic_complexity > 20:
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
                "total_lines": len(content.split("\n")),
                "code_lines": len([l for l in content.split("\n") if l.strip() and not l.strip().startswith("#")]),
                "cyclomatic_complexity": cyclomatic_complexity,
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
    """Suggest refactorings for a file using AST analysis."""
    import ast
    content = Path(file_path).read_text(encoding="utf-8", errors="ignore")
    
    try:
        tree = ast.parse(content)
    except SyntaxError as e:
        return {"error": f"Syntax error: {e}", "file": file_path}

    suggestions: list[dict] = []
    defined_names = set()
    used_names = set()
    
    class AnalysisVisitor(ast.NodeVisitor):
        def visit_Name(self, node):
            if isinstance(node.ctx, ast.Load):
                used_names.add(node.id)
            elif isinstance(node.ctx, ast.Store):
                defined_names.add((node.id, node.lineno))
            self.generic_visit(node)
            
        def visit_FunctionDef(self, node):
            defined_names.add((node.name, node.lineno))
            # Naming check
            if not re.match(r"^[a-z_][a-z0-0_]*$", node.name):
                suggestions.append({
                    "type": "naming-consistency",
                    "line": node.lineno,
                    "description": f"Function '{node.name}' does not follow snake_case convention",
                    "severity": "low",
                    "suggestion": f"Rename to follow PEP 8 snake_case"
                })
            self.generic_visit(node)
            
        def visit_ClassDef(self, node):
            defined_names.add((node.name, node.lineno))
            if not re.match(r"^[A-Z][a-zA-Z0-9]*$", node.name):
                suggestions.append({
                    "type": "naming-consistency",
                    "line": node.lineno,
                    "description": f"Class '{node.name}' does not follow PascalCase convention",
                    "severity": "low",
                    "suggestion": f"Rename to follow PEP 8 PascalCase"
                })
            self.generic_visit(node)

        def visit_Import(self, node):
            for alias in node.names:
                name = alias.asname or alias.name
                defined_names.add((name, node.lineno))
            self.generic_visit(node)
            
        def visit_ImportFrom(self, node):
            for alias in node.names:
                name = alias.asname or alias.name
                defined_names.add((name, node.lineno))
            self.generic_visit(node)

    AnalysisVisitor().visit(tree)
    
    # Dead code detection
    if focus_area in ("all", "dead-code"):
        for name, line in defined_names:
            if name not in used_names and not name.startswith("_"):
                # Exclude common names or underscore names
                if name in ("__name__", "__main__", "args", "kwargs"):
                    continue
                suggestions.append({
                    "type": "dead-code",
                    "line": line,
                    "description": f"Unused definition found: '{name}'",
                    "severity": "medium",
                    "suggestion": "Remove unused definition or use it"
                })

    todo_comments = len(re.findall(r"#\s*(TODO|FIXME|HACK|XXX)", content, re.I))

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


def create_refactor_tools_server():
    """Create the refactoring tools MCP server."""
    return create_sdk_mcp_server(
        name="refactor-tools",
        version="1.0.0",
        tools=[find_duplicates, analyze_complexity, suggest_refactoring],
    )
