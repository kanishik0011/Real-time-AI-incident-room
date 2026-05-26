# Real-Time AI Incident Room

A full-stack internal operations room for reporting incidents, collaborating on updates in real time, and generating AI-assisted summaries and next-action suggestions.

## Project overview

Teams use this app to:

- View all incidents on a dashboard (title, status, priority, latest update, created/updated times)
- Create new incidents with validation
- Post updates and change status with instant Socket.IO sync across clients
- Run AI incident summary and next-action suggestions (Gemini when configured, rule-based fallback otherwise)

## Features

- **Incident dashboard** — search, filter by status/priority, sort by latest update
- **Create incident** — title, description, priority, reporter name with form validation
- **Incident details** — live update timeline, status workflow (`Open` → `Investigating` → `Resolved`), delete with confirmation
- **Real-time** — Socket.IO broadcasts `incident:update` and `incident:status` to the dashboard and per-incident rooms
- **AI assist** — summary and next actions via Gemini API, with intelligent rule-based fallback when the API is unavailable
- **UX** — loading spinners, skeletons, empty states, toasts, dark/light theme, responsive layout

## Tech stack

| Layer | Stack |
|--------|--------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Realtime | Socket.IO |
| AI | Google Gemini (`@google/generative-ai`) with rule-based fallback |

## Architecture

```text
client (Vite/React)  --REST-->  server (Express)
       |                              |
       +-------- Socket.IO -----------+
                                      |
                                 MongoDB
```

- REST API under `/api/incidents` for CRUD, updates, status, and AI endpoints
- Socket.IO on the same HTTP server; clients join `incident:<id>` rooms for detail-page feeds
- Global emits refresh the dashboard when any incident changes

## Repo structure

- `client/` — React SPA
- `server/` — Express API, Socket.IO, Mongoose models, AI service, seed script

## Prerequisites

- Node.js 18+ (20 LTS recommended)
- MongoDB (local or Atlas)
- Optional: [Gemini API key](https://aistudio.google.com/apikey)

## Installation

From the repository root:

```bash
npm install
```

## Environment variables

### Backend (`server/.env`)

Copy `server/.env.example` to `server/.env`:

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default `4000`) |
| `MONGO_URI` | MongoDB connection string (required) |
| `GEMINI_API_KEY` | Optional — enables Gemini; omit to use rule-based fallback |
| `CLIENT_URL` | Frontend origin for CORS (e.g. `http://localhost:5173`) |

Example:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/incident-room
GEMINI_API_KEY=
CLIENT_URL=http://localhost:5173
```

### Frontend (`client/.env`)

Copy `client/.env.example` to `client/.env`:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (default `http://localhost:4000`) |

## Local setup

```bash
# 1. Configure server/.env and client/.env (see above)

# 2. Seed sample data (optional)
npm run seed

# 3. Start API + frontend
npm run dev
```

- Frontend: http://localhost:5173
- API health: http://localhost:4000/health

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client and server concurrently |
| `npm run build` | Production build (client + server) |
| `npm run typecheck` | TypeScript check both workspaces |
| `npm run lint` | ESLint (client) |
| `npm run seed` | Insert sample incidents and updates |

## AI implementation

When `GEMINI_API_KEY` is set, the server calls **Gemini 1.5 Flash** with incident title, description, and recent updates. Responses are parsed into summary or next-action text and stored in the `AIResult` collection.

Endpoints:

- `POST /api/incidents/:id/ai/summary`
- `POST /api/incidents/:id/ai/next-actions`

## AI fallback (no API key or API error)

If the key is missing or Gemini fails, the server uses **rule-based heuristics** on combined title, description, and update text:

| Keywords | Suggested checks |
|----------|------------------|
| payment, billing, card | Payment service logs, PSP/webhooks |
| login, auth, sso | Auth service logs, tokens, IdP health |
| upload, storage, s3 | Storage writes, credentials, limits |
| dashboard, frontend, api | Frontend console, API 5xx/timeouts |

Default fallback actions apply when no keyword matches. The UI notes that rule-based mode is active when Gemini is not configured.

## Real-time updates (Socket.IO)

- Server events: `incident:update`, `incident:status`, `incident:update:created`
- Client joins `room:join` with `{ incidentId }` on the details page
- Dashboard listens globally and merges incident cards without refresh

## Data model

**Incident:** `_id`, `title`, `description`, `priority`, `status`, `reporter_name`, `latest_update`, `created_at`, `updated_at`

**IncidentUpdate:** `_id`, `incident_id`, `message`, `author_name`, `created_at`

**AIResult:** `_id`, `incident_id`, `type` (`summary` \| `next_actions`), `result_text`, `created_at`

## Deployment (production)

Full step-by-step guide: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

| Service | Platform | Root folder | Required env |
|---------|----------|-------------|--------------|
| Frontend | Vercel | `client` | `VITE_API_URL` → `https://your-api.onrender.com` |
| API + Socket.IO | Render or Railway | `server` | `MONGO_URI`, `CLIENT_URL`, optional `GEMINI_API_KEY` |
| Database | MongoDB Atlas | — | Connection string in `MONGO_URI` |

**Quick steps**

1. Create MongoDB Atlas cluster → copy `MONGO_URI`.
2. Deploy `server/` on Render (build: `npm install && npm run build`, start: `npm run start`, health: `/health`).
3. Set `CLIENT_URL` to your Vercel URL(s), e.g. `https://your-app.vercel.app,https://*.vercel.app`.
4. Deploy `client/` on Vercel with `VITE_API_URL` pointing at the Render URL.
5. Verify `GET /health` and test live updates in the browser.

Configs included: `client/vercel.json`, `server/render.yaml`, `server/railway.toml`.

**Socket.IO:** The client uses `VITE_API_URL` for both REST and WebSocket (no hardcoded localhost in production builds).

## Screenshots

_Add screenshots of the dashboard and incident details page after running locally._

Suggested captures:

1. Dashboard with filters and incident cards
2. Incident details with timeline and AI panel

## License

MIT (assignment submission)
