/**
 * Refactoring analysis tools for the agent
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import ts from 'typescript';

/**
 * Find duplicate code blocks across files
 */
export async function _findDuplicatesImpl(directory: string, minLines: number = 5, filePattern?: string) {
    // Simple duplicate detection using line hashing
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
      filesScanned: files.length,
      duplicatesFound: duplicates.length,
      duplicates,
    };
  }

const findDuplicates = tool(
  'find_duplicates',
  'Find duplicate or similar code blocks across files in a directory',
  {
    directory: z.string().describe('Directory to search for duplicates'),
    minLines: z.number().optional().describe('Minimum lines to consider as duplicate (default: 5)'),
    filePattern: z.string().optional().describe('Glob pattern for files to check (e.g., "*.ts")'),
  },
  async ({ directory, minLines = 5, filePattern }) => {
    const result = await _findDuplicatesImpl(directory, minLines, filePattern);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  }
);

/**
 * Analyze code complexity
 */
export async function _analyzeComplexityImpl(filePath: string) {
    const content = await fs.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    let cyclomaticComplexity = 1;
    let functionCount = 0;
    const longFunctions: Array<{ name: string; lines: number }> = [];

    function visit(node: ts.Node) {
        // Cyclomatic Complexity increments
        switch (node.kind) {
            case ts.SyntaxKind.IfStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.DoStatement:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
            case ts.SyntaxKind.ConditionalExpression:
            case ts.SyntaxKind.CaseClause:
            case ts.SyntaxKind.CatchClause:
                cyclomaticComplexity++;
                break;
            case ts.SyntaxKind.BinaryExpression:
                const binaryExpr = node as ts.BinaryExpression;
                if (
                    binaryExpr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
                    binaryExpr.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
                    binaryExpr.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
                ) {
                    cyclomaticComplexity++;
                }
                break;
        }

        // Function detection and length
        if (
            ts.isFunctionDeclaration(node) ||
            ts.isMethodDeclaration(node) ||
            ts.isArrowFunction(node) ||
            ts.isFunctionExpression(node)
        ) {
            functionCount++;
            const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
            const lines = endLine - startLine + 1;

            if (lines > 50) {
                let name = 'anonymous';
                if (ts.isFunctionDeclaration(node) && node.name) name = node.name.text;
                if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) name = node.name.text;
                if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) name = node.parent.name.text;
                
                longFunctions.push({ name, lines });
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    const lines = content.split('\n');
    return {
        file: filePath,
        totalLines: lines.length,
        codeLines: lines.filter(l => l.trim() && !l.trim().startsWith('//')).length,
        cyclomaticComplexity,
        complexityRating: cyclomaticComplexity < 10 ? 'low' : cyclomaticComplexity < 20 ? 'medium' : 'high',
        functionCount,
        longFunctions,
        suggestions: [
            ...(cyclomaticComplexity > 20 ? ['Consider breaking down complex logic into smaller functions'] : []),
            ...(longFunctions.length > 0 ? [`${longFunctions.length} function(s) exceed 50 lines - consider refactoring`] : []),
        ],
    };
}

const analyzeComplexity = tool(
  'analyze_complexity',
  'Analyze cyclomatic complexity and other code metrics for files',
  {
    filePath: z.string().describe('Path to the file to analyze'),
  },
  async ({ filePath }) => {
    const result = await _analyzeComplexityImpl(filePath);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  }
);

/**
 * Suggest refactorings based on code analysis
 */
export async function _suggestRefactoringImpl(filePath: string, focusArea: string = 'all') {
    const content = await fs.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
    const suggestions: Array<{
      type: string;
      line: number;
      description: string;
      severity: 'low' | 'medium' | 'high';
      suggestion: string;
    }> = [];

    const definedNames = new Set<{ name: string; line: number }>();
    const usedNames = new Set<string>();

    function visit(node: ts.Node) {
        // Collect defined names
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
            definedNames.add({ name: node.name.text, line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1 });
            // Naming check
            if (!/^[a-z][a-zA-Z0-9]*$/.test(node.name.text)) {
                suggestions.push({
                    type: 'naming-consistency',
                    line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                    description: `Variable '${node.name.text}' does not follow camelCase convention`,
                    severity: 'low',
                    suggestion: 'Rename to follow camelCase'
                });
            }
        }
        if (ts.isFunctionDeclaration(node) && node.name) {
            definedNames.add({ name: node.name.text, line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1 });
            if (!/^[a-z][a-zA-Z0-9]*$/.test(node.name.text)) {
                suggestions.push({
                    type: 'naming-consistency',
                    line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                    description: `Function '${node.name.text}' does not follow camelCase convention`,
                    severity: 'low',
                    suggestion: 'Rename to follow camelCase'
                });
            }
        }
        if (ts.isClassDeclaration(node) && node.name) {
            definedNames.add({ name: node.name.text, line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1 });
            if (!/^[A-Z][a-zA-Z0-9]*$/.test(node.name.text)) {
                suggestions.push({
                    type: 'naming-consistency',
                    line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                    description: `Class '${node.name.text}' does not follow PascalCase convention`,
                    severity: 'low',
                    suggestion: 'Rename to follow PascalCase'
                });
            }
        }

        // Collect used names
        if (ts.isIdentifier(node)) {
            const parent = node.parent;
            if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
                usedNames.add(node.text);
            } else if (ts.isCallExpression(parent) && parent.expression === node) {
                usedNames.add(node.text);
            } else if (ts.isExpressionStatement(parent) || ts.isBinaryExpression(parent) || ts.isVariableDeclaration(parent) && parent.initializer === node) {
                usedNames.add(node.text);
            } else if (!ts.isVariableDeclaration(parent) && !ts.isFunctionDeclaration(parent) && !ts.isClassDeclaration(parent)) {
                usedNames.add(node.text);
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    // Dead code detection
    if (focusArea === 'all' || focusArea === 'duplication') {
        for (const { name, line } of definedNames) {
            if (!usedNames.has(name) && !name.startsWith('_')) {
                suggestions.push({
                    type: 'dead-code',
                    line,
                    description: `Unused definition found: '${name}'`,
                    severity: 'medium',
                    suggestion: 'Remove unused definition or use it'
                });
            }
        }
    }

    const todoComments = (content.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/gi) || []).length;

    return {
      file: filePath,
      totalSuggestions: suggestions.length,
      todoComments,
      suggestions,
    };
}

const suggestRefactoring = tool(
  'suggest_refactoring',
  'Analyze code and suggest specific refactoring opportunities',
  {
    filePath: z.string().describe('Path to the file to analyze'),
    focusArea: z.enum(['all', 'naming', 'structure', 'duplication', 'complexity']).optional(),
  },
  async ({ filePath, focusArea = 'all' }) => {
    const result = await _suggestRefactoringImpl(filePath, focusArea);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
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
