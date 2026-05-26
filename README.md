# DevCollab Dashboard

AI-powered mission control dashboard for developer teams — **React frontend + Express backend**.

## Quick start

Run **both** frontend and backend (recommended for development):

```bash
npm install
npm run dev:all
```

Or in two terminals:

```bash
npm run dev:backend   # API on http://localhost:3001
npm run dev           # UI on http://localhost:4174 (proxies /api to backend)
```

**Production / single server** — build UI and serve from Express:

```bash
npm install
npm start             # builds frontend, API + UI on http://localhost:3001
```

### Demo login

| Email | Password |
|-------|----------|
| `shwetha@devcollab.io` | `password123` |
| `rahul@devcollab.io` | `password123` |

New signups require OTP verification (OTP shown on screen in dev mode).

## Architecture

- **Frontend:** React 18, TypeScript, Vite, Framer Motion
- **Backend:** Express REST API, JWT auth, JSON file DB (`server/data/db.json`)
- **Real-time:** Socket.IO for live task updates across clients
- **Proxy:** Vite proxies `/api` and `/socket.io` to the backend

## API highlights

- `POST /api/auth/login` — email/password auth
- `POST /api/auth/signup` + `verify-otp` — registration flow
- `GET /api/bootstrap` — loads workspace data (projects, tasks, analytics, etc.)
- CRUD for projects, tasks, snippets, docs
- `POST /api/tasks/balance-workload` — reassigns overloaded tasks
- `POST /api/ai/standup` + `/api/ai/code-review` — AI features

## Features

See full feature list in previous sections — all major buttons now persist to the backend.
