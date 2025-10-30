# GenerationConnect

> Bridging the digital divide, one conversation at a time.

**GenerationConnect** is an open-source, cross-platform mobile application that creates meaningful intergenerational connections by pairing tech-savvy students with seniors who need technology assistance. Built with passion by three high school students who believe that technology should bring people together, not apart.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-54.0.10-000020.svg)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.58.0-3ECF8E)](https://supabase.com/)

---

## The Idea 💡💡

We noticed something heartbreaking: while younger generations grow up fluent in technology, our seniors often feel left behind and isolated in an increasingly digital world. At the same time, students need community service hours but struggle to find meaningful ways to give back.

**Generation Connect solves both problems.**

This isn't just an app; we created our solution with purpose, designed as a tractionable movement. We're creating a platform where:
- 👵 **Seniors** get patient, personalized tech help from young people who genuinely care
- 🎓 **Students** may earn community service hours, while developing empathy and real-world teaching skills
- 🤝 **Communities** grow stronger through cross-generational friendships
- 🌍 **Society** becomes more inclusive and connected

---

## ✨ Features That Matter

### 🌟 For Seniors (Because Everyone Deserves Digital Independence)

- **🆘 Easy Help Requests**: Create requests for anything from "How do I video call my grandkids?" to "Help me avoid phishing scams"
- **📅 Flexible Scheduling**: Book sessions at times that work for you—morning coffee, afternoon tea, or evening chat
- **💬 Real-Time Messaging**: Chat with your student helper before, during, and after sessions
- **📚 Interactive Learning Hub**: Master topics like cybersecurity through engaging, step-by-step modules
- **🏘️ Community Bulletin Board**: Share stories, tips, and connect with other seniors on their tech journey
- **⏰ Smart Reminders**: Never miss a session with thoughtful notifications (3 days, 1 day, 2 hours, 1 hour, 30 mins, 15 mins before)
- **🎥 Video Call Integration**: Connect face-to-face with students through secure video sessions
- **⭐ Session Reviews**: Rate your experience and help students grow as teachers

### 🎓 For Students (Turn Screen Time Into Impact Time)

- **🔍 Browse & Claim Requests**: Find seniors who need help in your areas of expertise
- **🏆 Earn Badges & Achievements**: Unlock 14+ badges as you make an impact (First Session, Night Owl, Senior Champion, and more!)
- **📊 Track Your Impact**: Watch your volunteer hours grow automatically—complete with beautiful analytics
- **💡 Smart Matching**: Our algorithm suggests requests that match your skills and availability
- **🎯 Create Learning Content**: Share your knowledge by contributing to the Learning Hub
- **👥 Join the Community**: Connect with other student volunteers and share teaching strategies
- **📈 Impact Reports**: Generate shareable reports of your volunteer work for college applications
- **🗓️ Calendar Export**: Sync your sessions with your personal calendar

### 🛡️ For Admins (Keep the Magic Running Smoothly)

- **✅ Student Verification**: Review and approve student volunteer applications
- **🎫 Support Tickets**: Respond to user questions and resolve issues quickly
- **📧 Broadcast Notifications**: Send important updates to all users
- **📊 Platform Analytics**: Monitor engagement, popular topics, and community growth
- **👥 User Management**: Oversee the GenerationConnect community
- **🔔 Activity Monitoring**: Stay on top of requests, sessions, and messaging patterns

---

## 🛠️ Technology Stack

We chose our tech stack carefully to ensure **scalability**, **security**, **ease of navigation** and **accessibility**:

### Frontend
- **React Native 0.81.4** - Write once, run everywhere (iOS, Android, even Web!)
- **Expo SDK 54.0.10** - Rapid development with a _deeelightful_ developer experience --> legitimately soo nice to use!
- **TypeScript 5.9.2** - Type safety prevents bugs before they happen
- **Expo Router 6.0.8** - Intuitive file-based navigation
- **Lucide React Native** - Beautiful, consistent icons
- **React Native Reanimated** - Buttery-smooth 60 FPS animations

### Backend
- **Supabase** - Open-source Firebase alternative (PostgreSQL + Auth + Real-time + Storage)
- **PostgreSQL** - Rock-solid relational database with 30+ years of development
- **Row Level Security (RLS)** - Database-level security with 66+ policies across all tables
- **Supabase Edge Functions** - Serverless TypeScript functions running on Deno
- **Real-time Subscriptions** - Live updates for messaging and notifications

### Security
- **JWT Authentication** - Industry-standard token-based auth
- **bcrypt Password Hashing** - Secure password storage
- **Role-Based Access Control** - Three distinct roles (student, senior, admin)
- **Environment Variables** - Sensitive keys never touch version control
- **HTTPS Only** - All communication encrypted in transit

---

## 🏗️ Architecture Highlights

```
📱 Frontend (React Native + Expo)
    ↕️ (HTTPS/WSS)
🔐 Supabase Auth Layer (JWT)
    ↕️
🛡️ Row Level Security Policies
    ↕️
🗄️ PostgreSQL Database (15+ Tables)
    ↕️
⚡ Edge Functions (Serverless)
```

### Database Schema
- **profiles** - User accounts with role information
- **student_profiles** - Extended data for students (school, grade, skills, hours)
- **help_requests** - Technology assistance requests from seniors
- **sessions** - Scheduled tutoring sessions with completion tracking
- **messages** - Real-time chat between users
- **reviews** - Post-session feedback and ratings
- **community_posts** - Bulletin board for community engagement
- **badges** & **student_badges** - Gamification system
- **support_tickets** - Admin support workflow
- **session_notifications** - Smart reminder system
- **user_reminder_preferences** - Customizable notification settings

### Edge Functions
- **generate-calendar** - Export sessions to .ics calendar format
- **generate-impact-report** - Create PDF reports of student volunteer work
- **send-admin-notifications** - Broadcast system for admins

---

## 🚀 Getting Started (Foolproof Setup)

### Prerequisites

Before you begin, ensure you have:
- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- A code editor like [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.sh/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/generation-connect.git
cd generation-connect
```

### Step 2: Install Dependencies

```bash
npm install
npm install -g expo-cli
```

**What this does**: Downloads all required packages and installs Expo's command-line tools globally.

### Step 3: Set Up Your Supabase Project

1. **Create a free Supabase account** at [supabase.com](https://supabase.com)
2. **Create a new project** - Choose a name, database password, and region
3. **Wait 2 minutes** for your database to spin up (grab a coffee!)
4. **Find your project credentials**:
   - Go to Project Settings → API
   - Copy your `Project URL` (looks like `https://xxxxx.supabase.co`)
   - Copy your `anon/public` key (starts with `eyJ...`)

### Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Create the file
touch .env

# Open it in your editor
code .env  # or: nano .env
```

Add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**⚠️ Important**: Replace `your-project-id` and `your-anon-key-here` with your actual credentials from Step 3!

### Step 5: Set Up the Database Schema

The migrations are already written! Apply them in your Supabase dashboard:

1. Go to **SQL Editor** in your Supabase project
2. Create a new query
3. Copy the contents of each migration file from `supabase/migrations/` (in chronological order)
4. Execute each migration
5. Or use the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Push all migrations
supabase db push
```

### Step 6: Create Your First Admin Account

Run the admin account creation script:

```bash
node scripts/create-admin-account.js
```

Follow the prompts to create an admin user. You'll need this to:
- Approve student volunteers
- Manage support tickets
- Monitor platform health

### Step 7: Start the Development Server

```bash
npm run dev
npx expo start
```

**What you'll see**:
- A QR code in your terminal
- A browser window opens with the Expo DevTools
- Options to run on iOS simulator, Android emulator, or web browser

### Step 8: Choose Your Platform

#### 📱 Run on Your Phone (Recommended for Testing!)
1. Install **Expo Go** from the App Store (iOS) or Play Store (Android)
2. Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)
3. The app will load on your device in seconds!

#### 💻 Run in Web Browser
- Press `w` in the terminal where `expo start` is running
- Or click "Run in web browser" in Expo DevTools

#### 📲 Run on Simulator/Emulator
- **iOS**: Press `i` (requires macOS with Xcode)
- **Android**: Press `a` (requires Android Studio)

### Step 9: Create Test Accounts

1. **Sign up as a Senior**: Test the help request flow
2. **Sign up as a Student**: Try claiming a request and scheduling a session
3. **Log in as Admin**: Approve the student and explore admin features

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npx expo start` | Alternative way to start dev server |
| `npm run build:web` | Build optimized web production bundle |
| `npm run lint` | Check code for style issues |
| `npm run typecheck` | Verify TypeScript types (catch bugs early!) |

---

## 📂 Project Structure

```
generation-connect/
├── app/                          # All screens and routes
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── index.tsx             # Home - Browse requests
│   │   ├── dashboard.tsx         # Student dashboard
│   │   ├── community.tsx         # Senior community hub
│   │   ├── sessions.tsx          # Session history
│   │   ├── learning.tsx          # Learning modules
│   │   ├── messages.tsx          # Real-time chat
│   │   └── profile.tsx           # User profile
│   ├── auth/                     # Authentication flows
│   │   ├── sign-in.tsx
│   │   ├── senior-signup.tsx
│   │   ├── student-signup.tsx
│   │   ├── admin-signup.tsx
│   │   └── upload-documents.tsx  # Student verification
│   ├── admin/                    # Admin-only screens
│   │   ├── index.tsx             # Admin dashboard
│   │   ├── students.tsx          # Student verification
│   │   ├── tickets.tsx           # Support tickets
│   │   ├── notifications.tsx     # Broadcast center
│   │   └── settings.tsx          # Platform settings
│   ├── chat/
│   │   └── [requestId].tsx       # 1-on-1 messaging
│   ├── community/
│   │   ├── [id].tsx              # View community post
│   │   └── create.tsx            # Create new post
│   ├── learning/
│   │   └── cybersecurity.tsx     # Interactive security module
│   ├── profile/
│   │   └── skills.tsx            # Student skill management
│   ├── request/
│   │   ├── create.tsx            # Seniors create requests
│   │   └── [id].tsx              # Request details
│   ├── session/
│   │   ├── create.tsx            # Schedule a session
│   │   └── [id]/
│   │       └── complete.tsx      # Mark session complete
│   ├── support/
│   │   └── create.tsx            # Create support ticket
│   ├── _layout.tsx               # Root layout with auth
│   └── index.tsx                 # Welcome screen
├── contexts/
│   └── AuthContext.tsx           # Global auth state
├── hooks/
│   └── useFrameworkReady.ts      # Framework initialization
├── lib/
│   ├── supabase.ts               # Supabase client
│   └── validation.ts             # Input validation helpers
├── types/
│   └── database.ts               # TypeScript database types
├── supabase/
│   ├── migrations/               # 11 database migrations
│   └── functions/                # 3 serverless edge functions
├── scripts/
│   ├── create-admin-account.js   # Admin setup script
│   └── create-admin.sql          # Admin SQL migration
├── .env                          # Environment variables (create this!)
├── app.json                      # Expo configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # You are here!
```

---

## 🔐 Security & Privacy

We take security super seriously. Here's how we protect our users:

### Authentication
- ✅ Secure email/password authentication via Supabase Auth
- ✅ JWT tokens with automatic refresh
- ✅ Persistent sessions with secure storage
- ✅ Role-based access control (RBAC)

### Database Security
- ✅ **66 Row Level Security (RLS) policies** - Users can ONLY access their own data
- ✅ No public access - Everything requires authentication
- ✅ SQL injection prevention through parameterized queries
- ✅ Foreign key constraints maintain data integrity
- ✅ Enum types restrict values to valid options

### Application Security
- ✅ HTTPS-only communication
- ✅ Environment variables for sensitive keys
- ✅ Input validation on all forms
- ✅ XSS protection via React Native's built-in sanitization
- ✅ Rate limiting on auth endpoints

### Privacy
- ✅ Users control their profile visibility
- ✅ Messages are private and encrypted in transit
- ✅ Admins have logged actions for accountability
- ✅ GDPR-friendly data architecture

---

## 🧗‍♀️ Technical Challenges We Overcame

Building GenerationConnect pushed us far beyond our comfort zones. As high school students, we faced real-world engineering challenges that taught us more than any classroom ever could. Here's what we conquered:

### 🗺️ Mastering File-Based Routing Architecture
**The Challenge**: Coming from traditional React, Expo Router's file-based navigation was completely foreign. Understanding how `(tabs)`, dynamic routes `[id]`, and nested layouts work together felt like learning a new language.

**What We Did**:
- Studied 50+ documentation pages and GitHub examples
- Experimented with different folder structures until we found the perfect organization
- Built a mental model of how URLs map to file paths
- Created 30+ routes across auth flows, admin panels, and user interfaces

**The Breakthrough**: Realizing that file structure IS the routing table made everything click. Now we can add new features just by creating files in the right place.

### 📚 Learning TypeScript From Scratch
**The Challenge**: None of us had written TypeScript before. Interfaces, generics, type guards, union types—it was overwhelming. JavaScript felt safe; TypeScript felt like extra work.

**What We Did**:
- Committed to strict mode from day one (no `any` types allowed!)
- Generated TypeScript types from our Supabase schema for end-to-end type safety
- Used IDE features to understand type errors and fix them properly
- Pair programmed to teach each other TypeScript patterns

**The Payoff**: TypeScript caught 100+ bugs before they reached production. Autocomplete became our superpower. We'll never go back to untyped JavaScript.

### 🔍 Choosing the Right Tech Stack
**The Challenge**: React Native, Flutter, Swift, or Progressive Web App? Supabase, Firebase, or custom backend? Every blog post gave different advice. We had one shot to get it right.

**Our Research Process**:
- Created a comparison matrix of 5+ frameworks across 10 criteria
- Built proof-of-concept apps in 3 different technologies
- Interviewed developers in our community about their experiences
- Prioritized: cross-platform support, open source, learning curve, and scalability

**Why We Chose Expo + Supabase**:
- ✅ One codebase for iOS, Android, and Web
- ✅ Both are open-source with thriving communities
- ✅ Supabase gives us PostgreSQL (real database, not NoSQL limitations)
- ✅ Row Level Security solved our security concerns elegantly
- ✅ Fast iteration with hot reload and OTA updates

### 🔐 Implementing Enterprise-Grade Security
**The Challenge**: We're building for vulnerable populations (seniors). A security breach could be devastating. We needed bank-level security, but we're students, not security experts.

**What We Learned**:
- Studied OWASP Top 10 vulnerabilities and how to prevent them
- Implemented Row Level Security policies for every single table (66 policies total)
- Learned about JWT tokens, bcrypt hashing, and session management
- Added SQL injection prevention, XSS protection, and HTTPS enforcement
- Created different authorization levels (public, authenticated, admin)

**Our Security Philosophy**: Defense in depth. Every layer (database, API, application) enforces security independently. If one layer fails, others catch it.

### 🌿 Coordinating Three Developers Without Breaking Things
**The Challenge**: Three people coding simultaneously on different features. Merge conflicts. Overlapping changes. Testing that works on one machine but breaks on another.

**Our Solution**:
- Git branching strategy: `main` → `dev` → feature branches
- Code reviews for every pull request (we caught so many bugs this way!)
- Shared development database for consistency
- Detailed commit messages explaining not just what, but why
- Daily standups (even via text) to coordinate who's working on what

**Tools That Saved Us**:
- GitHub for version control and code review
- Prettier for consistent code formatting (no more debates about semicolons!)
- TypeScript for catching integration errors at compile time
- Supabase's migration system for synchronized database changes

### 🔌 Integrating Multiple Third-Party Services
**The Challenge**: We needed real-time messaging, email notifications, calendar exports, PDF generation, and more. Each service has different APIs, authentication patterns, and quirks.

**The Integration Journey**:
- **Supabase Realtime**: Learned WebSocket subscriptions for instant message delivery
- **Edge Functions**: Deployed 3 serverless functions for calendar generation, impact reports, and notifications
- **Expo APIs**: Integrated camera, notifications, and haptic feedback
- **CORS Configuration**: Spent hours debugging "blocked by CORS policy" errors (now we understand preflight requests!)

**Key Lesson**: Start with the simplest integration first. Get one thing working end-to-end, then add complexity. We wasted days trying to integrate everything at once before learning this.

### 🏗️ Architecting for Long-Term Scalability
**The Challenge**: This isn't a hackathon project—we want GenerationConnect to serve thousands of users for years. Our architecture needed to scale both technically and as our team grows.

**Design Decisions for the Future**:

1. **Database Schema**: Normalized tables with clear relationships. Easy to add features without restructuring.
2. **Component Architecture**: Reusable components in dedicated folders. New developers can find and modify code quickly.
3. **Migration System**: Every database change is versioned and documented. We can roll back or forward with confidence.
4. **Environment Variables**: Different configs for dev, staging, and production. No hardcoded values.
5. **Edge Functions**: Serverless scales automatically. No servers to manage as we grow.
6. **TypeScript Types**: As the schema evolves, types keep the codebase consistent.
7. **Comprehensive Documentation**: This README, inline comments, and setup scripts ensure anyone can contribute.

**Scalability Testing**:
- Tested with 1000+ mock database records
- Implemented pagination for large result sets
- Added database indexes on frequently queried columns
- Used connection pooling for efficient database access

### 💪 What This Taught Us

We're not the same developers who started this project. We've learned:

- **Read the docs first**: Our initial instinct was to Google and StackOverflow everything. Reading official documentation saved us from countless bad patterns.
- **Type safety is worth it**: TypeScript feels slower at first but prevents so many runtime errors.
- **Security isn't optional**: Especially for vulnerable populations. Every shortcut we considered, we rejected.
- **Good architecture pays off**: Time spent organizing code properly is time saved debugging later.
- **Ask for help**: Our mentors, online communities, and even Claude helped us overcome walls we couldn't break through alone.
- **Build for real users**: Every technical decision was guided by "Will this help a senior learn technology?" or "Will this make students want to volunteer?"

**Most Importantly**: Technical challenges are just puzzles waiting to be solved. With patience, research, and determination, three high school students built something we're genuinely proud of.

---

## 🎯 Roadmap

We're just getting started! Here's what's coming:

- [ ] **AI-Powered Matching** - Smarter pairings based on personality and learning style
- [ ] **Video Calling** - Built-in video chat (no more Zoom links!)
- [ ] **Mobile Apps** - Native iOS and Android apps in App Store and Play Store
- [ ] **Multi-Language Support** - Break language barriers
- [ ] **Parent/Guardian Portal** - Let families stay involved
- [ ] **Nonprofit Dashboard** - Tools for schools and senior centers
- [ ] **Achievement Sharing** - Post your impact on social media
- [ ] **Advanced Learning Modules** - More topics beyond cybersecurity

---

## 🤝 Contributing

**This is an open-source project, and we'd love your help!**

Whether you're a developer, designer, educator, or just someone who cares about bridging generations—there's a place for you here.

### Ways to Contribute

1. **🐛 Report Bugs** - Found something broken? Open an issue!
2. **💡 Suggest Features** - Have an idea? We want to hear it!
3. **📝 Improve Documentation** - Help others get started
4. **🎨 Design Assets** - Create graphics, icons, or UI mockups
5. **💻 Code Contributions** - Submit pull requests
6. **🌍 Translations** - Help us reach more communities
7. **📣 Spread the Word** - Share with schools, senior centers, and community organizations

### Development Guidelines

- Write TypeScript, not JavaScript (type safety saves lives!)
- Follow the existing code style (we use Prettier)
- Test on both iOS and Android before submitting PRs
- Add comments for complex logic
- Update the README if you add features

---

## 🙏 Acknowledgments

This project wouldn't exist without:

- **Our families** - For believing in three high schoolers with a big dream
- **The Supabase team** - For building amazing open-source tools
- **The Expo community** - For making mobile development accessible
- **Our mentors** - For guiding us through technical challenges
- **Every senior and student** who will use this app - You're why we built this

---

## 👩‍💻 Built With Love By

**Adya S** | **Sahana R** | **Zoya S**

Three high school students who believe technology should **connect** generations, not _divide_ them.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**TL;DR**: You can use this code for anything—personal projects, commercial products, school assignments. Just include the original license and give credit where it's due. We'd love to hear what you build!

---

## 🌟 Star Us!

If this project inspires you, give us a star on GitHub! It helps other developers discover GenerationConnect too, and come on and be part of this initiative! 

**Together, we can bridge the digital divide.**

---

## 📞 Contact & Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/AdyaS2010/Generation-Connect/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/AdyaS2010/Generation-Connect/discussions)
- 📧 **Email**: adyasastry@gmail.com

---

<div align="center">

**Made with ❤️ and a wholeeee lot of late-night (*early morning*) coding sessions 😂**

*"The best way to predict the future is to create it."* - Peter Drucker

</div>
