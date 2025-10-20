# GenerationConnect

Bridging the digital divide through intergenerational connection. An Expo-based mobile app connecting seniors seeking tech help with student volunteers who can earn community service hours.

## Overview

GenerationConnect is a platform that facilitates meaningful connections between seniors who need technology assistance and student volunteers who want to help while earning community service hours. The app provides a complete workflow from creating help requests to scheduling sessions and tracking volunteer hours.

## Features

### For Seniors
- Create help requests for technology assistance
- Browse and manage your requests
- Schedule sessions with student volunteers
- Real-time messaging with students
- Sign off on completed sessions
- View session history

### For Students
- Browse available help requests
- Claim requests and offer assistance
- Schedule tutoring sessions
- Real-time messaging with seniors
- Track community service hours
- View completed sessions and total hours earned

### Core Functionality
- User authentication with role-based access (Senior/Student)
- Profile management
- Help request creation and management
- Session scheduling and tracking
- In-app messaging system
- Session completion and sign-off workflow
- Community service hour tracking

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Backend**: Supabase
  - Authentication
  - PostgreSQL Database
  - Real-time subscriptions
  - Row Level Security (RLS)
- **Navigation**: Expo Router
- **Icons**: Lucide React Native

## Project Structure

```
app/
├── (tabs)/              # Main tab navigation
│   ├── index.tsx        # Home screen - Browse/manage requests
│   ├── messages.tsx     # Messages screen
│   ├── profile.tsx      # User profile
│   └── sessions.tsx     # Session history
├── auth/                # Authentication screens
│   ├── sign-in.tsx
│   ├── senior-signup.tsx
│   ├── student-signup.tsx
│   └── upload-documents.tsx
├── chat/                # Chat functionality
│   └── [requestId].tsx  # Chat screen for specific request
├── request/             # Request management
│   ├── create.tsx       # Create help request
│   └── [id].tsx         # View/manage request details
├── session/             # Session management
│   ├── create.tsx       # Schedule a session
│   └── [id]/
│       └── complete.tsx # Complete session
├── _layout.tsx          # Root layout
└── index.tsx            # Welcome/landing screen

contexts/
└── AuthContext.tsx      # Authentication state management

lib/
└── supabase.ts          # Supabase client configuration

types/
└── database.ts          # TypeScript database types
```

## Database Schema

### Tables

- **profiles**: User profiles with role information
- **student_profiles**: Extended profile data for students (school, skills, hours)
- **help_requests**: Technology help requests created by seniors
- **sessions**: Scheduled tutoring sessions
- **messages**: Real-time messaging between users
- **reviews**: Session reviews and ratings

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

### Building for Production

```bash
npm run build:web
```

## Configuration Files

- `metro.config.js`: Metro bundler configuration with path aliases
- `tsconfig.json`: TypeScript configuration
- `.bolt/config.json`: Bolt-specific configuration
- `app.json`: Expo configuration

## Authentication

The app uses Supabase Authentication with email/password:
- Separate signup flows for seniors and students
- Role-based access control
- Secure session management
- Automatic profile creation on signup

## Security

- Row Level Security (RLS) policies on all database tables
- Authenticated access required for sensitive operations
- User data isolation through RLS policies
- Secure environment variable management

## Development Notes

- Uses Expo Router for file-based routing
- Custom hooks for framework initialization
- Context-based authentication state management
- TypeScript for type safety
- Platform-specific code handling for web

## Scripts

- `npm run dev`: Start development server
- `npm run build:web`: Build for web deployment
- `npm run lint`: Run ESLint
- `npm run typecheck`: Run TypeScript type checking

## License

This project is part of the GenerationConnect initiative to bridge the digital divide through intergenerational connections. 
