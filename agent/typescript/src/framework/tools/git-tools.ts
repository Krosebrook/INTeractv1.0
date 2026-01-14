/**
 * Git tools for the new framework
 */

import { Tool } from '../core/agent.js';
import { 
  _listBranchesImpl, 
  _switchBranchImpl, 
  _diffBranchesImpl, 
  _getLogImpl, 
  _getStatusImpl 
} from '../../tools/git-tools.js';

export const listBranchesTool: Tool = {
  name: 'git_list_branches',
  description: 'List all branches in a git repository',
  input_schema: {
    type: 'object',
    properties: {
      repoPath: { type: 'string' },
      includeRemote: { type: 'boolean' }
    },
    required: ['repoPath']
  },
  handler: async (input: any) => _listBranchesImpl(input.repoPath, input.includeRemote)
};

export const switchBranchTool: Tool = {
  name: 'git_switch_branch',
  description: 'Switch to a different branch',
  input_schema: {
    type: 'object',
    properties: {
      repoPath: { type: 'string' },
      branchName: { type: 'string' },
      create: { type: 'boolean' }
    },
    required: ['repoPath', 'branchName']
  },
  handler: async (input: any) => _switchBranchImpl(input.repoPath, input.branchName, input.create)
};

export const diffBranchesTool: Tool = {
  name: 'git_diff_branches',
  description: 'Get the diff between two branches',
  input_schema: {
    type: 'object',
    properties: {
      repoPath: { type: 'string' },
      baseBranch: { type: 'string' },
      compareBranch: { type: 'string' },
      pathFilter: { type: 'string' }
    },
    required: ['repoPath', 'baseBranch', 'compareBranch']
  },
  handler: async (input: any) => _diffBranchesImpl(input.repoPath, input.baseBranch, input.compareBranch, input.pathFilter)
};

export const getLogTool: Tool = {
  name: 'git_log',
  description: 'Get the commit history for a branch',
  input_schema: {
    type: 'object',
    properties: {
      repoPath: { type: 'string' },
      branch: { type: 'string' },
      limit: { type: 'number' },
      pathFilter: { type: 'string' }
    },
    required: ['repoPath']
  },
  handler: async (input: any) => _getLogImpl(input.repoPath, input.branch, input.limit, input.pathFilter)
};

export const getStatusTool: Tool = {
  name: 'git_status',
  description: 'Get the current status of the repository',
  input_schema: {
    type: 'object',
    properties: {
      repoPath: { type: 'string' }
    },
    required: ['repoPath']
  },
  handler: async (input: any) => _getStatusImpl(input.repoPath)
};
