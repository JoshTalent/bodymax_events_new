# Bodymax — Boxing Tournament Management System

A serverless boxing tournament management system built for a single promoter.

**Stack:** React + Tailwind CSS (frontend) · Netlify Functions (serverless API) · MongoDB Atlas (database) · Custom JWT authentication

> Note: Mongoose is used at runtime inside Netlify Functions. The `shared/models` directory is only consumed by the serverless functions and the seed script — the React app never imports it.

## Features (MVP)

- **Authentication** — custom JWT with three roles: `promoter`, `club`, `official`
- **Promoter dashboard** — overview of events, clubs, boxers, registrations, payments, weigh-ins
- **Event management** — create/edit events with categories, fees, dates, rules; open/close registration
- **Club management** — create clubs with login credentials; view their boxers
- **Boxer management** — clubs maintain a permanent boxer database
- **Registration flow** — clubs register boxers → promoter approves/rejects/requests correction
- **Payment tracking** — clubs submit payment info → promoter confirms or rejects
- **Weigh-in tracking** — record official weights; mark boxers eligible/not eligible
- **Draw & brackets** — generate single-elimination brackets per category, regenerate, view bracket rounds
- **Bout scheduling** — assign ring, date, time, and status to each fight
- **Results** — record winner, method (Decision/KO/TKO/RSC/Disqualification/Walkover), round; winner automatically advances to the next round
- **Public site** — publicly visible events (opt-in per event)

## Project Structure

```
bodymax/
├── src/
│   ├── components/     # Reusable UI (Button, Card, Field, Badge, Modal, Loading)
│   ├── context/        # Auth + Toast providers
│   ├── pages/
│   │   ├── public/     # Public homepage, event list, event detail
│   │   ├── promoter/   # Dashboard, events, clubs, boxers, registrations
│   │   └── club/       # Dashboard, boxer DB, register for events
│   ├── utils/api.js    # Authenticated fetch wrapper
│   └── App.jsx         # Routing
├── netlify/functions/  # Serverless API endpoints (one file per endpoint)
│   ├── _shared/        # Shared code bundled into functions (models, db, auth)
│   ├── auth-login.mjs, auth-me.mjs
│   ├── users-create.mjs
│   ├── clubs.mjs
│   ├── events.mjs, events-create.mjs, events-update.mjs
│   ├── boxers.mjs
│   ├── registrations.mjs, registrations-manage.mjs, registrations-payment.mjs
│   ├── weighins-record.mjs
│   ├── draws-generate.mjs, draws-get.mjs
│   ├── bouts.mjs
│   ├── results-record.mjs
│   ├── dashboard.mjs   # statistics
│   └── public-events.mjs
├── shared/             # Mirrored models used by the local seed script
├── scripts/            # seed-promoter.mjs
└── netlify.toml        # Netlify build/function config
```

> **Note on function paths:** Netlify's classic functions expose each file as a flat, dash-named endpoint — `functions/auth-login.mjs` → `/.netlify/functions/auth-login`. The frontend `src/utils/api.js` includes a `PATH_MAP` that translates friendly paths (e.g. `/auth/login`) to these flat endpoints. Do not use nested folders for functions on the default Netlify plan, as those do not map to the URLs the frontend expects.

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your MongoDB Atlas URI and a JWT secret:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/bodymax
JWT_SECRET=<a-long-random-string>
```

### 3. Seed the promoter account

```bash
npm run seed
```

### 4. Run locally

Run the Netlify functions server and the Vite dev server in two terminals:

```bash
npm run start:functions   # serves functions at http://localhost:8888
npm run dev               # serves React at http://localhost:5173
```

The Vite dev server proxies `/.netlify/functions/*` to `http://localhost:8888` (see `vite.config.js`).

> Requires Netlify CLI: `npm install -g netlify-cli`

**Default promoter login** (from `.env`): `promoter@bodymax.com` / `promoter123` (change after first login).

## Creating a Club

1. Log in as the **promoter**.
2. Go to **Clubs → Add Club**.
3. Fill in the club details plus a login email/password.
4. The club can now log in, add boxers, and register for events.

## API Endpoints

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/auth-login` | Authenticate | Public |
| GET | `/auth-me` | Current user | Auth |
| POST | `/users-create` | Create club account | Promoter |
| GET | `/clubs` | List clubs / own club | Promoter / Club |
| GET | `/events` | List events | Auth |
| POST | `/events-create` | Create event | Promoter |
| PUT/PATCH | `/events-update?id=` | Update event | Promoter |
| GET/POST/PUT/DELETE | `/boxers` | Boxer CRUD | Promoter / Club |
| GET/POST | `/registrations` | List / submit | Auth / Club |
| POST | `/registrations-manage?id=` | Approve/reject/confirm | Promoter |
| PUT | `/registrations-payment?id=` | Submit payment | Club / Promoter |
| POST | `/weighins-record` | Record official weight | Promoter / Weigh-in official |
| GET | `/draws-get` | View bracket by round | Auth |
| POST | `/draws-generate` | Generate bracket from eligible boxers | Promoter |
| GET/PATCH | `/bouts` | List / schedule bouts | Promoter |
| POST | `/results-record` | Record result, advance winner | Promoter / Results official |
| GET | `/dashboard` | Statistics | Promoter / Club |
| GET | `/public-events` | Public event listing | Public |

> All endpoints are served under `/.netlify/functions/`. The frontend calls these friendly/flat names directly (see `src/utils/api.js`).

## Deployment (Netlify)

1. Push this repository to GitHub.
2. In Netlify, **Add new site → Import from Git**.
3. Set the build command to `npm run build` and publish directory to `dist` (already in `netlify.toml`).
4. **Add environment variables** in Netlify → **Site settings → Environment variables** (until these are set, every function returns a 502):
   - `MONGODB_URI` — your MongoDB Atlas connection string, e.g. `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/bodymax?retryWrites=true&w=majority`
   - `JWT_SECRET` — a long random string (e.g. `openssl rand -hex 32`)
5. Redeploy. Serverless functions are auto-detected from `netlify/functions`.

> **Troubleshooting a 502:** A `502 Bad Gateway` on function routes almost always means `MONGODB_URI` is missing/misconfigured in Netlify. Check it's set, then redeploy. View per-function errors under **Site settings → Functions → (function) → Logs**.

## Status Lifecycle (Registration)

```
registered → pending_approval → approved → payment_pending
   → payment_confirmed → awaiting_weighin → weighed → eligible
```

With branch statuses: `needs_correction`, `withdrawn`, `not_eligible`, `eliminated`, `completed`.

## Roadmap (Phase 3)

- Notifications
- Certificate and report generation
- Club-facing bracket/schedule/result views
- Event officials management UI
- File upload for documents and proof of payment
