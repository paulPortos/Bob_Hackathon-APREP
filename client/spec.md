# APREP Client Specification (Next.js)

## Project Overview

A Next.js frontend application for APREP (Agent PRompt Evaluation Platform) that provides a comprehensive UI for testing and evaluating AI agents against expected behaviors, security requirements, and performance traits.

**Tech Stack:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- React Query / SWR for data fetching
- Zustand / Context API for state management
- Recharts / Chart.js for data visualization
- Framer Motion for animations
- React Hook Form for form handling
- Zod for validation

---

## API Base URL

**Backend API:** `http://localhost:8000`

All API requests require JWT authentication (except `/auth/register` and `/auth/login`).

**Authentication Header:**
```
Authorization: Bearer <access_token>
```

---

## Page Structure & Routes

### 1. Authentication Page (`/auth`)

**Route:** `/auth`

**Purpose:** Single page with tabs for Login and Register

**Layout:**
- Centered card layout with APREP logo
- Two tabs: "Login" and "Register"
- Fully responsive design

**Login Tab:**
- Email input (type: email, required)
- Password input (type: password, required, min 8 chars)
- "Login" button
- Link to switch to Register tab
- Loading state during authentication
- Error messages displayed via toast notifications

**Register Tab:**
- Email input (type: email, required)
- Password input (type: password, required, min 8 chars)
- Confirm Password input (must match password)
- "Register" button
- Link to switch to Login tab
- Loading state during registration
- Success message then auto-redirect to login
- Error messages displayed via toast notifications

**API Endpoints:**
- `POST /auth/register` - Register new user
  ```json
  Request: { "email": "user@example.com", "password": "password123" }
  Response: { "id": "uuid", "email": "user@example.com", "created_at": "timestamp" }
  ```

- `POST /auth/login` - Login user
  ```json
  Request: { "email": "user@example.com", "password": "password123" }
  Response: { "access_token": "jwt_token", "token_type": "bearer" }
  ```

**State Management:**
- Store JWT token in localStorage/sessionStorage
- Store user info in global state
- Redirect to `/home` after successful login

**Validation:**
- Email format validation
- Password minimum 8 characters
- Password confirmation match
- Display inline validation errors

---

### 2. Home Page (`/home`)

**Route:** `/home` (protected route)

**Purpose:** Dashboard showing all user's projects

**Layout:**
- Top navbar with:
  - APREP logo (left)
  - Navigation links: "Home" (active), "History"
  - "Create Project" button (primary CTA)
  - User menu dropdown (right): Profile info, Logout
- Main content area with project cards in responsive grid
- Empty state when no projects exist

**Project Cards (Grid Layout):**
- Card displays:
  - Project name (title)
  - Endpoint URL (truncated if long)
  - Created date
  - Last evaluation date (if any)
  - Quick stats: # of prompts, # of question slots, # of evaluations
  - Action buttons: "View", "Settings", "Delete"
- Hover effects and animations
- Click anywhere on card to navigate to project page
- Responsive grid: 1 column (mobile), 2 columns (tablet), 3-4 columns (desktop)

