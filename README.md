# Board Game Scheduler

A Next.js application for scheduling and managing board game sessions with friends. Built with Next.js 15, Prisma, SQLite, and Tailwind CSS.

## Features

- **Create Game Sessions**: Schedule board game sessions with custom game names, dates, and player limits
- **Join Sessions**: Users can sign up for sessions with their display names
- **Session Management**: View all upcoming sessions with player counts and signup status
- **Real-time Updates**: See session changes immediately after creating or joining
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS v4

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd boardgame-scheduler
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating a Session

1. Click "Create New Session" on the homepage
2. Fill in the form:
   - **Board Game Name**: Enter the name of the game (e.g., "Catan", "Ticket to Ride")
   - **Date & Time**: Select when the session will take place
   - **Max Players**: Set the maximum number of players allowed
3. Click "Create Session"

### Joining a Session

1. Find a session you want to join on the homepage
2. Click "Join Session" (only available if the session isn't full)
3. Enter your display name
4. Click "Join"

### Viewing Sessions

- All sessions are displayed on the homepage
- Sessions show:
  - Game name
  - Scheduled date and time
  - Current player count vs. maximum players
  - List of signed-up players
  - Status (Open/Full)

## API Endpoints

- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/[id]` - Get a specific session
- `POST /api/sessions/[id]/signup` - Join a session

## Database Schema

### GameSession
- `id`: Unique identifier
- `boardGameName`: Name of the board game
- `scheduledAt`: When the session is scheduled
- `maxPlayers`: Maximum number of players allowed
- `createdAt`: When the session was created
- `updatedAt`: When the session was last updated

### Signup
- `id`: Unique identifier
- `displayName`: Player's display name
- `sessionId`: Reference to the game session
- `createdAt`: When the signup was created

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Commands

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio for database management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
