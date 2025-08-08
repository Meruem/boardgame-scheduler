# Board Game Scheduler

A comprehensive Next.js application for scheduling and managing board game sessions with friends. Built with Next.js 15, Prisma, SQLite, and Tailwind CSS. Features board game autocomplete, session management, player signups, comments, and multi-language support.

## ✨ Features

### 🎲 Core Functionality
- **Create Game Sessions**: Schedule board game sessions with detailed information
- **Board Game Autocomplete**: Search and select games from BoardGameGeek.com database
- **Join Sessions**: Users can sign up for sessions with their display names
- **Session Management**: View all upcoming and retired sessions with player counts
- **Edit Sessions**: Modify existing sessions (name, time, players, complexity, duration)
- **Delete Sessions**: Remove sessions with confirmation dialogs
- **Remove Players**: Remove individual players from sessions

### 🎯 Advanced Features
- **BoardGameGeek Integration**: Auto-fill game details (complexity, duration, description) from BGG
- **Session Retirement**: Automatic organization of past sessions into "Retired" tab
- **Date Lanes**: Sessions grouped by date (Today, Tomorrow, specific dates)
- **Comments System**: Add, view, and delete comments on sessions with collapsible interface
- **Multi-language Support**: English and Czech localization with persistent language selection

### 🎨 User Experience
- **Enhanced Time Picker**: Clickable increment/decrement buttons for easy time selection
- **Two-Column Layout**: Organized form layout for better usability
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Thematic UI**: Board game-themed backgrounds and visual elements
- **Real-time Updates**: See session changes immediately after any action

### 📊 Session Details
- **Complexity Rating**: 0-5 scale with decimal precision
- **Time Range**: Min and max playing time in minutes
- **Player Limits**: Configurable maximum players with validation
- **Game Descriptions**: Auto-filled from BGG or manually editable
- **Session Status**: Open/Full indicators with player counts

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes with server-side rendering
- **Database**: SQLite with Prisma ORM
- **External APIs**: BoardGameGeek.com XML API integration
- **Styling**: Tailwind CSS with custom components
- **State Management**: React hooks with local state
- **Internationalization**: Custom i18n system

## 🚀 Getting Started

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

## 📖 Usage

### Creating a Session

1. Click "Create New Session" on the homepage
2. Fill in the two-column form:
   - **Left Column**:
     - **Board Game Name**: Search and select from BGG database or enter manually
     - **Date**: Select the session date
     - **Time Range**: Set start and end times with clickable controls
   - **Right Column**:
     - **Max Players**: Set the maximum number of players allowed
     - **Complexity**: Adjust with slider (0-5 scale)
     - **Game Duration**: Set min and max playing time in minutes
     - **Description**: Auto-filled from BGG or manually editable
3. Click "Create Session"

### Joining a Session

1. Find a session you want to join on the homepage
2. Click "Join Session" (only available if the session isn't full)
3. Enter your display name
4. Click "Join"

### Managing Sessions

- **Edit Session**: Click the edit button to modify session details
- **Delete Session**: Click the delete button with confirmation
- **Remove Players**: Click the "×" button next to player names
- **Add Comments**: Use the "+" button to expand comments section
- **View Retired Sessions**: Switch to "Retired Sessions" tab

### Language Support

- **Language Selector**: Choose between English and Czech in the header
- **Persistent Settings**: Language preference is saved in localStorage
- **Localized Content**: All UI elements, dates, and messages are translated

## 🔌 API Endpoints

### Core Sessions
- `GET /api/sessions` - Get all active sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/[id]` - Get a specific session
- `PUT /api/sessions/[id]` - Update a session
- `DELETE /api/sessions/[id]` - Delete a session
- `POST /api/sessions/[id]/signup` - Join a session

### Player Management
- `DELETE /api/sessions/[id]/signup/[signupId]` - Remove a player from session

### Comments System
- `GET /api/sessions/[id]/comments` - Get all comments for a session
- `POST /api/sessions/[id]/comments` - Add a new comment
- `DELETE /api/sessions/[id]/comments/[commentId]` - Delete a comment

### BoardGameGeek Integration
- `GET /api/bgg/search?query={search}` - Search for board games
- `GET /api/bgg/details?id={bggId}` - Get detailed game information

### Session Organization
- `GET /api/sessions/retired` - Get all retired sessions

## 🗄️ Database Schema

### GameSession
- `id`: Unique identifier
- `boardGameName`: Name of the board game
- `scheduledAt`: When the session is scheduled
- `maxPlayers`: Maximum number of players allowed
- `complexity`: Game complexity rating (0-5)
- `minTimeMinutes`: Minimum playing time in minutes
- `maxTimeMinutes`: Maximum playing time in minutes
- `description`: Game description (optional)
- `createdAt`: When the session was created
- `updatedAt`: When the session was last updated

### Signup
- `id`: Unique identifier
- `displayName`: Player's display name
- `sessionId`: Reference to the game session
- `createdAt`: When the signup was created

### Comment
- `id`: Unique identifier
- `authorName`: Comment author's name
- `content`: Comment text content
- `sessionId`: Reference to the game session
- `createdAt`: When the comment was created
- `updatedAt`: When the comment was last updated

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Commands

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio for database management

### Key Components

- **GameAutocomplete**: Search and select board games from BGG
- **SessionCard**: Display session information with action buttons
- **DateLane**: Group sessions by date with collapsible sections
- **Comments**: Manage session comments with collapsible interface
- **LanguageSelector**: Switch between supported languages

## 🌟 Recent Updates

### UI/UX Improvements
- **Two-column form layout** for better organization
- **Enhanced time picker** with clickable increment/decrement buttons
- **Thematic backgrounds** with board game visual elements
- **Responsive design** optimized for all screen sizes
- **Improved modal dialogs** with better visual hierarchy

### Feature Enhancements
- **BoardGameGeek integration** for auto-filling game details
- **Comments system** with collapsible interface
- **Session retirement** and organization by date lanes
- **Multi-language support** (English/Czech)
- **Player removal** functionality
- **Enhanced validation** and error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
