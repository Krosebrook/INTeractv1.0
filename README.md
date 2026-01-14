# INTeract

Employee engagement platform with AI-powered refactoring tools.

## Repository Structure

```
INTeract/
├── platform/          # React 18 + Vite + Firebase employee engagement app
│   ├── src/           # 554 React components, 47 pages
│   ├── functions/     # 85 Firebase Cloud Functions
│   └── docs/          # Platform-specific documentation
│
├── agent/             # Claude Agent SDK refactoring tool
│   ├── typescript/    # TypeScript implementation
│   └── python/        # Python implementation
│
├── docs/
│   ├── spec-kit/      # 12-document specification kit (PRD, API, Security, etc.)
│   ├── base44/        # Base44 SDK documentation
│   └── *.txt          # Summary and audit reports
│
└── .claude/           # Claude Code configuration
```

## Platform

The INTeract Platform is a comprehensive employee engagement solution featuring:

- **Pulse Surveys** - AI-powered sentiment analysis
- **Peer Recognition** - Social recognition with gamification
- **Team Channels** - Secure collaboration spaces
- **Wellness Challenges** - Wearable integration
- **Learning Paths** - Personalized skill development
- **Gamification** - Points, badges, leaderboards
- **HR Analytics** - Predictive insights dashboards

**Tech Stack:** React 18, Vite 6, Firebase v11, Tailwind CSS, shadcn/ui

### Quick Start

```bash
cd platform
npm install
npm run dev
```

## Agent

The INTeract-ive Agent analyzes and refactors the Platform codebase using Claude AI.

### Run Analysis

```bash
# Windows
agent\analyze-platform.cmd

# Or manually
cd agent/python
python -m src.main ../platform
```

### Agent Capabilities

- Code smell detection (god classes, long methods, duplication)
- Complexity analysis
- Pattern recommendations
- Safe refactoring with previews

## Documentation

Full specification kit in `docs/spec-kit/`:

1. Product Requirements Document (PRD)
2. Technical Specification
3. Security & Compliance Specification
4. API Documentation
5. Data Model Specification
6. User Stories & Acceptance Criteria
7. Testing Strategy & QA Plan
8. Deployment & Infrastructure Guide
9. Operations Runbook
10. Architecture Decision Records
11. Project Charter
12. Risk Assessment & Mitigation Plan

## License

Proprietary - All rights reserved.
