#!/usr/bin/env node
/**
 * INTeract-ive Agent - Full-featured Refactoring Agent
 * TypeScript Implementation
 */

import { createMasterAgent, createRefactoringOrchestrator } from './agents/refactoring-agent.js';
import type { RefactoringConfig, RepositoryConfig } from './types/index.js';

interface CLIArgs {
  repos: string[];
  prompt?: string;
  autoApply: boolean;
  dryRun: boolean;
  outputFormat: 'detailed' | 'summary' | 'json';
  help: boolean;
}

function parseArgs(args: string[]): CLIArgs {
  const result: CLIArgs = {
    repos: [],
    autoApply: false,
    dryRun: false,
    outputFormat: 'detailed',
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-h':
      case '--help':
        result.help = true;
        break;
      case '-r':
      case '--repo':
        if (args[i + 1]) {
          result.repos.push(args[++i]);
        }
        break;
      case '-p':
      case '--prompt':
        if (args[i + 1]) {
          result.prompt = args[++i];
        }
        break;
      case '--auto-apply':
        result.autoApply = true;
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '-o':
      case '--output':
        if (args[i + 1]) {
          const format = args[++i];
          if (format === 'detailed' || format === 'summary' || format === 'json') {
            result.outputFormat = format;
          }
        }
        break;
      default:
        // Treat as repo path if it doesn't start with -
        if (!arg.startsWith('-')) {
          result.repos.push(arg);
        }
    }
  }

  return result;
}

function showHelp(): void {
  console.log(`
INTeract-ive Agent - Refactoring Agent
======================================

Usage: npm start -- [options] [repo-paths...]

Options:
  -h, --help          Show this help message
  -r, --repo <path>   Add a repository path to analyze (can be used multiple times)
  -p, --prompt <text> Initial prompt for the agent
  --auto-apply        Automatically apply suggested changes
  --dry-run           Show what would be changed without applying
  -o, --output <fmt>  Output format: detailed, summary, or json

Examples:
  npm start -- /path/to/repo
  npm start -- -r /repo1 -r /repo2 -p "Find and fix code duplication"
  npm start -- --dry-run /path/to/repo
  npm start -- --auto-apply -p "Simplify complex conditionals" /path/to/repo

Environment:
  ANTHROPIC_API_KEY   Required. Your Anthropic API key.
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required.');
    console.error('Get your API key from: https://console.anthropic.com/');
    process.exit(1);
  }

  // Default to current directory if no repos specified
  if (args.repos.length === 0) {
    args.repos.push(process.cwd());
  }

  const repositories: RepositoryConfig[] = args.repos.map(path => ({ path }));

  // Build initial prompt
  let prompt = args.prompt || '';

  if (!prompt) {
    if (repositories.length === 1) {
      prompt = `Analyze the repository at ${repositories[0].path} and identify refactoring opportunities. Start by getting the git status and then look for code that could be improved.`;
    } else {
      prompt = `I have ${repositories.length} repositories to refactor: ${repositories.map(r => r.path).join(', ')}. Help me analyze and improve them.`;
    }
  }

  console.log('INTeract-ive Agent - Starting refactoring analysis...');
  console.log('Repositories:', repositories.map(r => r.path).join(', '));
  console.log('---');

  try {
    const supervisor = createRefactoringOrchestrator();
    const master = createMasterAgent(supervisor);

    const result = await master.run(prompt);

    console.log('\n---');
    console.log('Analysis complete.');
    console.log(result.response);
    
    console.log('\nMetadata:');
    console.log(`- Iterations: ${result.iterations}`);
    console.log(`- Tools Used: ${result.toolsUsed.join(', ')}`);
    console.log(`- Tokens: ${result.totalTokens.input} in / ${result.totalTokens.output} out`);

  } catch (error) {
    console.error('Error running refactoring agent:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { runRefactoringAgent, createRefactoringAgentOptions };
export type { RefactoringConfig, RepositoryConfig };

// Run if executed directly
main().catch(console.error);
