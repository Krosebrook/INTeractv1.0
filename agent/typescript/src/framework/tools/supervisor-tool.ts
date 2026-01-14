/**
 * Supervisor Tool for the Master Agent
 */

import { Tool } from '../core/agent.js';
import { SupervisorAgent } from '../orchestration/supervisor.js';

export function createSupervisorTool(supervisor: SupervisorAgent): Tool {
  return {
    name: 'delegate_task',
    description: 'Delegate a specialized task to a subagent (pattern-detector, code-analyzer, or diff-generator)',
    input_schema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Unique identifier for the task' },
        type: { 
          type: 'string', 
          enum: ['detect-patterns', 'analyze-structure', 'generate-diff'],
          description: 'Type of capability needed'
        },
        input: { 
          type: 'object', 
          description: 'Specific instructions or data for the subagent'
        }
      },
      required: ['taskId', 'type', 'input']
    },
    handler: async (input: any) => {
      await supervisor.submitTask({
        id: input.taskId,
        type: input.type,
        input: input.input
      });

      await supervisor.orchestrate();
      
      const result = supervisor.getTaskStatus(input.taskId);
      return result?.result || result?.error || 'Task failed without error';
    }
  };
}
