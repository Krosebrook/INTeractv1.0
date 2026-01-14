import { describe, it, expect } from 'vitest';
import { createRefactoringAgentOptions, REFACTORING_SYSTEM_PROMPT } from '../src/agents/refactoring-agent.js';

describe('Refactoring Agent', () => {
  it('should create options with the correct system prompt', () => {
    const options = createRefactoringAgentOptions();
    expect(options.systemPrompt).toBe(REFACTORING_SYSTEM_PROMPT);
  });

  it('should include all required MCP tools', () => {
    const options = createRefactoringAgentOptions();
    const tools = options.allowedTools || [];
    
    expect(tools).toContain('mcp__git-tools__git_status');
    expect(tools).toContain('mcp__refactor-tools__analyze_complexity');
    expect(tools).toContain('mcp__preview-tools__generate_diff_preview');
  });

  it('should configure subagents correctly', () => {
    const options = createRefactoringAgentOptions();
    expect(options.agents).toHaveProperty('pattern-detector');
    expect(options.agents).toHaveProperty('code-analyzer');
    expect(options.agents).toHaveProperty('diff-generator');
  });

  it('should set permission mode based on config', () => {
    const defaultOptions = createRefactoringAgentOptions();
    expect(defaultOptions.permissionMode).toBe('default');

    const autoApplyOptions = createRefactoringAgentOptions({ autoApply: true });
    expect(autoApplyOptions.permissionMode).toBe('acceptEdits');
  });
});
