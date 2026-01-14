/**
 * Refactoring analysis tools for the agent
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Find duplicate code blocks across files
 */
const findDuplicates = tool(
  'find_duplicates',
  'Find duplicate or similar code blocks across files in a directory',
  {
    directory: z.string().describe('Directory to search for duplicates'),
    minLines: z.number().optional().describe('Minimum lines to consider as duplicate (default: 5)'),
    filePattern: z.string().optional().describe('Glob pattern for files to check (e.g., "*.ts")'),
  },
  async ({ directory, minLines = 5, filePattern }) => {
    // Simple duplicate detection using line hashing
    const pattern = filePattern || '*';
    const files: string[] = [];

    async function walkDir(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walkDir(fullPath);
        } else if (entry.isFile() && (pattern === '*' || entry.name.endsWith(pattern.replace('*', '')))) {
          files.push(fullPath);
        }
      }
    }

    await walkDir(directory);

    const blockHashes = new Map<string, Array<{ file: string; startLine: number; lines: string[] }>>();

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i <= lines.length - minLines; i++) {
          const block = lines.slice(i, i + minLines);
          const blockText = block.join('\n').trim();

          if (blockText.length < 50) continue; // Skip tiny blocks

          const hash = Buffer.from(blockText).toString('base64').substring(0, 32);

          if (!blockHashes.has(hash)) {
            blockHashes.set(hash, []);
          }
          blockHashes.get(hash)!.push({
            file: path.relative(directory, file),
            startLine: i + 1,
            lines: block,
          });
        }
      } catch {
        // Skip files that can't be read
      }
    }

    const duplicates = Array.from(blockHashes.entries())
      .filter(([, locations]) => locations.length > 1)
      .map(([, locations]) => ({
        occurrences: locations.length,
        locations: locations.map(l => ({
          file: l.file,
          startLine: l.startLine,
          preview: l.lines.slice(0, 3).join('\n'),
        })),
      }))
      .slice(0, 20); // Limit results

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          filesScanned: files.length,
          duplicatesFound: duplicates.length,
          duplicates,
        }, null, 2),
      }],
    };
  }
);

/**
 * Analyze code complexity
 */
const analyzeComplexity = tool(
  'analyze_complexity',
  'Analyze cyclomatic complexity and other code metrics for files',
  {
    filePath: z.string().describe('Path to the file to analyze'),
  },
  async ({ filePath }) => {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Simple complexity analysis
    let complexity = 1; // Base complexity
    const complexityKeywords = [
      /\bif\b/, /\belse\b/, /\bwhile\b/, /\bfor\b/, /\bcase\b/,
      /\bcatch\b/, /\b\?\b/, /\b&&\b/, /\b\|\|\b/, /\?\?/
    ];

    for (const line of lines) {
      for (const keyword of complexityKeywords) {
        if (keyword.test(line)) {
          complexity++;
        }
      }
    }

    // Count functions
    const functionMatches = content.match(/function\s+\w+|=>\s*{|\w+\s*\([^)]*\)\s*{/g) || [];

    // Find long functions (over 50 lines)
    const longFunctions: Array<{ name: string; lines: number }> = [];
    const functionRegex = /(function\s+(\w+)|const\s+(\w+)\s*=.*=>)/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[2] || match[3] || 'anonymous';
      const startIndex = match.index;
      const startLine = content.substring(0, startIndex).split('\n').length;

      // Estimate function length by finding matching braces
      let braceCount = 0;
      let started = false;
      let endLine = startLine;

      for (let i = startLine - 1; i < lines.length; i++) {
        const line = lines[i];
        for (const char of line) {
          if (char === '{') {
            braceCount++;
            started = true;
          } else if (char === '}') {
            braceCount--;
            if (started && braceCount === 0) {
              endLine = i + 1;
              break;
            }
          }
        }
        if (started && braceCount === 0) break;
      }

      const functionLines = endLine - startLine + 1;
      if (functionLines > 50) {
        longFunctions.push({ name: functionName, lines: functionLines });
      }
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          file: filePath,
          totalLines: lines.length,
          codeLines: lines.filter(l => l.trim() && !l.trim().startsWith('//')).length,
          cyclomaticComplexity: complexity,
          complexityRating: complexity < 10 ? 'low' : complexity < 20 ? 'medium' : 'high',
          functionCount: functionMatches.length,
          longFunctions,
          suggestions: [
            ...(complexity > 20 ? ['Consider breaking down complex logic into smaller functions'] : []),
            ...(longFunctions.length > 0 ? [`${longFunctions.length} function(s) exceed 50 lines - consider refactoring`] : []),
          ],
        }, null, 2),
      }],
    };
  }
);

