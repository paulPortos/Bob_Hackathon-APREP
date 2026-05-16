# APREP Client - Next.js Frontend

A comprehensive Next.js frontend application for APREP (Agent PRompt Evaluation Platform) that provides a UI for testing and evaluating AI agents.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query
- **Forms:** React Hook Form + Zod
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

## Features Implemented

### ✅ Core Features
- **Authentication:** Login and registration with JWT
- **Project Management:** Create, view, and delete projects
- **Protected Routes:** Automatic redirect for unauthenticated users
- **Responsive Design:** Mobile, tablet, and desktop layouts
- **Global Navigation:** Navbar with user menu and navigation links

### ✅ Pages
- **Auth Page (`/auth`):** Login and register with form validation
- **Home Page (`/home`):** Project listing with cards and empty states
- **Project Page (`/project/[id]`):** Detailed project view with tabs:
  - Overview: Project information and stats
  - Prompts: View uploaded prompts
  - Question Slots: List of question slots
  - Run Evaluation: Placeholder for evaluation wizard
  - History: Evaluation results table
- **History Page (`/history`):** Global evaluation history across all projects

### ✅ Components
- **UI Components:** Button, Input, Modal, Card, Tabs, Spinner, ConfirmDialog
- **Layout Components:** Navbar with responsive menu
- **Project Components:** ProjectCard, CreateProjectModal
- **Protected Route Wrapper:** Authentication guard

### ✅ Infrastructure
- **API Client:** Axios-based client with interceptors
- **Type Definitions:** Comprehensive TypeScript types
- **Utilities:** Helper functions for formatting, validation, export
- **Constants:** Centralized configuration
- **Auth Utilities:** Token and user management

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Backend server running on `http://localhost:8000`

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment (optional):**
   Create a `.env.local` file if you need to override the API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
client/
├── app/                      # Next.js app directory
│   ├── auth/                # Authentication page
│   ├── home/                # Home page (project listing)
│   ├── project/[id]/        # Dynamic project page
│   ├── history/             # Global history page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Root page (redirect)
│   ├── providers.tsx        # React Query & Toast providers
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   ├── layout/              # Layout components (Navbar)
│   ├── project/             # Project-specific components
│   └── ProtectedRoute.tsx   # Auth guard wrapper
├── lib/                     # Utilities and helpers
│   ├── api.ts              # API client
│   ├── auth.ts             # Auth utilities
│   ├── utils.ts            # Helper functions
│   └── constants.ts        # Constants
├── store/                   # State management
│   └── authStore.ts        # Zustand auth store
├── types/                   # TypeScript types
│   └── index.ts            # Type definitions
└── public/                  # Static assets
```

## Usage

### 1. Register/Login
- Navigate to `/auth`
- Register a new account or login with existing credentials
- You'll be redirected to the home page upon successful authentication

### 2. Create a Project
- Click "Create Project" button in the navbar or home page
- Fill in project details:
  - Name (optional, auto-generated if empty)
  - Endpoint URL (must start with http://, https://, ws://, or wss://)
  - Authentication token (if required)
  - Request/response field names
- Click "Create" to save

### 3. View Project Details
- Click on a project card to view details
- Navigate through tabs:
  - **Overview:** View project configuration and stats
  - **Prompts:** Manage system prompts
  - **Question Slots:** Create and manage test questions
  - **Run Evaluation:** Execute evaluations (coming soon)
  - **History:** View past evaluation results

### 4. View Global History
- Click "History" in the navbar
- See all evaluations across all projects
- Filter and sort results

## API Integration

The client communicates with the backend API at `http://localhost:8000`. All endpoints require JWT authentication except `/auth/register` and `/auth/login`.

### Key Endpoints Used:
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /projects` - List all projects
- `POST /projects` - Create project
- `GET /projects/{id}` - Get project details
- `DELETE /projects/{id}` - Delete project
- `GET /projects/{id}/prompt` - Get project prompt
- `GET /projects/{id}/question-slots` - List question slots
- `GET /projects/{id}/evaluations` - List evaluations
- `GET /evaluations/{id}` - Get evaluation details

## Development Notes

### State Management
- **Zustand** for global auth state
- **React Query** for server state and caching
- **React Hook Form** for form state

### Styling
- **Tailwind CSS** for utility-first styling
- Custom color palette with primary blue theme
- Responsive breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)

### Error Handling
- API errors displayed via toast notifications
- Form validation errors shown inline
- 401 errors trigger automatic logout and redirect

### Performance
- Code splitting by route
- React Query caching with 5-minute stale time
- Optimistic updates for mutations

## Future Enhancements

The following features are planned but not yet implemented:
- Full prompt upload/edit functionality
- Manual question slot creation with forms
- AI-powered question generation with Ollama
- Complete evaluation wizard (3-step process)
- Real-time evaluation progress tracking
- Detailed evaluation results with charts
- Export functionality (JSON/CSV)
- Dark mode toggle
- Advanced filtering and search
- Batch operations

## Troubleshooting

### Common Issues

1. **"Cannot connect to API"**
   - Ensure backend server is running on `http://localhost:8000`
   - Check CORS configuration on backend

2. **"Unauthorized" errors**
   - Token may have expired, try logging out and back in
   - Check that backend JWT configuration matches

3. **Build errors**
   - Delete `node_modules` and `.next` folders
   - Run `npm install` again
   - Ensure Node.js version is 18+

## License

This project is part of the APREP platform.