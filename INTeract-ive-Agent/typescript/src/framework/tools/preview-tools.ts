/**
 * Preview tools for the new framework
 */

import { Tool } from '../core/agent.js';
import { _generateDiffPreviewImpl, _createSummaryReportImpl } from '../../tools/preview-tools.js';

export const generateDiffPreviewTool: Tool = {
  name: 'generate_diff_preview',
  description: 'Generate a visual diff preview showing before and after changes',
  input_schema: {
    type: 'object',
    properties: {
      filePath: { type: 'string' },
      originalContent: { type: 'string' },
      newContent: { type: 'string' },
      contextLines: { type: 'number' }
    },
    required: ['filePath', 'originalContent', 'newContent']
  },
  handler: async (input: any) => _generateDiffPreviewImpl(input.filePath, input.originalContent, input.newContent, input.contextLines)
};

export const createSummaryReportTool: Tool = {
  name: 'create_summary_report',
  description: 'Generate a comprehensive summary report of refactoring analysis',
  input_schema: {
    type: 'object',
    properties: {
      repositoryPath: { type: 'string' },
      analysisResults: { type: 'string' },
      outputPath: { type: 'string' }
    },
    required: ['repositoryPath', 'analysisResults']
  },
  handler: async (input: any) => _createSummaryReportImpl(input.repositoryPath, input.analysisResults, input.outputPath)
};
