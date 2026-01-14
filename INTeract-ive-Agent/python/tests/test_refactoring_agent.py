import pytest
from src.agents.refactoring_agent import create_refactoring_agent_options, REFACTORING_SYSTEM_PROMPT

def test_create_options_system_prompt():
    options = create_refactoring_agent_options()
    assert options.system_prompt == REFACTORING_SYSTEM_PROMPT

def test_allowed_tools():
    options = create_refactoring_agent_options()
    tools = options.allowed_tools
    
    assert "mcp__git-tools__git_status" in tools
    assert "mcp__refactor-tools__analyze_complexity" in tools
    assert "mcp__preview-tools__generate_diff_preview" in tools

def test_subagents_configured():
    options = create_refactoring_agent_options()
    agents = options.agents
    
    assert "pattern-detector" in agents
    assert "code-analyzer" in agents
    assert "diff-generator" in agents

def test_permission_mode():
    from src.types import RefactoringConfig
    
    default_options = create_refactoring_agent_options()
    assert default_options.permission_mode == "default"

    config = RefactoringConfig(repositories=[], auto_apply=True, dry_run=False, output_format="detailed")
    auto_apply_options = create_refactoring_agent_options(config)
    assert auto_apply_options.permission_mode == "acceptEdits"