**Create Project Button:**
- Opens modal with form
- Form fields:
  - Project Name (optional, auto-generated if empty)
  - Endpoint URL (required, must start with http://, https://, ws://, wss://)
  - Requires Token (checkbox)
  - Token (text input, shown only if "Requires Token" is checked)
  - Request Field Name (default: "message")
  - Response Field Name (default: "answer")
- "Create" and "Cancel" buttons
- Loading state during creation
- Success toast notification
- Auto-refresh project list after creation

**Delete Project:**
- Confirmation modal: "Are you sure you want to delete [Project Name]? This action cannot be undone."
- "Delete" (danger) and "Cancel" buttons
- Loading state during deletion
- Success toast notification
- Auto-refresh project list after deletion

**API Endpoints:**
- `GET /projects` - List all projects
  ```json
  Response: [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Project Name",
      "endpoint_url": "http://example.com/api",
      "requires_token": false,
      "request_field_name": "message",
      "response_field_name": "answer",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
  ```

- `POST /projects` - Create project
  ```json
  Request: {
    "name": "My Agent",
    "endpoint_url": "http://localhost:5000/chat",
    "requires_token": false,
    "token": "optional_token",
    "request_field_name": "message",
    "response_field_name": "answer"
  }
  Response: { /* project object */ }
  ```

- `DELETE /projects/{project_id}` - Delete project
  ```
  Response: 204 No Content
  ```

**Loading States:**
- Skeleton loaders for project cards while fetching
- Spinner in "Create Project" button during submission
- Disabled state for all buttons during operations

---

### 3. Project Page (`/project/[id]`)

**Route:** `/project/[id]` (protected route)

**Purpose:** Detailed view of a specific project with tabs for different features

**Layout:**
- Top navbar (same as Home page)
- Breadcrumb: Home > [Project Name]
- Project header:
  - Project name (editable inline or via settings icon)
  - Endpoint URL
  - Last updated timestamp
- Tab navigation: Overview, Prompts, Question Slots, Run Evaluation, History
- Tab content area

---

#### Tab 1: Overview

**Content:**
- Project Information Card:
  - Name (editable)
  - Endpoint URL (editable)
  - Requires Token (toggle)
  - Request Field Name (editable)
  - Response Field Name (editable)
  - "Save Changes" button
  - "Update Token" button (if requires_token is true)

- Quick Stats Cards:
  - Total Prompts
  - Total Question Slots
  - Total Evaluations
  - Average Overall Score (from evaluations)

- Recent Activity:
  - Last 5 evaluations with status and score
  - Link to view full history

**API Endpoints:**
- `GET /projects/{project_id}` - Get project details
- `PATCH /projects/{project_id}` - Update project
  ```json
  Request: {
    "name": "Updated Name",
    "endpoint_url": "http://new-url.com",
    "requires_token": true,
    "request_field_name": "query",
    "response_field_name": "result"
  }
  ```

- `PATCH /projects/{project_id}/token` - Update token
  ```json
  Request: { "token": "new_token_value" }
  ```

**Update Token Modal:**
- Text input for new token
- "Update" and "Cancel" buttons
- Loading state
- Success toast notification

---

#### Tab 2: Prompts

**Content:**
- Current Prompt Display:
  - If prompt exists:
    - Show prompt content in code editor or textarea
    - File type indicator (md/txt)
    - Created timestamp
    - "Edit Prompt" button
    - "Delete Prompt" button
  - If no prompt:
    - Empty state with "Upload Prompt" button

**Upload/Edit Prompt Modal:**
- Textarea for prompt content (large, monospace font)
- File type selector: Markdown (.md) or Text (.txt)
- "Save" and "Cancel" buttons
- Loading state during save
- Success toast notification

**API Endpoints:**
- `GET /projects/{project_id}/prompt` - Get current prompt
  ```json
  Response: {
    "id": "uuid",
    "project_id": "uuid",
    "content": "You are a helpful assistant...",
    "file_type": "txt",
    "created_at": "timestamp"
  }
  ```

- `POST /projects/{project_id}/prompt` - Create/update prompt
  ```json
  Request: {
    "content": "Prompt text here",
    "file_type": "txt"
  }
  ```

---

#### Tab 3: Question Slots

**Content:**
- List of Question Slots:
  - Each slot shows:
    - Slot name
    - Description
    - Number of questions
    - Auto-generated badge (if applicable)
    - Created date
    - Actions: "View", "Edit", "Delete"
  - Empty state if no slots exist

- Action Buttons:
  - "Create Manual Slot" button
  - "Auto-Generate Questions" button (with AI icon)

**Create Manual Slot Modal:**
- Form fields:
  - Slot Name (required)
  - Description (optional)
  - Questions section:
    - Question 1:
      - Question Text (required)
      - Expected Answer (optional)
      - Order (auto-numbered)
    - "Add Another Question" button (max 10 questions)
    - "Remove Question" button for each question
- "Create Slot" and "Cancel" buttons
- Loading state
- Success toast notification

**Auto-Generate Questions Modal:**
- Form fields:
  - Number of Questions (slider/input, 1-10, default: 5)
  - Purpose (textarea, required, min 10 chars)
  - Use Current Prompt (checkbox, default: true)
- "Generate" and "Cancel" buttons
- Special AI animation during generation
- Loading message: "AI is generating questions..."
- Success toast notification
- Auto-refresh slot list

**View Slot Modal:**
- Display slot details:
  - Name
  - Description
  - List of questions with order, text, and expected answer
- "Edit" and "Close" buttons

**Edit Slot Modal:**
- Same as Create Manual Slot Modal but pre-filled
- Can modify name, description, and questions
- "Save Changes" and "Cancel" buttons

**Delete Slot:**
- Confirmation modal
- "Delete" and "Cancel" buttons
- Success toast notification

**API Endpoints:**
- `GET /projects/{project_id}/question-slots` - List slots
  ```json
  Response: [
    {
      "id": "uuid",
      "project_id": "uuid",
      "name": "Basic Tests",
      "description": "Basic functionality tests",
      "is_auto_generated": false,
      "created_at": "timestamp",
      "questions": [
        {
          "id": "uuid",
          "slot_id": "uuid",
          "question_text": "What is 2+2?",
          "expected_answer": "4",
          "order": 1
        }
      ]
    }
  ]
  ```

- `POST /projects/{project_id}/question-slots` - Create manual slot
  ```json
  Request: {
    "name": "Test Slot",
    "description": "Description",
    "questions": [
      {
        "question_text": "Question 1",
        "expected_answer": "Answer 1",
        "order": 1
      }
    ]
  }
  ```

- `POST /projects/{project_id}/generate-questions` - Auto-generate
  ```json
  Request: {
    "count": 5,
    "purpose": "Test programming knowledge",
    "use_prompt": true
  }
  Response: {
    "slot_id": "uuid",
    "questions": [/* question objects */]
  }
  ```

- `GET /question-slots/{slot_id}` - Get slot details
- `PATCH /question-slots/{slot_id}` - Update slot
- `DELETE /question-slots/{slot_id}` - Delete slot

---

#### Tab 4: Run Evaluation

**Content:**
- Wizard/Stepper Interface (3 steps)

**Step 1: Select Question Slot**
- List of available question slots (radio selection)
- Show slot name, description, and question count
- "Next" button (disabled until selection made)
- "Cancel" button

**Step 2: Configure Options**
- Prompt Selection:
  - Dropdown to select prompt (default: latest)
  - Show prompt preview on selection
- Trait Tests:
  - Toggle: "Include Trait Tests" (default: true)
  - If enabled, show slider for "Number of Trait Tests" (1-10, default: 5)
- "Back" and "Next" buttons

**Step 3: Review & Run**
- Summary of selections:
  - Selected slot name and question count
  - Selected prompt (or "Latest")
  - Trait tests: Yes/No and count
- "Run Evaluation" button (primary, large)
- "Back" and "Cancel" buttons

**During Evaluation:**
- Modal overlay with progress indicator
- Progress bar showing "Testing question X of Y"
- Animated spinner or pulse effect
- "Running evaluation..." message
- Cannot be dismissed until complete

**After Completion:**
- Success message: "Evaluation completed!"
- Auto-redirect to History tab after 2 seconds
- Or show "View Results" button to go to History

**API Endpoints:**
- `POST /projects/{project_id}/evaluate` - Run evaluation
  ```json
  Request: {
    "slot_id": "uuid",
    "prompt_id": "uuid",  // optional
    "include_trait_tests": true,
    "trait_test_count": 5
  }
  Response: {
    "id": "uuid",
    "project_id": "uuid",
    "prompt_id": "uuid",
    "slot_id": "uuid",
    "status": "running",
    "started_at": "timestamp",
    "completed_at": null,
    "overall_score": null,
    "explanation_summary": null,
    "recommendation": null
  }
  ```

**Note:** The evaluation runs asynchronously. The UI should poll the evaluation status or implement WebSocket for real-time updates (future enhancement).

---

#### Tab 5: History

**Content:**
- List of Evaluations:
  - Table/List view with columns:
    - Evaluation ID (truncated)
    - Started At (date/time)
    - Status (badge: running/completed/failed)
    - Overall Score (if completed)
    - Question Slot Name
    - Actions: "View Details", "Export JSON", "Export CSV"
  - Sortable by date (default: newest first)
  - Filterable by status
  - Pagination if many evaluations

- Empty state if no evaluations

**View Details (Modal):**
- Large modal with evaluation details
- Header:
  - Evaluation ID
  - Status badge
  - Started/Completed timestamps
  - Overall Score (large, prominent)

- Visual Dashboard Section:
  - Radar/Spider chart showing trait scores:
    - Accuracy
    - Security
    - Honesty
    - Speed
    - Prompt Adherence
    - Semantic Accuracy
  - Bar chart comparing trait scores
  - Summary cards for each trait with score and color coding

- Detailed Results Table:
  - Columns:
    - Question Text
    - Agent Answer
    - Response Time (ms)
    - Accuracy Score
    - Security Score
    - Honesty Score
    - Speed Score
    - Prompt Adherence Score
    - Semantic Accuracy Score
    - Is Trait Test (badge)
    - Trait Type (if trait test)
  - Expandable rows to show score explanation
  - Sortable columns
  - Color-coded scores (red: 0-40, yellow: 41-70, green: 71-100)

- Recommendation Section:
  - Display recommendation text from evaluation
  - Explanation summary

- Export Buttons:
  - "Export as JSON" button
  - "Export as CSV" button
  - "Close" button

**API Endpoints:**
- `GET /projects/{project_id}/evaluations` - List evaluations
  ```json
  Response: [
    {
      "id": "uuid",
      "project_id": "uuid",
      "prompt_id": "uuid",
      "slot_id": "uuid",
      "status": "completed",
      "started_at": "timestamp",
      "completed_at": "timestamp",
      "overall_score": 85.5,
      "explanation_summary": "Overall good performance...",
      "recommendation": "Consider improving..."
    }
  ]
  ```

- `GET /evaluations/{evaluation_id}` - Get detailed results
  ```json
  Response: {
    "id": "uuid",
    "project_id": "uuid",
    "prompt_id": "uuid",
    "slot_id": "uuid",
    "status": "completed",
    "started_at": "timestamp",
    "completed_at": "timestamp",
    "overall_score": 85.5,
    "explanation_summary": "Summary text",
    "recommendation": "Recommendation text",
    "results": [
      {
        "id": "uuid",
        "evaluation_id": "uuid",
        "question_id": "uuid",
        "question_text": "What is 2+2?",
        "agent_answer": "4",
        "response_time_ms": 150,
        "accuracy_score": 100.0,
        "security_score": 95.0,
        "honesty_score": 90.0,
        "speed_score": 98.0,
        "prompt_adherence_score": 92.0,
        "semantic_accuracy_score": 100.0,
        "is_trait_test": false,
        "trait_type": null,
        "score_explanation": "Correct answer provided quickly"
      }
    ],
    "project_name": "My Agent",
    "endpoint_url": "http://example.com",
    "prompt_content": "You are a helpful assistant",
    "slot_name": "Basic Tests"
  }
  ```

- `GET /evaluations/{evaluation_id}/export/json` - Export JSON
  ```
  Response: JSON file download
  ```

- `GET /evaluations/{evaluation_id}/export/csv` - Export CSV
  ```
  Response: CSV file download
  ```

---

### 4. History Page (`/history`)

**Route:** `/history` (protected route)

**Purpose:** Global view of all evaluations across all projects

**Layout:**
- Top navbar (same as other pages)
- Page title: "Evaluation History"
- Filters:
  - Project filter (dropdown, all projects)
  - Status filter (all/running/completed/failed)
  - Date range filter
- Evaluation list (same as Project History tab but includes project name column)
- Pagination

**Content:**
- Same evaluation list and modal as Project History tab
- Additional column: Project Name (clickable to go to project)

**API Endpoints:**
- Same as Project History tab, but fetch evaluations for all projects
- May need to fetch all projects first, then fetch evaluations for each

---

## Global Components

### Top Navbar
- Logo (left, clickable to /home)
- Navigation links:
  - "Home" (link to /home)
  - "History" (link to /history)
- "Create Project" button (opens modal, same as Home page)
- User menu (right):
  - User email display
  - "Logout" button

**Logout:**
- Clear JWT token from storage
- Clear global state
- Redirect to /auth
- Show success toast: "Logged out successfully"

### Toast Notifications
- Position: Top-right corner
- Types: Success (green), Error (red), Info (blue), Warning (yellow)
- Auto-dismiss after 5 seconds
- Dismissible by clicking X
- Stack multiple toasts vertically

### Confirmation Modals
- Centered overlay
- Title, message, and action buttons
- Danger actions use red button
- Cancel button (secondary)
- Escape key to close
- Click outside to close (optional)

### Loading States
- **Skeleton Loaders:**
  - Project cards on Home page
  - Evaluation list items
  - Form fields while loading data

- **Spinners:**
  - Button loading states (inline spinner + "Loading..." text)
  - Center of page for full-page loads

- **Progress Bars:**
  - Evaluation progress modal
  - File upload progress (if applicable)

- **AI Animation:**
  - Special animated icon for Ollama operations
  - Pulsing or rotating effect
  - "AI is working..." message

---

## State Management

### Global State (Zustand/Context)
- User authentication state:
  - `isAuthenticated: boolean`
  - `user: { id, email, created_at }`
  - `token: string`
- Current project (when on project page):
  - `currentProject: Project | null`
- UI state:
  - `isLoading: boolean`
  - `error: string | null`

### Local State (Component-level)
- Form inputs
- Modal open/close states
- Tab selections
- Pagination state
- Filter selections

---

## Error Handling

### API Errors
- Display via toast notifications
- Error messages should be user-friendly
- Log detailed errors to console for debugging

### Common Error Scenarios:
- 401 Unauthorized: Redirect to /auth, clear token
- 404 Not Found: Show "Resource not found" message
- 500 Server Error: Show "Something went wrong, please try again"
- Network errors: Show "Connection error, please check your internet"

### Form Validation Errors
- Display inline below input fields
- Red border on invalid inputs
- Prevent form submission until valid

---

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Navbar: Hamburger menu for navigation links
- Project cards: Single column
- Tables: Horizontal scroll or card view
- Modals: Full-screen on mobile
- Forms: Stack inputs vertically

### Tablet Adaptations
- Project cards: 2 columns
- Tables: Show essential columns only
- Modals: Slightly smaller than desktop

### Desktop
- Full layout as specified
- Multi-column grids
- Full tables with all columns

---

## Animations & Transitions

### Page Transitions
- Fade in/out when navigating between pages
- Smooth scroll to top on navigation

### Component Animations
- Modal: Fade in background, scale in content
- Toast: Slide in from right
- Cards: Hover lift effect (translateY)
- Buttons: Hover scale and color change
- Loading spinners: Rotate animation
- Progress bars: Smooth width transition

### Micro-interactions
- Button click: Scale down slightly
- Input focus: Border color transition
- Checkbox/toggle: Smooth slide animation
- Dropdown: Fade and slide down

---

## Accessibility

- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators on all interactive elements
- Alt text for images/icons
- Color contrast ratios meet WCAG AA standards
- Screen reader friendly

---

## Performance Considerations

- Code splitting by route
- Lazy load modals and heavy components
- Optimize images (Next.js Image component)
- Debounce search/filter inputs
- Pagination for large lists
- Cache API responses (React Query/SWR)
- Prefetch data on hover (project cards)

---

## Security

- Store JWT token securely (httpOnly cookies preferred, or localStorage with XSS protection)
- Validate all user inputs
- Sanitize displayed data to prevent XSS
- HTTPS only in production
- CORS configuration
- Rate limiting on API calls (client-side)

---

## Future Enhancements

- Real-time evaluation updates via WebSocket
- Dark mode toggle
- Export evaluation reports as PDF
- Batch evaluations
- Scheduled evaluations
- Email notifications
- Team collaboration features
- Advanced analytics dashboard
- Custom trait definitions
- Comparison view for multiple evaluations

---

## Development Guidelines

### File Structure
```
client/
├── app/
│   ├── auth/
│   │   └── page.tsx
│   ├── home/
│   │   └── page.tsx
│   ├── project/
│   │   └── [id]/
│   │       └── page.tsx
│   ├── history/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx (redirect to /auth or /home)
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Card.tsx
│   │   ├── Tabs.tsx
│   │   └── ...
│   ├── project/
│   │   ├── ProjectCard.tsx
│   │   ├── CreateProjectModal.tsx
│   │   └── ...
│   ├── evaluation/
│   │   ├── EvaluationWizard.tsx
│   │   ├── EvaluationProgress.tsx
│   │   ├── EvaluationDetailsModal.tsx
│   │   └── ...
│   └── ...
├── lib/
│   ├── api.ts (API client)
│   ├── auth.ts (Auth utilities)
│   ├── utils.ts (Helper functions)
│   └── constants.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useProjects.ts
│   ├── useEvaluations.ts
│   └── ...
├── store/
│   └── authStore.ts (Zustand store)
├── types/
│   └── index.ts (TypeScript types)
└── styles/
    └── globals.css
```

### Naming Conventions
- Components: PascalCase (e.g., `ProjectCard.tsx`)
- Hooks: camelCase with "use" prefix (e.g., `useAuth.ts`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

### Code Style
- Use TypeScript for type safety
- Use functional components with hooks
- Use Tailwind CSS for styling
- Follow ESLint and Prettier rules
- Write meaningful comments for complex logic
- Keep components small and focused (Single Responsibility Principle)

---

## Testing Strategy

- Unit tests for utility functions
- Component tests for UI components
- Integration tests for API calls
- E2E tests for critical user flows (auth, create project, run evaluation)
- Accessibility tests

---

## Deployment

- Build: `npm run build`
- Environment variables:
  - `NEXT_PUBLIC_API_URL` - Backend API URL
- Deploy to Vercel, Netlify, or similar platform
- Configure CORS on backend to allow frontend domain

---

## Summary

This specification provides a comprehensive blueprint for building the APREP Next.js client. It covers all pages, components, API integrations, user interactions, and technical considerations needed for implementation.

**Key Features:**
- ✅ Authentication with JWT
- ✅ Project management (CRUD)
- ✅ Prompt management
- ✅ Question slot creation (manual and AI-generated)
- ✅ Evaluation wizard with progress tracking
- ✅ Detailed evaluation results with visualizations
- ✅ Export functionality (JSON/CSV)
- ✅ Fully responsive design
- ✅ Loading states and animations
- ✅ Error handling and validation
- ✅ Toast notifications
- ✅ Confirmation modals

**Next Steps:**
1. Set up Next.js project with TypeScript and Tailwind CSS
2. Implement authentication flow
3. Build core components (Navbar, Modal, Toast, etc.)
4. Implement Home page with project management
5. Build Project page with tabs
6. Implement evaluation wizard and results visualization
7. Add History page
8. Polish UI/UX with animations and responsive design
9. Test thoroughly
10. Deploy to production