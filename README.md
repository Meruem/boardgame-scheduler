# Board Game Scheduler

A modern web application for scheduling and managing board game sessions. Built with Next.js 15, React 19, Prisma ORM, and Tailwind CSS.

## Features

- **Session Management**: Create, edit, and delete board game sessions
- **Player Signups**: Join sessions with display names
- **Board Game Integration**: Autocomplete with BoardGameGeek.com data
- **Complexity & Time Tracking**: Game complexity (0-5) and time estimates
- **Date Lanes**: Organize sessions by date for better overview
- **Comments System**: Add comments to sessions
- **Retired Sessions**: Archive past sessions
- **Localization**: Support for English and Czech languages
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM (SQLite for local development)
- **External APIs**: BoardGameGeek.com XML API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/boardgame-scheduler.git
   cd boardgame-scheduler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and configure it:
   ```bash
   cp env.example .env
   ```
   
   Then edit `.env` with your actual values:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel Deployment

1. **Connect your repository** to Vercel
2. **Set up Vercel Postgres** (recommended):
   - In your Vercel dashboard, go to Storage
   - Create a new Postgres database
   - Vercel will automatically add the `DATABASE_URL` environment variable
3. **Alternative: Set environment variables manually**:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add: `DATABASE_URL` = Your PostgreSQL connection string
4. **Deploy** - Vercel will automatically run the build script which includes:
   - `prisma generate` - Generate Prisma client
   - `prisma db push` - Apply schema changes
   - `next build` - Build the application

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database file path | `file:./prisma/dev.db` |

## Usage

### Creating Sessions

1. Click "Create Session" button
2. Fill in the session details:
   - **Board Game**: Use the autocomplete to search BoardGameGeek.com
   - **Date & Time**: Select date and time (5-minute intervals)
   - **Max Players**: Maximum number of players
   - **Complexity**: Game complexity (0-5, decimal values allowed)
   - **Time**: Min/max playing time in minutes
   - **Description**: Optional game description (auto-filled from BGG)

### Managing Sessions

- **Join Sessions**: Click "Join" to sign up with your display name
- **Edit Sessions**: Click the edit icon to modify session details
- **Remove Players**: Click the "X" next to player names to remove them
- **Add Comments**: Expand the comments section to add thoughts
- **Retire Sessions**: Past sessions are automatically moved to "Retired" tab

### Language Support

- Switch between English and Czech using the language selector
- All UI text is translated
- Date formatting adapts to the selected language

## API Endpoints

- `GET /api/sessions` - Get all active sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/[id]` - Get a specific session
- `PUT /api/sessions/[id]` - Update a session
- `DELETE /api/sessions/[id]` - Delete a session
- `POST /api/sessions/[id]/signup` - Join a session
- `DELETE /api/sessions/[id]/signup/[signupId]` - Leave a session
- `GET /api/sessions/retired` - Get retired sessions
- `GET /api/bgg/search` - Search BoardGameGeek.com
- `GET /api/bgg/details` - Get game details from BGG
- `GET /api/sessions/[id]/comments` - Get session comments
- `POST /api/sessions/[id]/comments` - Add a comment
- `DELETE /api/sessions/[id]/comments/[commentId]` - Delete a comment

## Development

### Database Schema

The application uses three main models:

- **GameSession**: Core session data (game, time, players, etc.)
- **Signup**: Player registrations for sessions
- **Comment**: User comments on sessions

### Key Components

- `src/app/page.tsx` - Main application component
- `src/components/GameAutocomplete.tsx` - Board game search component
- `src/components/Comments.tsx` - Comments management
- `src/components/LanguageSelector.tsx` - Language switching
- `src/lib/bgg.ts` - BoardGameGeek API integration
- `src/lib/i18n.ts` - Internationalization utilities

### Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
