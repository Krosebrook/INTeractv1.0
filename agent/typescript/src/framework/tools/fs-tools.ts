/**
 * Filesystem tools for the new framework
 */

import { Tool } from '../core/agent.js';
import * as fs from 'fs/promises';
import { glob } from 'glob';

export const readFileTool: Tool = {
  name: 'read_file',
  description: 'Read the contents of a file',
  input_schema: {
    type: 'object',
    properties: {
      filePath: { type: 'string' }
    },
    required: ['filePath']
  },
  handler: async (input: any) => {
    return await fs.readFile(input.filePath, 'utf-8');
  }
};

export const writeFileTool: Tool = {
  name: 'write_file',
  description: 'Write content to a file',
  input_schema: {
    type: 'object',
    properties: {
      filePath: { type: 'string' },
      content: { type: 'string' }
    },
    required: ['filePath', 'content']
  },
  handler: async (input: any) => {
    await fs.writeFile(input.filePath, input.content, 'utf-8');
    return { success: true };
  }
};

export const globTool: Tool = {
  name: 'glob',
  description: 'Search for files using glob patterns',
  input_schema: {
    type: 'object',
    properties: {
      pattern: { type: 'string' },
      cwd: { type: 'string' }
    },
    required: ['pattern']
  },
  handler: async (input: any) => {
    return await glob(input.pattern, { cwd: input.cwd });
  }
};
