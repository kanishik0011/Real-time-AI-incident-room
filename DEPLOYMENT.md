# Production deployment guide

Deploy the **Real-Time AI Incident Room** as:

| Component | Platform | Directory |
|-----------|----------|-----------|
| Frontend | [Vercel](https://vercel.com) | `client/` |
| Backend | [Render](https://render.com) or [Railway](https://railway.app) | `server/` |
| Database | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | — |

## Architecture (production)

```text
Browser (Vercel)
   |  HTTPS REST  →  Render/Railway API (Express + Socket.IO)
   |  WSS/WS      →  same host (/socket.io/)
   └────────────────→  MongoDB Atlas
```

The frontend talks to the API using `VITE_API_URL` (no localhost proxy in production).

---

## 1. MongoDB Atlas

1. Create a free cluster.
2. Database Access → create user + password.
3. Network Access → allow `0.0.0.0/0` (or Render/Railway egress IPs).
4. Connect → copy connection string, e.g.  
   `mongodb+srv://USER:PASS@cluster.mongodb.net/incident-room`

---

## 2. Backend (Render)

### Option A — Dashboard

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**.
2. Connect your GitHub repo.
3. Settings:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Health Check Path:** `/health`
4. Environment variables:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Atlas connection string |
| `CLIENT_URL` | `https://YOUR-APP.vercel.app,https://*.vercel.app` |
| `GEMINI_API_KEY` | (optional) |
| `PORT` | (Render sets automatically) |

5. Deploy and copy the service URL, e.g. `https://incident-room-api.onrender.com`.

### Option B — Blueprint

Use `server/render.yaml` from the repo (set **Root Directory** to `server` if prompted).

### Railway

1. New project → deploy from GitHub.
2. Set **Root Directory** to `server`.
3. Use `server/railway.toml` or equivalent build/start commands.
4. Add the same env vars as above.

### Verify API

```bash
curl https://YOUR-API.onrender.com/health
# {"ok":true,"env":"production"}
```

Optional seed (run locally against Atlas once):

```bash
MONGO_URI="mongodb+srv://..." npm run seed --workspace server
```

---

## 3. Frontend (Vercel)

1. [Vercel](https://vercel.com) → **Add New Project** → import GitHub repo.
2. **Root Directory:** `client`
3. Framework: **Vite** (auto-detected from `client/vercel.json`).
4. Environment variable:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://YOUR-API.onrender.com` (no trailing slash) |

5. Deploy.

`client/vercel.json` configures SPA routing (all routes → `index.html`).  
API requests go directly to `VITE_API_URL`, not through Vercel rewrites.

### Vercel preview deployments

Add preview origins on the backend:

```env
CLIENT_URL=https://your-app.vercel.app,https://*.vercel.app
```

Wildcard `*.vercel.app` allows Vercel preview URLs.

---

## 4. Socket.IO in production

- Client: `io(getApiUrl(), { path: '/socket.io/', transports: ['websocket', 'polling'] })`
- Server: same path, CORS via `CLIENT_URL`
- Render free tier may sleep — first request can take ~30s; Socket.IO will reconnect.

---

## 5. Local production smoke test

```bash
npm install
npm run build

# Terminal 1 — API
cd server
set NODE_ENV=production
set MONGO_URI=mongodb://127.0.0.1:27017/incident-room
set CLIENT_URL=http://localhost:4173
npm run start

# Terminal 2 — built frontend
cd client
set VITE_API_URL=http://localhost:4000
npm run preview
```

Open http://localhost:4173 and test dashboard + live updates.

---

## 6. Post-deploy checklist

- [ ] `https://YOUR-API/health` returns `ok: true`
- [ ] Vercel app loads dashboard (no CORS errors in console)
- [ ] Create incident works
- [ ] Post update → appears without refresh (Socket.IO)
- [ ] AI summary / next actions work (or rule-based fallback)
- [ ] `CLIENT_URL` includes production + preview Vercel URLs

---

## 7. Push config to GitHub

```bash
git add .
git commit -m "Prepare production deployment"
git push origin main
```

Redeploy Vercel and Render after pushing.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error | Set `CLIENT_URL` to exact Vercel URL(s); use `https://*.vercel.app` for previews |
| Socket disconnects | Ensure `VITE_API_URL` is `https://` and matches Render URL |
| API 502 on Render | Check logs; confirm `MONGO_URI`; free tier cold start |
| Blank page on refresh | Confirm `client/vercel.json` SPA rewrite is deployed |
| `VITE_API_URL` undefined | Rebuild Vercel after adding env var |
