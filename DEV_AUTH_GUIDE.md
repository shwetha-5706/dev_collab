# DevCollab Development Authentication Guide

## Overview
The authentication system has been temporarily replaced with a mock authentication system for development and demo purposes. This allows you to:

- ✅ Log in with **any email/password combination**
- ✅ Automatically create user accounts
- ✅ Access the full dashboard without backend setup
- ✅ Work with complete mock data (projects, tasks, docs, etc.)
- ✅ No backend API dependency

## Quick Start

### 1. Login
Navigate to `http://localhost:4174` and enter:
- **Email**: Any valid email (e.g., `test@example.com`, `demo@devcollab.io`)
- **Password**: Any password
- Click "Login" or "Sign Up" — both will work

### 2. You'll be immediately logged in
The app will:
1. Create a mock user profile
2. Generate a fake JWT token
3. Load sample workspace data
4. Redirect to dashboard

### 3. Logout
Click the logout button in the sidebar. Session will be cleared and you'll return to the login page.

## Features Available

### Mock User Data
Each user gets:
- **ID**: Generated from email hash
- **Name**: Extracted from email username
- **Email**: Your provided email
- **Avatar**: Generated from email via Pravatar
- **Role**: `Owner` (full access in dev mode)
- **Bio**: "Development user - temporary mock auth"
- **Skills**: ["React", "TypeScript", "Node.js"]

### Mock Workspace Data
A complete development workspace with:

#### 📁 Workspaces
- "My Workspace" (Private, development workspace)

#### 📊 Projects (3 sample projects)
1. **Frontend Dashboard** - React/TypeScript/Vite
   - Health: 85%, Progress: 65%, 12 open tasks
2. **Backend API** - Node.js/Express/PostgreSQL
   - Health: 72%, Progress: 45%, 18 open tasks
3. **Mobile App** - React Native/TypeScript
   - Health: 60%, Progress: 30%, 24 open tasks

#### ✅ Tasks (5 sample tasks)
- Distributed across projects with different statuses (To Do, In Progress, Done)
- All have descriptions, priorities, due dates, and labels

#### 💾 Code Snippets
- React Hook useLocalStorage example
- CSS Glassmorphism card example

#### 📄 Documentation
- "Getting Started" page
- "Project Guidelines" page

#### 📅 Calendar Events
- Sprint Planning (7 days from now)
- Team Standup (tomorrow)

#### 📈 Analytics & Insights
- Daily/weekly/monthly activity trends
- Team performance metrics
- AI insights and predictions
- Collaboration scores
- Sprint health indicators

## How It Works

### Frontend-Only Authentication
All authentication logic is handled on the frontend:

1. **File**: `src/utils/mockAuth.ts`
   - `generateMockUser()` - Creates user from email
   - `generateMockToken()` - Creates fake JWT
   - `generateMockBootstrapData()` - Generates app data
   - `mockLogin()`, `mockSignUp()`, `mockSocialLogin()` - Auth functions

2. **File**: `src/api/client.ts`
   - `DEV_MODE` flag (line 8) enables mock authentication
   - When `DEV_MODE=true`, all auth endpoints return mock data
   - No API calls to backend for login/signup/verify

### Session Storage
- Mock JWT token stored in `localStorage` under key `devcollab_token`
- Token is valid for 30 days
- Session persists across page reloads
- Clear browser cache or use logout to reset session

### Architecture Benefits
✅ **No Backend Dependency** - Works without running server  
✅ **Fast Development** - No authentication delays  
✅ **Easy to Switch** - Single flag to toggle real auth  
✅ **Complete Data** - Full sample dataset included  
✅ **UI Preserved** - All pages and flows work normally  

## Configuration

### Enable/Disable Dev Mode
Edit `src/api/client.ts`, line 8:

```typescript
// To enable mock auth (development):
const DEV_MODE = true;

// To disable and use real backend:
const DEV_MODE = false;
```

### Customize Mock Data
Edit `src/utils/mockAuth.ts`:
- `generateMockProjects()` - Add/modify projects
- `generateMockTasks()` - Add/modify tasks
- `generateMockSnippets()` - Add/modify code snippets
- `generateMockDocs()` - Add/modify documentation

## Important Notes

### Protected Routes
All protected routes (Dashboard, Projects, Tasks, etc.) will work normally because:
- Auth state is managed in AppContext
- Mock token satisfies authorization checks
- Bootstrap data populates all required collections

### API Calls After Login
- **Bootstrap**: Returns mock workspace data ✅
- **CRUD Operations**: Will fail on protected endpoints (backend returns 401)
- **Real API Calls**: Disable `DEV_MODE` to use real backend

### When to Remove Dev Auth
After real authentication backend is ready:
1. Change `DEV_MODE = false` in `src/api/client.ts`
2. Ensure real authentication endpoints are running
3. Backend will receive login requests instead of mock auth

## Testing Checklist

- [ ] Can log in with any email/password
- [ ] User data displays correctly in profile
- [ ] Dashboard loads with mock projects and tasks
- [ ] Can navigate all protected pages
- [ ] Logout clears session and returns to login
- [ ] Session persists on page reload (if "Remember me" checked)
- [ ] Can log in with different emails (creates different sessions)

## Troubleshooting

### Issue: Still seeing API errors
**Solution**: Verify `DEV_MODE = true` in `src/api/client.ts`

### Issue: User data not showing
**Solution**: Clear localStorage and log in again:
```javascript
localStorage.clear();
```

### Issue: Need to test real backend
**Solution**: 
1. Change `DEV_MODE = false`
2. Ensure backend is running on `http://localhost:3001`
3. Use demo credentials from README if needed

## Next Steps for Production

When integrating real authentication:
1. Set `DEV_MODE = false` in `src/api/client.ts`
2. Implement real JWT validation in backend
3. Update `bootstrap` endpoint to return real user data
4. Remove `mockAuth.ts` utility file
5. Add proper authorization checks to protected routes
6. Implement session management/refresh tokens

---

**Note**: This is a temporary development setup. Replace with real authentication before deploying to production.
