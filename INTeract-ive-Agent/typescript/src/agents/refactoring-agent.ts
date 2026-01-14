/**
 * Main Refactoring Agent
 * Orchestrates the refactoring process using subagents and tools
 */

import { query, type Options, type AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { createGitToolsServer } from '../tools/git-tools.js';
import { createRefactorToolsServer } from '../tools/refactor-tools.js';
import { createPreviewToolsServer } from '../tools/preview-tools.js';
import { patternDetectorAgent } from './subagents/pattern-detector.js';
import { codeAnalyzerAgent } from './subagents/code-analyzer.js';
import { diffGeneratorAgent } from './subagents/diff-generator.js';
import type { RefactoringConfig } from '../types/index.js';

const REFACTORING_SYSTEM_PROMPT = `You are an expert code refactoring agent. Your purpose is to analyze codebases, identify improvement opportunities, and apply refactorings safely.

## Your Capabilities

You have access to:
1. **Git Tools** - For branch management, diffs, and version control
2. **Refactoring Tools** - For code analysis, duplicate detection, and complexity measurement
3. **Preview Tools** - For generating diffs and summary reports
4. **Subagents**:
   - pattern-detector: Finds code smells and anti-patterns
   - code-analyzer: Analyzes architecture and dependencies
   - diff-generator: Creates and applies code changes

## Workflow

When asked to refactor code:

1. **Understand the scope**
   - What repository/files are being targeted?
   - What type of refactoring is requested?
   - Are there specific concerns or constraints?

2. **Analyze the codebase**
   - Use git tools to understand the current state
   - Use pattern-detector to find issues
   - Use code-analyzer to understand structure

3. **Propose changes**
   - Prioritize by impact and risk
   - Generate diffs for review
   - Explain the benefits of each change

4. **Apply changes (if approved)**
   - Make changes incrementally
   - Verify each change doesn't break anything
   - Generate a summary report

## Guidelines

- Always preview changes before applying them
- Preserve existing functionality
- Follow the project's coding style
- Document significant changes
- Be conservative with risky refactorings
- Ask for clarification when the request is ambiguous

## Multi-Repository Support

You can work with multiple repositories. When switching between repos:
- Use git_status to confirm current location
- Use git_switch_branch for branch navigation
- Keep track of which repo you're analyzing

Start by asking what the user wants to refactor, or analyze the current directory if a path is provided.`;

/**
 * Subagent definitions for the refactoring agent
 */
const subagents: Record<string, AgentDefinition> = {
  'pattern-detector': patternDetectorAgent,
  'code-analyzer': codeAnalyzerAgent,
  'diff-generator': diffGeneratorAgent,
};

/**
 * Create the refactoring agent options
 */
export function createRefactoringAgentOptions(config?: Partial<RefactoringConfig>): Options {
  const gitTools = createGitToolsServer();
  const refactorTools = createRefactorToolsServer();
  const previewTools = createPreviewToolsServer();

  return {
    systemPrompt: REFACTORING_SYSTEM_PROMPT,
    allowedTools: [
      // Built-in tools
      'Read',
      'Write',
      'Edit',
      'Bash',
      'Glob',
      'Grep',
      'Task',
      // MCP tools - Git
      'mcp__git-tools__git_list_branches',
      'mcp__git-tools__git_switch_branch',
      'mcp__git-tools__git_diff_branches',
      'mcp__git-tools__git_log',
      'mcp__git-tools__git_status',
      // MCP tools - Refactoring
      'mcp__refactor-tools__find_duplicates',
      'mcp__refactor-tools__analyze_complexity',
      'mcp__refactor-tools__suggest_refactoring',
      // MCP tools - Preview
      'mcp__preview-tools__generate_diff_preview',
      'mcp__preview-tools__create_summary_report',
    ],
    mcpServers: {
      'git-tools': gitTools,
      'refactor-tools': refactorTools,
      'preview-tools': previewTools,
    },
    agents: subagents,
    permissionMode: config?.autoApply ? 'acceptEdits' : 'default',
    cwd: config?.repositories?.[0]?.path,
  };
}

/**
 * Run the refactoring agent with a prompt
 */
export async function* runRefactoringAgent(
  prompt: string,
  config?: Partial<RefactoringConfig>
): AsyncGenerator<unknown> {
  const options = createRefactoringAgentOptions(config);

  for await (const message of query({ prompt, options })) {
    yield message;
  }
}

export { subagents, REFACTORING_SYSTEM_PROMPT };
