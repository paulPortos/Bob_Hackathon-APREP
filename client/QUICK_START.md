# APREP Client - Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Backend server running on `http://localhost:8000`

## Installation & Setup

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## First Time Usage

### 1. Register an Account
- Navigate to `http://localhost:3000`
- You'll be redirected to `/auth`
- Click the "Register" tab
- Enter your email and password (min 8 characters)
- Click "Register"

### 2. Login
- After registration, switch to "Login" tab
- Enter your credentials
- Click "Login"
- You'll be redirected to the home page

### 3. Create Your First Project
- Click "Create Project" button in the navbar
- Fill in the form:
  - **Project Name**: Optional (e.g., "My AI Agent")
  - **Endpoint URL**: Your agent's API endpoint (e.g., `http://localhost:5000/chat`)
  - **Requires Token**: Check if your endpoint needs authentication
  - **Token**: Enter token if required
  - **Request Field Name**: Field name for the question (default: "message")
  - **Response Field Name**: Field name for the answer (default: "answer")
- Click "Create"

### 4. Explore Project Features
- Click on a project card to view details
- Navigate through tabs:
  - **Overview**: View project configuration
  - **Prompts**: Manage system prompts
  - **Question Slots**: Create test questions
  - **Run Evaluation**: Execute evaluations
  - **History**: View past results

## Common Commands

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start            # Start production server

# Linting
npm run lint         # Run ESLint
```

## Troubleshooting

### "Cannot connect to API"
- Ensure backend is running: `http://localhost:8000`
- Check backend CORS settings allow `http://localhost:3000`

### "Unauthorized" errors
- Your session may have expired
- Click logout and login again

### Build errors
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Ensure Node.js version is 18+

## Environment Variables

Create `.env.local` to override defaults:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure Overview

```
client/
├── app/              # Pages (Next.js App Router)
├── components/       # React components
├── lib/             # Utilities & API client
├── store/           # State management
└── types/           # TypeScript types
```

## Key Features

✅ **Authentication**: Secure JWT-based login
✅ **Project Management**: Create, view, delete projects
✅ **Responsive Design**: Works on mobile, tablet, desktop
✅ **Real-time Updates**: Automatic data refresh
✅ **Error Handling**: User-friendly error messages
✅ **Loading States**: Visual feedback during operations

## Next Steps

1. Create a project
2. Upload a system prompt
3. Create question slots
4. Run evaluations
5. View results in history

For detailed documentation, see `README.md` and `IMPLEMENTATION_SUMMARY.md`.