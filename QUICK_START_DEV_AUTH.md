# 🚀 Quick Start Guide - Dev Authentication

## ⚡ Start the App

```bash
# Terminal 1: Frontend + Backend
npm run dev:all

# OR in two separate terminals:

# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (optional, not needed for dev auth)
npm run dev:backend
```

## 🔑 Login

Navigate to: **http://localhost:4174**

### Try These Credentials (or use ANY):
- Email: `dev@example.com`
- Password: `password` (literally anything works)

### Or:
- Email: `alice@acme.com`
- Password: `test123`

### Or Create Your Own:
- Email: `yourname@company.com`
- Password: `any-password-here`

**Result**: ✅ Instantly logged in and redirected to dashboard

## 📊 What You Get

After login, you'll see:
- ✅ Sample workspace with 3 projects
- ✅ 5 realistic tasks across projects
- ✅ Code snippets library
- ✅ Documentation pages
- ✅ Calendar with events
- ✅ Analytics & insights
- ✅ Team member list

## 🚪 Logout

Click profile icon → **Logout**  
Session cleared → Redirected to login page

## 🔄 Test Different Users

1. Logout
2. Login with different email
3. ✅ New user profile created
4. See different user data

## 🧪 Test Session Persistence

1. Login with any email
2. Press **Ctrl+R** (page refresh)
3. ✅ Still logged in
4. Check localStorage in DevTools:
   ```javascript
   localStorage.getItem('devcollab_token')
   // Returns the fake JWT token
   ```

## ⚙️ Under the Hood

**Enabled**: Dev authentication mode (`DEV_MODE = true`)  
**Location**: `src/api/client.ts` line 8  
**No backend required**: Everything is frontend mock data  

### To Switch to Real Backend:
Edit `src/api/client.ts` line 8:
```typescript
// Change from:
const DEV_MODE = true;

// To:
const DEV_MODE = false;
```

Then make sure backend is running on `http://localhost:3001`

## 📝 Important Notes

- ✅ **Any email/password works** - No validation
- ✅ **Frontend only** - No backend API calls
- ✅ **Session in localStorage** - Persists until logout or clear cache
- ✅ **Mock data included** - Full workspace with projects, tasks, etc.
- ✅ **All routes work** - Dashboard, projects, tasks, team, etc.
- ⚠️ **Development only** - Replace before production

## 🛠️ Customization

### Customize Mock Projects
Edit: `src/utils/mockAuth.ts`
Function: `generateMockProjects()` (line 103)

### Customize Mock Tasks
Edit: `src/utils/mockAuth.ts`
Function: `generateMockTasks()` (line 139)

### Customize Mock Data
Edit: `src/utils/mockAuth.ts`
All generator functions:
- `generateMockUser()`
- `generateMockProjects()`
- `generateMockTasks()`
- `generateMockSnippets()`
- `generateMockDocs()`
- And more...

## 📚 Documentation

- **Full Guide**: See `DEV_AUTH_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Architecture**: See `README.md`

## ✅ Quick Verification

Confirm everything works:

```
[ ] Frontend starts: npm run dev:all
[ ] Can access http://localhost:4174
[ ] Login page shows: "Use any email and password to log in"
[ ] Login with test@example.com / password123
[ ] Redirects to dashboard
[ ] See sample projects in sidebar
[ ] See sample tasks in project
[ ] Logout button visible in profile menu
[ ] Click logout → returns to login
[ ] localStorage shows token: localStorage.getItem('devcollab_token')
[ ] Can login again with different email
```

## 🎯 What's Next?

1. **Explore the Dashboard**: Try different pages
2. **Test Interactions**: Create/update tasks (persists to mock data)
3. **Check Console**: Monitor any errors
4. **Read Full Docs**: See `DEV_AUTH_GUIDE.md` for advanced features

---

**Ready to test?** Run `npm run dev:all` and enjoy! 🎉
