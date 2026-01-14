
import glob
from typing import Any, List
from src.framework.core.agent import Tool

async def read_file_impl(args: Any) -> str:
    path = args.get('file_path')
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

async def write_file_impl(args: Any) -> dict:
    path = args.get('file_path')
    content = args.get('content')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    return {"success": True}

async def glob_impl(args: Any) -> List[str]:
    pattern = args.get('pattern')
    cwd = args.get('cwd', '.')
    return glob.glob(pattern, root_dir=cwd, recursive=True)

read_file_tool: Tool = {
    "name": "read_file",
    "description": "Read the contents of a file",
    "input_schema": {
        "type": "object",
        "properties": {
            "file_path": {"type": "string"}
        },
        "required": ["file_path"]
    },
    "handler": read_file_impl
}

write_file_tool: Tool = {
    "name": "write_file",
    "description": "Write content to a file",
    "input_schema": {
        "type": "object",
        "properties": {
            "file_path": {"type": "string"},
            "content": {"type": "string"}
        },
        "required": ["file_path", "content"]
    },
    "handler": write_file_impl
}

glob_tool: Tool = {
    "name": "glob",
    "description": "Search for files using glob patterns",
    "input_schema": {
        "type": "object",
        "properties": {
            "pattern": {"type": "string"},
            "cwd": {"type": "string"}
        },
        "required": ["pattern"]
    },
    "handler": glob_impl
}
