/**
 * Type definitions for INTeract-ive Agent
 */

export interface RefactoringConfig {
  repositories: RepositoryConfig[];
  outputFormat: 'detailed' | 'summary' | 'json';
  autoApply: boolean;
  dryRun: boolean;
}

export interface RepositoryConfig {
  path: string;
  branches?: string[];
  targetBranch?: string;
}

export interface RefactoringSuggestion {
  id: string;
  type: RefactoringType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  startLine: number;
  endLine: number;
  description: string;
  suggestedChange: string;
  beforeCode: string;
  afterCode: string;
}

export type RefactoringType =
  | 'extract-function'
  | 'extract-variable'
  | 'inline-function'
  | 'rename'
  | 'move'
  | 'remove-duplication'
  | 'simplify-conditional'
  | 'extract-class'
  | 'remove-dead-code'
  | 'improve-naming'
  | 'add-type-annotations'
  | 'modernize-syntax';

export interface CodePattern {
  name: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
  locations: PatternLocation[];
}

export interface PatternLocation {
  file: string;
  line: number;
  column: number;
  snippet: string;
}

export interface DiffResult {
  file: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
}

export interface AnalysisReport {
  repository: string;
  branch: string;
  timestamp: string;
  patterns: CodePattern[];
  suggestions: RefactoringSuggestion[];
  metrics: CodeMetrics;
}

export interface CodeMetrics {
  totalFiles: number;
  totalLines: number;
  averageComplexity: number;
  duplicateBlocks: number;
  codeSmells: number;
}

export interface GitBranch {
  name: string;
  current: boolean;
  lastCommit: string;
  lastCommitDate: string;
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}
