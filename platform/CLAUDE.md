# INTeract Platform - AI Assistant Context

## Project Overview
INTeract is an enterprise employee engagement and gamification platform built for organizations to boost workplace culture through recognition, rewards, and team activities.

## Tech Stack
- **Frontend:** React 18, Vite 6, Tailwind CSS, Radix UI
- **Backend:** Base44 SDK (85 serverless functions)
- **Database:** Base44 managed entities (40+ schemas)
- **AI:** Claude, OpenAI, Gemini, Perplexity, ElevenLabs

## Key Directories
- `src/pages/` - 47 application pages
- `src/components/` - 646 React components (65 subdirectories)
- `functions/` - 85 TypeScript serverless functions
- `src/api/` - API client and entity definitions

## Critical Files
- `src/App.jsx` - Root component with routing
- `src/pages/index.jsx` - Dynamic page routing
- `src/api/base44Client.js` - Backend SDK initialization
- `vite.config.js` - Build configuration

## Architecture Patterns
- Feature-based component organization
- React Context for auth state
- TanStack Query for server state
- RBAC permission system (Owner/Admin/Facilitator/Participant)

## Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run test     # Run Vitest
```

## Deployment
- **Target:** Vercel
- **Build output:** `dist/`
- **Environment variables:** See `.env.example`

## Key Features
1. **Gamification** - Points, badges, leaderboards, rewards
2. **Recognition** - Public/team/private recognition system
3. **Events** - Calendar, event wizard, participation tracking
4. **Onboarding** - New employee guided onboarding flow
5. **Analytics** - Engagement metrics and insights
6. **AI Integration** - 18 AI-powered functions

## Database Entities (40+)
- Users, Teams, Activities, Events
- Points, Badges, Rewards, Redemptions
- Recognition, Notifications, Surveys
- Learning paths, Milestones, Goals

## Third-Party Integrations
- Slack, Microsoft Teams
- Google Calendar, Google Maps
- Stripe (payments)
- Cloudinary (images)
- ElevenLabs (text-to-speech)
- Zapier (automation)

## Known Issues (Non-blocking for demo)
- 100+ ESLint warnings (cosmetic)
- 0% test coverage (roadmap item)
- Large files need splitting (post-launch optimization)

## Support
For issues during demo, contact the development team.
