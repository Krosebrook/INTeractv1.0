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
export async function _listBranchesImpl(repoPath: string, includeRemote?: boolean) {
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

  return { branches, count: branches.length };
}

const listBranches = tool(
  'git_list_branches',
  'List all branches in a git repository, showing which one is currently checked out',
  {
    repoPath: z.string().describe('Path to the git repository'),
    includeRemote: z.boolean().optional().describe('Include remote branches'),
  },
  async ({ repoPath, includeRemote }) => {
    const result = await _listBranchesImpl(repoPath, includeRemote);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  }
);

/**
 * Switch to a different branch
 */
export async function _switchBranchImpl(repoPath: string, branchName: string, create?: boolean) {
  const flag = create ? '-c' : '';
  await runGitCommand(repoPath, `switch ${flag} ${branchName}`);
  return { success: true, branchName };
}

const switchBranch = tool(
  'git_switch_branch',
  'Switch to a different branch in the repository',
  {
    repoPath: z.string().describe('Path to the git repository'),
    branchName: z.string().describe('Name of the branch to switch to'),
    create: z.boolean().optional().describe('Create the branch if it does not exist'),
  },
  async ({ repoPath, branchName, create }) => {
    await _switchBranchImpl(repoPath, branchName, create);
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
export async function _diffBranchesImpl(repoPath: string, baseBranch: string, compareBranch: string, pathFilter?: string) {
  const pathArg = pathFilter ? `-- ${pathFilter}` : '';
  const output = await runGitCommand(repoPath, `diff ${baseBranch}...${compareBranch} --stat ${pathArg}`);
  const fullDiff = await runGitCommand(repoPath, `diff ${baseBranch}...${compareBranch} ${pathArg}`);

  return {
    summary: output,
    diff: fullDiff.substring(0, 50000), // Limit size
    truncated: fullDiff.length > 50000,
  };
}

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
    const result = await _diffBranchesImpl(repoPath, baseBranch, compareBranch, pathFilter);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  }
);

/**
 * Get commit log
 */
export async function _getLogImpl(repoPath: string, branch?: string, limit?: number, pathFilter?: string) {
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

  return { commits, count: commits.length };
}

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
    const result = await _getLogImpl(repoPath, branch, limit, pathFilter);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  }
);

/**
 * Get repository status
 */
export async function _getStatusImpl(repoPath: string) {
  const branch = await runGitCommand(repoPath, 'branch --show-current');
  const status = await runGitCommand(repoPath, 'status --porcelain');
  const remote = await runGitCommand(repoPath, 'remote -v').catch(() => 'No remotes configured');

  const files = status.split('\n').filter(Boolean).map(line => ({
    status: line.substring(0, 2).trim(),
    path: line.substring(3),
  }));

  return {
    currentBranch: branch,
    remote: remote.split('\n')[0] || 'None',
    modifiedFiles: files.filter(f => f.status === 'M').map(f => f.path),
    stagedFiles: files.filter(f => f.status === 'A' || f.status === 'MM').map(f => f.path),
    untrackedFiles: files.filter(f => f.status === '??').map(f => f.path),
    totalChanges: files.length,
  };
}

const getStatus = tool(
  'git_status',
  'Get the current status of the repository including modified, staged, and untracked files',
  {
    repoPath: z.string().describe('Path to the git repository'),
  },
  async ({ repoPath }) => {
    const result = await _getStatusImpl(repoPath);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
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
