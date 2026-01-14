/**
 * Preview and reporting tools for the refactoring agent
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as fs from 'fs/promises';

/**
 * Generate a diff preview between original and proposed changes
 */
export async function _generateDiffPreviewImpl(filePath: string, originalContent: string, newContent: string, contextLines: number = 3) {
  const originalLines = originalContent.split('\n');
  const newLines = newContent.split('\n');

  const changes: Array<{
    type: 'add' | 'remove' | 'unchanged';
    lineNum: number;
    content: string;
  }> = [];

  const maxLen = Math.max(originalLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const origLine = originalLines[i];
    const newLine = newLines[i];

    if (origLine === undefined && newLine !== undefined) {
      changes.push({ type: 'add', lineNum: i + 1, content: newLine });
    } else if (newLine === undefined && origLine !== undefined) {
      changes.push({ type: 'remove', lineNum: i + 1, content: origLine });
    } else if (origLine !== newLine) {
      changes.push({ type: 'remove', lineNum: i + 1, content: origLine ?? '' });
      changes.push({ type: 'add', lineNum: i + 1, content: newLine ?? '' });
    } else {
      changes.push({ type: 'unchanged', lineNum: i + 1, content: origLine ?? '' });
    }
  }

  let diffOutput = `--- a/${filePath}\n+++ b/${filePath}\n`;
  const addedCount = changes.filter(c => c.type === 'add').length;
  const removedCount = changes.filter(c => c.type === 'remove').length;

  let inChange = false;
  let contextBuffer: string[] = [];

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    if (change.type !== 'unchanged') {
      if (!inChange && contextBuffer.length > 0) {
        diffOutput += contextBuffer.slice(-contextLines).join('\n') + '\n';
      }
      inChange = true;
      contextBuffer = [];
      const prefix = change.type === 'add' ? '+' : '-';
      diffOutput += `${prefix}${change.content}\n`;
    } else {
      if (inChange) {
        contextBuffer.push(` ${change.content}`);
        if (contextBuffer.length >= contextLines) {
          diffOutput += contextBuffer.join('\n') + '\n';
          inChange = false;
          contextBuffer = [];
        }
      } else {
        contextBuffer.push(` ${change.content}`);
        if (contextBuffer.length > contextLines * 2) {
          contextBuffer.shift();
        }
      }
    }
  }

  return {
    file: filePath,
    additions: addedCount,
    deletions: removedCount,
    diff: diffOutput,
    summary: `${addedCount} additions, ${removedCount} deletions`,
  };
}

const generateDiffPreview = tool(
  'generate_diff_preview',
  'Generate a visual diff preview showing before and after changes',
  {
    filePath: z.string().describe('Path to the file'),
    originalContent: z.string().describe('Original file content'),
    newContent: z.string().describe('Proposed new content'),
    contextLines: z.number().optional().describe('Number of context lines around changes (default: 3)'),
  },
  async ({ filePath, originalContent, newContent, contextLines = 3 }) => {
    const result = await _generateDiffPreviewImpl(filePath, originalContent, newContent, contextLines);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  }
);

/**
 * Create a summary report of all refactoring suggestions
 */
export async function _createSummaryReportImpl(repositoryPath: string, analysisResults: string, outputPath?: string) {
  let results: Record<string, any>;
  try {
    results = JSON.parse(analysisResults);
  } catch {
    throw new Error('Invalid JSON in analysisResults');
  }

  const now = new Date().toISOString();

  const complexityResults = results.complexity as Array<{ file: string; score: number }> | undefined;
  const duplicateResults = results.duplicates as Array<{ count: number; description: string }> | undefined;
  const suggestionResults = results.suggestions as Array<{ type: string; file: string; description: string }> | undefined;

  const report = `# Refactoring Analysis Report

## Repository
- **Path:** ${repositoryPath}
- **Generated:** ${now}

## Summary
- **Files Analyzed:** ${results.filesAnalyzed || 'N/A'}
- **Total Suggestions:** ${results.totalSuggestions || 0}
- **Critical Issues:** ${results.criticalIssues || 0}

## Findings by Category

### Code Complexity
${complexityResults?.map(c => `- ${c.file}: Complexity score ${c.score}`).join('\n') || 'No complexity issues found'}

### Code Duplication
${duplicateResults?.map(d => `- ${d.count} occurrences: ${d.description}`).join('\n') || 'No significant duplication found'}

### Refactoring Suggestions
${suggestionResults?.map(s => `- **${s.type}** in ${s.file}: ${s.description}`).join('\n') || 'No suggestions'}

## Recommended Actions

1. Address critical issues first
2. Review and apply suggested refactorings
3. Re-run analysis to verify improvements

---
*Generated by INTeract-ive Agent*
`;

  if (outputPath) {
    await fs.writeFile(outputPath, report, 'utf-8');
  }

  return {
    report,
    savedTo: outputPath || 'Not saved',
    generatedAt: now,
  };
}

const createSummaryReport = tool(
  'create_summary_report',
  'Generate a comprehensive summary report of refactoring analysis',
  {
    repositoryPath: z.string().describe('Path to the repository'),
    analysisResults: z.string().describe('JSON string of analysis results'),
    outputPath: z.string().optional().describe('Path to save the report (optional)'),
  },
  async ({ repositoryPath, analysisResults, outputPath }) => {
    const result = await _createSummaryReportImpl(repositoryPath, analysisResults, outputPath);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  }
);

/**
 * Create the preview tools MCP server
 */
export function createPreviewToolsServer() {
  return createSdkMcpServer({
    name: 'preview-tools',
    version: '1.0.0',
    tools: [generateDiffPreview, createSummaryReport],
  });
}

export { generateDiffPreview, createSummaryReport };
