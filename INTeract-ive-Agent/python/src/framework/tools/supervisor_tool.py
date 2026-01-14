
from typing import Any
from src.framework.core.agent import Tool
from src.framework.orchestration.supervisor import SupervisorAgent

def create_supervisor_tool(supervisor: SupervisorAgent) -> Tool:
    async def handler(input_data: Any) -> str:
        await supervisor.submit_task({
            "id": input_data["task_id"],
            "type": input_data["type"],
            "input": input_data["input"]
        })
        
        await supervisor.orchestrate()
        
        result = supervisor.get_task_status(input_data["task_id"])
        if result:
            return result.get("result") or result.get("error") or "Task failed without error"
        return "Task not found"

    return {
        "name": "delegate_task",
        "description": "Delegate a specialized task to a subagent",
        "input_schema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Unique identifier for the task"},
                "type": {
                    "type": "string",
                    "enum": ["detect-patterns", "analyze-structure", "generate-diff"],
                    "description": "Type of capability needed"
                },
                "input": {
                    "type": "object",
                    "description": "Specific instructions or data for the subagent"
                }
            },
            "required": ["task_id", "type", "input"]
        },
        "handler": handler
    }
