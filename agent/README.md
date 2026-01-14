# INTeract-ive Agent

A full-featured refactoring agent built with the Claude Agent SDK. Analyzes codebases, identifies improvement opportunities, and applies refactorings safely.

## Features

- **Git Integration** - Branch switching, diff analysis, commit history
- **Code Pattern Detection** - Finds code smells, anti-patterns, and duplication
- **Complexity Analysis** - Measures cyclomatic complexity and identifies hotspots
- **Multi-Repository Support** - Analyze and refactor across multiple repos
- **Before/After Previews** - See changes before applying them
- **Interactive CLI** - Guide the refactoring process step by step

## Implementations

This project provides both TypeScript and Python implementations:

| Feature | TypeScript | Python |
|---------|------------|--------|
| SDK Version | 0.2.6 | 0.1.19 |
| Runtime | Node.js 20+ | Python 3.12+ |
| Package Manager | npm | pip |

## Quick Start

### Prerequisites

1. Install [Claude Code](https://claude.com/claude-code)
2. Get an [Anthropic API key](https://console.anthropic.com/)
3. Set the environment variable:
   ```bash
   export ANTHROPIC_API_KEY=your-api-key-here
   ```

### TypeScript

```bash
cd typescript
npm install
npm start -- /path/to/your/repo
```

### Python

```bash
cd python
pip install -r requirements.txt
python -m src.main /path/to/your/repo
```

## Usage

### Command Line Options

```
Usage: [npm start -- | python -m src.main] [options] [repo-paths...]

Options:
  -h, --help          Show help message
  -r, --repo <path>   Add a repository path (can be used multiple times)
  -p, --prompt <text> Initial prompt for the agent
  --auto-apply        Automatically apply suggested changes
  --dry-run           Show what would be changed without applying
  -o, --output <fmt>  Output format: detailed, summary, or json
```

### Examples

**Analyze a single repository:**
```bash
npm start -- /path/to/repo
```

**Analyze multiple repositories:**
```bash
npm start -- -r /repo1 -r /repo2
```

**Find and fix code duplication:**
```bash
npm start -- -p "Find and fix code duplication" /path/to/repo
```

**Dry run (preview changes only):**
```bash
npm start -- --dry-run /path/to/repo
```

**Auto-apply changes:**
```bash
npm start -- --auto-apply -p "Simplify complex conditionals" /path/to/repo
```

## Architecture

### Subagents

The refactoring agent uses specialized subagents for different tasks:

- **pattern-detector** - Finds code smells and anti-patterns
- **code-analyzer** - Analyzes architecture and dependencies
- **diff-generator** - Creates and applies code changes

### Custom MCP Tools

#### Git Tools
- `git_list_branches` - List all branches
- `git_switch_branch` - Switch to a branch
- `git_diff_branches` - Compare two branches
- `git_log` - Get commit history
- `git_status` - Get repository status

#### Refactoring Tools
- `find_duplicates` - Find duplicate code blocks
- `analyze_complexity` - Measure code complexity
- `suggest_refactoring` - Generate refactoring suggestions

#### Preview Tools
- `generate_diff_preview` - Create before/after diffs
- `create_summary_report` - Generate analysis reports

## Project Structure

```
INTeract-ive-Agent/
├── typescript/
│   ├── src/
│   │   ├── index.ts
│   │   ├── agents/
│   │   │   ├── refactoring-agent.ts
│   │   │   └── subagents/
│   │   ├── tools/
│   │   │   ├── git-tools.ts
│   │   │   ├── refactor-tools.ts
│   │   │   └── preview-tools.ts
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
│
├── python/
│   ├── src/
│   │   ├── main.py
│   │   ├── agents/
│   │   │   ├── refactoring_agent.py
│   │   │   └── subagents/
│   │   ├── tools/
│   │   │   ├── git_tools.py
│   │   │   ├── refactor_tools.py
│   │   │   └── preview_tools.py
│   │   └── types/
│   ├── requirements.txt
│   └── pyproject.toml
│
├── .gitignore
└── README.md
```

## License

MIT

## Resources

- [Claude Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [TypeScript SDK Reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Python SDK Reference](https://platform.claude.com/docs/en/agent-sdk/python)
