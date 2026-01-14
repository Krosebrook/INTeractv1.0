
from src.framework.core.agent import Agent
from src.framework.orchestration.supervisor import SupervisorAgent
from src.framework.tools.git_tools import (
    list_branches_tool,
    switch_branch_tool,
    get_status_tool,
    get_log_tool,
    diff_branches_tool
)
from src.framework.tools.preview_tools import create_summary_report_tool
from src.framework.tools.supervisor_tool import create_supervisor_tool

from src.agents.subagents.pattern_detector import pattern_detector
from src.agents.subagents.code_analyzer import code_analyzer
from src.agents.subagents.diff_generator import diff_generator

def create_refactoring_orchestrator() -> SupervisorAgent:
    """Configure the Modernized Refactoring Supervisor."""
    supervisor = SupervisorAgent({
        "max_concurrent_tasks": 3,
        "task_timeout_ms": 120000,
        "max_retries": 3
    })

    # Register Worker Agents
    supervisor.register_worker('pattern-detector', pattern_detector, ['detect-patterns'])
    supervisor.register_worker('code-analyzer', code_analyzer, ['analyze-structure'])
    supervisor.register_worker('diff-generator', diff_generator, ['generate-diff'])

    return supervisor

def create_master_agent(supervisor: SupervisorAgent) -> Agent:
    """Configure the Master Agent with Supervisor access."""
    return Agent({
        "name": "MasterRefactoringAgent",
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 8192,
        "tools": [
            list_branches_tool,
            switch_branch_tool,
            get_status_tool,
            get_log_tool,
            diff_branches_tool,
            create_summary_report_tool,
            create_supervisor_tool(supervisor)
        ],
        "system_prompt": """You are the Master Refactoring Agent. Your job is to orchestrate a team of specialized subagents to refactor code safely.

## Your Subagents
1. **pattern-detector**: Finds code smells and anti-patterns. Use for "detect-patterns" tasks.
2. **code-analyzer**: Analyzes architecture and complexity. Use for "analyze-structure" tasks.
3. **diff-generator**: Creates and applies changes. Use for "generate-diff" tasks.

## Your Workflow
1. **Explore**: Use Git tools to understand the repository state.
2. **Tasking**: Delegate analysis to subagents using the delegate_task tool.
3. **Review**: Combine findings and propose a plan to the user.
4. **Execute**: Delegate change generation to the diff-generator.

You have direct access to Git and Reporting tools. For complex analysis and transformations, ALWAYS delegate to subagents."""
    })
