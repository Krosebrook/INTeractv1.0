/**
 * Refactoring analysis tools for the new framework
 */

import { Tool } from '../core/agent.js';
import { _findDuplicatesImpl, _analyzeComplexityImpl, _suggestRefactoringImpl } from '../../tools/refactor-tools.js';

export const findDuplicatesTool: Tool = {
  name: 'find_duplicates',
  description: 'Find duplicate or similar code blocks across files in a directory',
  input_schema: {
    type: 'object',
    properties: {
      directory: { type: 'string', description: 'Directory to search for duplicates' },
      minLines: { type: 'number', description: 'Minimum lines to consider as duplicate (default: 5)' },
      filePattern: { type: 'string', description: 'Glob pattern for files to check (e.g., "*.ts")' }
    },
    required: ['directory']
  },
  handler: async (input: any) => {
    return await _findDuplicatesImpl(input.directory, input.minLines, input.filePattern);
  }
};

export const analyzeComplexityTool: Tool = {
  name: 'analyze_complexity',
  description: 'Analyze cyclomatic complexity and other code metrics for files',
  input_schema: {
    type: 'object',
    properties: {
      filePath: { type: 'string', description: 'Path to the file to analyze' }
    },
    required: ['filePath']
  },
  handler: async (input: any) => {
    return await _analyzeComplexityImpl(input.filePath);
  }
};

export const suggestRefactoringTool: Tool = {
  name: 'suggest_refactoring',
  description: 'Analyze code and suggest specific refactoring opportunities',
  input_schema: {
    type: 'object',
    properties: {
      filePath: { type: 'string', description: 'Path to the file to analyze' },
      focusArea: { 
        type: 'string', 
        enum: ['all', 'naming', 'structure', 'duplication', 'complexity'],
        description: 'Area of focus for suggestions'
      }
    },
    required: ['filePath']
  },
  handler: async (input: any) => {
    return await _suggestRefactoringImpl(input.filePath, input.focusArea);
  }
};
