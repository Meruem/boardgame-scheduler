# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack for faster builds
- `npm run build` - Full production build (runs `prisma generate`, `prisma db push`, `node scripts/init-db.js`, `next build`)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code linting

## Database Commands

- `npx prisma generate` - Generate Prisma client (outputs to `src/generated/prisma`)
- `npx prisma db push` - Push schema changes to database
- `node scripts/init-db.js` - Initialize database and test connection

## Architecture Overview

This is a Next.js 15 board game session scheduler with the following key architecture:

### Database Layer
- **Prisma ORM** with custom output directory (`src/generated/prisma`)
- **PostgreSQL** in production, **SQLite** for local development
- **Core Models**: Event, GameSession, Signup, Comment with cascading deletes

### Frontend Architecture
- **Next.js 15** with App Router and React 19
- **Single-page application** with client-side state management
- **Event-based filtering** - sessions are grouped by events with localStorage persistence
- **Date lane organization** - sessions grouped by date with expandable lanes

### Key Components
- `src/app/page.tsx` - Main application component with session management
- `src/components/GameAutocomplete.tsx` - BoardGameGeek.com integration for game search
- `src/components/EventSelector.tsx` - Event selection and creation
- `src/components/Comments.tsx` - Session commenting system
- `src/lib/auth.tsx` - Authentication context (localStorage-based)
- `src/lib/i18n.ts` - Internationalization (English/Czech)

### API Layer
- RESTful API routes in `src/app/api/`
- **Session management**: CRUD operations with signup/leave functionality
- **BGG integration**: Search and game details fetching
- **Event management**: Create/read operations with session filtering

### Authentication & Authorization
- Simple localStorage-based authentication (no backend auth)
- User names are stored locally and used for session organization/comments
- Session creators are automatically signed up to their sessions

### Key Features
- **Automatic session retirement** based on scheduled end time
- **Real-time complexity/time data** from BoardGameGeek API
- **Responsive design** with mobile-first approach
- **Event persistence** using localStorage
- **Unscheduled sessions** support

## Environment Variables

- `DATABASE_URL` - SQLite database path for local development (default: `file:./prisma/dev.db`)
- `DB_POSTGRES_URL` - PostgreSQL connection string for production

## Build Process Notes

The build command runs several steps in sequence:
1. Generate Prisma client to custom directory
2. Push database schema changes
3. Initialize/test database connection
4. Build Next.js application

## Code Patterns

- Use `@/` imports for src directory references
- Components use TypeScript with strict typing
- Database queries use Prisma with generated types
- Client-side state uses React hooks with local storage persistence
- All user-facing text supports i18n with `t(locale, key)` function