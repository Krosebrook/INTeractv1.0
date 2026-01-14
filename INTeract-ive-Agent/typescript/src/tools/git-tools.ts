/**
 * Git tools for the refactoring agent
 * These are implemented as SDK MCP tools
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Execute a git command in the specified directory
 */
async function runGitCommand(cwd: string, args: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`git ${args}`, { cwd, maxBuffer: 10 * 1024 * 1024 });
    return stdout.trim();
  } catch (error) {
    const err = error as { stderr?: string; message: string };
    throw new Error(err.stderr || err.message);
  }
}

/**
 * List all branches in a repository
 */
const listBranches = tool(
  'git_list_branches',
  'List all branches in a git repository, showing which one is currently checked out',
  {
    repoPath: z.string().describe('Path to the git repository'),
    includeRemote: z.boolean().optional().describe('Include remote branches'),
  },
  async ({ repoPath, includeRemote }) => {
    const flag = includeRemote ? '-a' : '';
    const output = await runGitCommand(repoPath, `branch ${flag} --format="%(refname:short)|%(HEAD)|%(objectname:short)|%(committerdate:relative)"`);

    const branches = output.split('\n').filter(Boolean).map(line => {
      const [name, isCurrent, commit, date] = line.split('|');
      return {
        name,
        current: isCurrent === '*',
        lastCommit: commit,
        lastCommitDate: date,
      };
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ branches, count: branches.length }, null, 2),
      }],
    };
  }
);

/**
 * Switch to a different branch
 */
const switchBranch = tool(
  'git_switch_branch',
  'Switch to a different branch in the repository',
  {
    repoPath: z.string().describe('Path to the git repository'),
    branchName: z.string().describe('Name of the branch to switch to'),
    create: z.boolean().optional().describe('Create the branch if it does not exist'),
  },
  async ({ repoPath, branchName, create }) => {
    const flag = create ? '-c' : '';
    await runGitCommand(repoPath, `switch ${flag} ${branchName}`);

    return {
      content: [{
        type: 'text' as const,
        text: `Successfully switched to branch: ${branchName}`,
      }],
    };
  }
);

/**
 * Get the diff between two branches
 */
const diffBranches = tool(
  'git_diff_branches',
  'Get the diff between two branches showing what changes exist',
  {
    repoPath: z.string().describe('Path to the git repository'),
    baseBranch: z.string().describe('Base branch to compare from'),
    compareBranch: z.string().describe('Branch to compare against base'),
    pathFilter: z.string().optional().describe('Optional path filter (e.g., "src/")'),
  },
  async ({ repoPath, baseBranch, compareBranch, pathFilter }) => {
    const pathArg = pathFilter ? `-- ${pathFilter}` : '';
    const output = await runGitCommand(repoPath, `diff ${baseBranch}...${compareBranch} --stat ${pathArg}`);
    const fullDiff = await runGitCommand(repoPath, `diff ${baseBranch}...${compareBranch} ${pathArg}`);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          summary: output,
          diff: fullDiff.substring(0, 50000), // Limit size
          truncated: fullDiff.length > 50000,
        }, null, 2),
      }],
    };
  }
);

/**
 * Get commit log
 */
const getLog = tool(
  'git_log',
  'Get the commit history for a branch',
  {
    repoPath: z.string().describe('Path to the git repository'),
    branch: z.string().optional().describe('Branch to get log for (defaults to current)'),
    limit: z.number().optional().describe('Maximum number of commits to return'),
    pathFilter: z.string().optional().describe('Optional path filter'),
  },
  async ({ repoPath, branch, limit, pathFilter }) => {
    const branchArg = branch || 'HEAD';
    const limitArg = limit ? `-n ${limit}` : '-n 50';
    const pathArg = pathFilter ? `-- ${pathFilter}` : '';

    const output = await runGitCommand(
      repoPath,
      `log ${branchArg} ${limitArg} --format="%H|%an|%ad|%s" --date=short ${pathArg}`
    );

    const commits = output.split('\n').filter(Boolean).map(line => {
      const [hash, author, date, message] = line.split('|');
      return { hash, author, date, message };
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ commits, count: commits.length }, null, 2),
      }],
    };
  }
);

/**
 * Get repository status
 */
const getStatus = tool(
  'git_status',
  'Get the current status of the repository including modified, staged, and untracked files',
  {
    repoPath: z.string().describe('Path to the git repository'),
  },
  async ({ repoPath }) => {
    const branch = await runGitCommand(repoPath, 'branch --show-current');
    const status = await runGitCommand(repoPath, 'status --porcelain');
    const remote = await runGitCommand(repoPath, 'remote -v').catch(() => 'No remotes configured');

    const files = status.split('\n').filter(Boolean).map(line => ({
      status: line.substring(0, 2).trim(),
      path: line.substring(3),
    }));

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          currentBranch: branch,
          remote: remote.split('\n')[0] || 'None',
          modifiedFiles: files.filter(f => f.status === 'M').map(f => f.path),
          stagedFiles: files.filter(f => f.status === 'A' || f.status === 'MM').map(f => f.path),
          untrackedFiles: files.filter(f => f.status === '??').map(f => f.path),
          totalChanges: files.length,
        }, null, 2),
      }],
    };
  }
);

/**
 * Create the git tools MCP server
 */
export function createGitToolsServer() {
  return createSdkMcpServer({
    name: 'git-tools',
    version: '1.0.0',
    tools: [listBranches, switchBranch, diffBranches, getLog, getStatus],
  });
}

export { listBranches, switchBranch, diffBranches, getLog, getStatus };