/**
 * Suggest refactorings based on code analysis
 */
const suggestRefactoring = tool(
  'suggest_refactoring',
  'Analyze code and suggest specific refactoring opportunities',
  {
    filePath: z.string().describe('Path to the file to analyze'),
    focusArea: z.enum(['all', 'naming', 'structure', 'duplication', 'complexity']).optional(),
  },
  async ({ filePath, focusArea = 'all' }) => {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const suggestions: Array<{
      type: string;
      line: number;
      description: string;
      severity: string;
      suggestion: string;
    }> = [];

    // Check for naming issues
    if (focusArea === 'all' || focusArea === 'naming') {
      const singleLetterVars = content.match(/\b(let|const|var)\s+[a-z]\s*=/g) || [];
      if (singleLetterVars.length > 0) {
        suggestions.push({
          type: 'improve-naming',
          line: 0,
          description: `Found ${singleLetterVars.length} single-letter variable names`,
          severity: 'medium',
          suggestion: 'Use descriptive variable names that convey meaning',
        });
      }
    }

    // Check for structural issues
    if (focusArea === 'all' || focusArea === 'structure') {
      // Deeply nested code
      let maxIndent = 0;
      let deepestLine = 0;
      lines.forEach((line, i) => {
        const indent = line.search(/\S/);
        if (indent > maxIndent) {
          maxIndent = indent;
          deepestLine = i + 1;
        }
      });

      if (maxIndent > 20) { // More than 5 levels of nesting (4 spaces each)
        suggestions.push({
          type: 'simplify-conditional',
          line: deepestLine,
          description: `Deep nesting detected (${Math.floor(maxIndent / 4)} levels)`,
          severity: 'high',
          suggestion: 'Consider early returns, guard clauses, or extracting nested logic',
        });
      }

      // Long parameter lists
      const longParams = content.match(/\([^)]{100,}\)/g) || [];
      if (longParams.length > 0) {
        suggestions.push({
          type: 'extract-class',
          line: 0,
          description: 'Functions with many parameters detected',
          severity: 'medium',
          suggestion: 'Consider using an options object or extracting a class',
        });
      }
    }

    // Check for potential dead code
    const todoComments = (content.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/gi) || []).length;
    const commentedCode = (content.match(/\/\/\s*(const|let|var|function|if|for|while)/g) || []).length;

    if (commentedCode > 3) {
      suggestions.push({
        type: 'remove-dead-code',
        line: 0,
        description: `Found ${commentedCode} instances of commented-out code`,
        severity: 'low',
        suggestion: 'Remove commented-out code - use version control for history',
      });
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          file: filePath,
          totalSuggestions: suggestions.length,
          todoComments,
          suggestions,
        }, null, 2),
      }],
    };
  }
);

/**
 * Create the refactoring tools MCP server
 */
export function createRefactorToolsServer() {
  return createSdkMcpServer({
    name: 'refactor-tools',
    version: '1.0.0',
    tools: [findDuplicates, analyzeComplexity, suggestRefactoring],
  });
}

export { findDuplicates, analyzeComplexity, suggestRefactoring };
