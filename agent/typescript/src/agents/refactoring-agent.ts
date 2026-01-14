/**
 * Main Refactoring Agent (Modernized Framework Version)
 * 
 * Orchestrates specialized subagents using the Supervisor pattern,
 * with built-in resilience and custom tool handling.
 */

import { SupervisorAgent } from '../framework/orchestration/supervisor.js';
import { patternDetector } from './subagents/pattern-detector.js';
import { codeAnalyzer } from './subagents/code-analyzer.js';
import { diffGenerator } from './subagents/diff-generator.js';
import { 
  listBranchesTool, 
  switchBranchTool, 
  getStatusTool, 
  getLogTool, 
  diffBranchesTool 
} from '../framework/tools/git-tools.js';
import { createSummaryReportTool } from '../framework/tools/preview-tools.js';
import { createSupervisorTool } from '../framework/tools/supervisor-tool.js';
import { Agent } from '../framework/core/agent.js';

/**
 * Configure the Modernized Refactoring Supervisor
 */
export function createRefactoringOrchestrator() {
  const supervisor = new SupervisorAgent({
    maxConcurrentTasks: 3,
    taskTimeoutMs: 120000,
    maxRetries: 3
  });

  // Register Worker Agents
  supervisor.registerWorker('pattern-detector', patternDetector, ['detect-patterns']);
  supervisor.registerWorker('code-analyzer', codeAnalyzer, ['analyze-structure']);
  supervisor.registerWorker('diff-generator', diffGenerator, ['generate-diff']);

  return supervisor;
}

/**
 * Configure the Master Agent with Supervisor access
 */
export function createMasterAgent(supervisor: SupervisorAgent) {
  return new Agent({
    name: 'MasterRefactoringAgent',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 8192,
    tools: [
      listBranchesTool,
      switchBranchTool,
      getStatusTool,
      getLogTool,
      diffBranchesTool,
      createSummaryReportTool,
      createSupervisorTool(supervisor)
    ],
    systemPrompt: `You are the Master Refactoring Agent. Your job is to orchestrate a team of specialized subagents to refactor code safely.

## Your Subagents
1. **pattern-detector**: Finds code smells and anti-patterns. Use for "detect-patterns" tasks.
2. **code-analyzer**: Analyzes architecture and complexity. Use for "analyze-structure" tasks.
3. **diff-generator**: Creates and applies changes. Use for "generate-diff" tasks.

## Your Workflow
1. **Explore**: Use Git tools to understand the repository state.
2. **Tasking**: Delegate analysis to subagents using the delegate_task tool.
3. **Review**: Combine findings and propose a plan to the user.
4. **Execute**: Delegate change generation to the diff-generator.

You have direct access to Git and Reporting tools. For complex analysis and transformations, ALWAYS delegate to subagents.`
  });
}
