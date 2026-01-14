/**
 * Core Agent Implementation
 * 
 * Provides the foundational Agent class for building
 * Claude-powered agents with tool use capabilities.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';

/**
 * Tool definition for agent capabilities
 */
export interface Tool {
  /** Unique tool identifier */
  name: string;
  /** Human-readable description of what the tool does */
  description: string;
  /** JSON Schema defining the tool's input parameters */
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  /** Async function that executes the tool */
  handler: (input: any) => Promise<any>;
}

/**
 * Configuration options for creating an Agent
 */
export interface AgentConfig {
  /** Display name for the agent */
  name: string;
  /** Claude model to use */
  model: string;
  /** Maximum tokens for responses */
  maxTokens: number;
  /** Array of tools available to the agent */
  tools: Tool[];
  /** System prompt defining agent behavior */
  systemPrompt: string;
  /** Optional: Maximum agentic loop iterations (default: 10) */
  maxIterations?: number;
}

/**
 * Result of an agent execution
 */
export interface AgentResult {
  /** Final text response from the agent */
  response: string;
  /** Number of agentic loop iterations */
  iterations: number;
  /** Tools that were invoked during execution */
  toolsUsed: string[];
  /** Total tokens used */
  totalTokens: {
    input: number;
    output: number;
  };
}

/**
 * Agent class implementing the agentic loop pattern
 */
export class Agent {
  private client: Anthropic;
  private config: AgentConfig;
  private conversationHistory: MessageParam[] = [];

  constructor(config: AgentConfig) {
    this.client = new Anthropic();
    this.config = {
      ...config,
      maxIterations: config.maxIterations ?? 10
    };
  }

  /**
   * Execute the agent with a user message
   */
  async run(userMessage: string): Promise<AgentResult> {
    const toolsUsed: string[] = [];
    let iterations = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    let response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      system: this.config.systemPrompt,
      tools: this.config.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema
      })),
      messages: this.conversationHistory
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    while (
      response.stop_reason === 'tool_use' &&
      iterations < this.config.maxIterations!
    ) {
      iterations++;

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults: ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const tool = this.config.tools.find(t => t.name === toolUse.name);

          if (!tool) {
            return {
              type: 'tool_result' as const,
              tool_use_id: toolUse.id,
              content: `Error: Unknown tool "${toolUse.name}"`,
              is_error: true
            };
          }

          toolsUsed.push(tool.name);

          try {
            const result = await tool.handler(toolUse.input);
            return {
              type: 'tool_result' as const,
              tool_use_id: toolUse.id,
              content: typeof result === 'string'
                ? result
                : JSON.stringify(result, null, 2)
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
              type: 'tool_result' as const,
              tool_use_id: toolUse.id,
              content: `Error: ${errorMessage}`,
              is_error: true
            };
          }
        })
      );

      this.conversationHistory.push({
        role: 'assistant',
        content: response.content
      });
      this.conversationHistory.push({
        role: 'user',
        content: toolResults
      });

      response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        system: this.config.systemPrompt,
        tools: this.config.tools.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema
        })),
        messages: this.conversationHistory
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;
    }

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    const finalResponse = textBlock?.text ?? '';

    this.conversationHistory.push({
      role: 'assistant',
      content: response.content
    });

    return {
      response: finalResponse,
      iterations,
      toolsUsed: [...new Set(toolsUsed)],
      totalTokens: {
        input: totalInputTokens,
        output: totalOutputTokens
      }
    };
  }

  reset(): void {
    this.conversationHistory = [];
  }
}
