# Mini SaaS Template Store

A full-stack web application for browsing, searching and saving website templates. Users can create an account, explore a catalog of templates, filter by category, search by name or description, and keep a personal list of favorites.

> Repository: `fullstack-intern-task` · Frontend: React + Vite + Tailwind CSS · Backend: Node.js + Express + PostgreSQL

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Running with Docker](#running-with-docker)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Author](#author)

---

## Features

**Core**
- Registration and login with JWT authentication (bcrypt-hashed passwords)
- Template catalog with thumbnails, descriptions and categories
- Favorites: add, remove and view your own collection
- Logout that clears the stored token and the in-memory session

**Bonus features (all implemented)**
- Server-side **search** by name or description (debounced; held in the URL, so results are shareable)
- **Category filter** with per-category counts
- **Pagination** for the catalog and favorites
- **Protected routes**: `/favorites` requires login; guests are returned to their original page after signing in
- **Responsive, accessible UI**: mobile menu, keyboard navigation, visible focus states, labelled controls, skeleton loaders, empty states, error states with retry, and image fallbacks
- **Deployment configuration** for Render (API + PostgreSQL via `render.yaml`) and Vercel (frontend via `client/vercel.json`)
- **Environment configuration** for development, test and production, with fail-fast validation in production

**UX details**
- Optimistic favorite toggling with automatic rollback on failure
- "Undo" after removing a favorite
- Session restore on refresh, and automatic logout when the token expires or the API returns 401
- Stale requests are aborted, so a slow response can never overwrite newer results

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7, Axios, React Hook Form, Zod, Sonner (toasts), Lucide icons |
| Backend | Node.js (≥ 20), Express 5, Knex.js, PostgreSQL, jsonwebtoken, bcryptjs, Zod, Helmet, CORS, express-rate-limit |
| Testing | Vitest + React Testing Library (client), Jest + Supertest (server) |
| Tooling | ESLint (flat config), Docker Compose (local development environment) |

## Architecture

```
React SPA (Vite)                          Express API                                PostgreSQL
─────────────────                         ──────────────────────────────────         ──────────
pages ─▶ hooks ─▶ services/api.js ─HTTP─▶ routes ─▶ middleware (auth, validate) ─▶   users
           ▲            │ (Axios +              │                                      templates
     AuthContext        │  JWT interceptor)     ▼                                      favorites
                        │                   controllers ─▶ services ─▶ Knex ────────▶
                        ▼                         ▲
                  localStorage (JWT)        errorHandler (central, consistent JSON)
```

**Backend layering: routes → controllers → services → database**
- **Routes** declare the endpoint, the middleware chain and the validator.
- **Middleware** handles cross-cutting concerns: `requireAuth` / `optionalAuth`, Zod `validate`, rate limiting, request logging, and the central error handler.
- **Controllers** are thin. They read `req.validated` and shape the HTTP response.
- **Services** hold the business logic and all Knex queries, with no Express objects. They throw `ApiError`s that the error handler turns into responses.

**Frontend**
- `services/api.js` is the single Axios instance. It attaches the JWT and broadcasts an event on 401 responses.
- `context/AuthContext.jsx` owns the session: login, register, logout, session restore and expiry.
- `hooks/usePaginatedQuery.js` handles fetching, abort-on-change, reload and local patching.
- `hooks/useFavoriteToggle.js` handles optimistic favorite updates with rollback.
- Pages compose small presentational components (`TemplateCard`, `CatalogFilters`, `Pagination`, `StatusViews`, and others).

**Database**

| Table | Key columns | Constraints and indexes |
| --- | --- | --- |
| `users` | `id`, `name`, `email`, `password_hash`, timestamps | `email` unique |
| `templates` | `id`, `slug`, `name`, `description`, `thumbnail_url`, `category`, timestamps | `slug` unique; indexes on `category`, `name` |
| `favorites` | `id`, `user_id`, `template_id`, `created_at` | **unique (`user_id`, `template_id`)**; FKs with `ON DELETE CASCADE`; index on `template_id` |

## Project structure

```
fullstack-intern-task/
├── client/                     # React SPA
│   ├── public/
│   ├── src/
│   │   ├── components/         # UI building blocks (cards, filters, nav, guards, ui/*)
│   │   ├── context/            # AuthProvider + context object
│   │   ├── hooks/              # useAuth, usePaginatedQuery, useFavoriteToggle, useCategories
│   │   ├── layouts/            # AppLayout, AuthLayout
│   │   ├── pages/              # Login, Register, Templates, Favorites, NotFound
│   │   ├── services/           # Axios client + auth/template/favorite API calls
│   │   ├── test/               # Vitest + RTL suites and helpers
│   │   ├── utils/              # token storage, validation schemas, error helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile              # Dev image for the Vite dev server
│   ├── vercel.json
│   └── vite.config.js
├── server/                     # Express API
│   ├── migrations/             # Knex migrations (users, templates, favorites)
│   ├── seeds/                  # Idempotent catalog seed
│   ├── src/
│   │   ├── config/             # env loading + validation
│   │   ├── controllers/
│   │   ├── db/                 # Knex instance, PG error helpers, sample catalog
│   │   ├── middleware/         # auth, validate, rate limiters, logging, errors
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/         # Zod schemas
│   │   ├── app.js              # Express app factory (used by tests)
│   │   └── server.js           # Process entry point
│   ├── tests/                  # Jest + Supertest suites
│   ├── Dockerfile              # Dev image for the API
│   └── knexfile.js
├── docker/postgres/initdb/     # One-time Postgres init (creates the _test database)
├── compose.yaml                # Docker Compose: db + server + client
├── render.yaml                 # Render Blueprint (API + Postgres)
├── .env.example                # Docker Compose variables (+ reference for app env files)
├── package.json                # Convenience scripts for both apps
└── README.md
```

## Getting started

### Prerequisites
- **Node.js 20+** (developed with Node 24) and npm
- **PostgreSQL 14+** running locally (or any reachable instance)

### 1. Install dependencies

```bash
npm run install:all          # or: cd server && npm install, then: cd client && npm install
```

### 2. Create the databases

```bash
createdb -U postgres template_store
createdb -U postgres template_store_test   # used only by the test suite
```

On Windows, if `createdb` isn't on your PATH, use `"C:\Program Files\PostgreSQL\<version>\bin\createdb.exe"`, or run `CREATE DATABASE template_store;` in psql or pgAdmin.

### 3. Configure the server

```bash
cp server/.env.example server/.env
```

Edit `server/.env`. At minimum, set `DB_PASSWORD` (or `DATABASE_URL`) and a random `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The client needs no configuration in development. Vite proxies `/api` to `http://localhost:4000`.

### 4. Migrate and seed

```bash
npm run db:setup             # = cd server && npm run migrate && npm run seed
```

The seed upserts 12 templates across 6 categories, keyed by `slug`. It is safe to run repeatedly and never deletes users or favorites.

### 5. Run

```bash
npm run dev:server           # API on http://localhost:4000 (auto-restarts on change)
npm run dev:client           # App on http://localhost:5173
```

Open http://localhost:5173, create an account, and start saving templates.

### Useful scripts

| Location | Script | Purpose |
| --- | --- | --- |
| `server/` | `npm run dev` / `npm start` | Start the API (watch mode / plain) |
| `server/` | `npm run migrate` / `migrate:rollback` | Apply / roll back migrations |
| `server/` | `npm run seed` | Upsert the sample catalog |
| `server/` | `npm test` / `npm run test:coverage` | API tests |
| `server/` | `npm run lint` | ESLint |
| `client/` | `npm run dev` / `build` / `preview` | Vite dev server / production build / preview |
| `client/` | `npm test` / `npm run lint` | Component tests / ESLint |
| root | `npm test` / `npm run lint` / `npm run build` | Run both apps' checks |

## Running with Docker

Docker Compose runs the whole stack (PostgreSQL, the API and the Vite dev server), so you don't need Node.js or PostgreSQL installed locally. It's an alternative to the manual setup above, and both approaches keep working.

### Prerequisites
- **Docker Desktop** (Windows/macOS) or **Docker Engine + Compose v2** (Linux). Check with `docker compose version`.
- Free host ports **5173** (app), **4000** (API) and **5433** (database). You can change all three in `.env`.

### How it fits together

| Service | Image | Host URL | Notes |
| --- | --- | --- | --- |
| `db` | `postgres:18-alpine` | `localhost:5433` (127.0.0.1 only) | Data lives in the named volume `template-store_db-data`. Health-checked with `pg_isready` |
| `server` | `server/Dockerfile` | http://localhost:4000/api | Starts only after `db` is healthy. Connects to the host **`db`**, not `localhost` |
| `client` | `client/Dockerfile` | **http://localhost:5173** | Vite dev server with hot reload. Starts after `server` is healthy |

The browser only talks to `http://localhost:5173`. The Vite dev server forwards every `/api/*` request over the Compose network to `http://server:4000`, using the existing `VITE_DEV_API_PROXY` setting. Because of this, no API URL is baked into the frontend at build time, and CORS doesn't come into play. Containers use service names to reach each other because, inside a container, `localhost` means that container itself.

### 1. Configure

```bash
cp .env.example .env        # root .env: read by Docker Compose, git-ignored
```

Edit `.env` and set at least `POSTGRES_PASSWORD` and `JWT_SECRET`. Compose refuses to start without them. To generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# or: openssl rand -hex 48
```

The containers do **not** use `server/.env`, and it is never copied into an image. The API gets its configuration from `compose.yaml`.

### 2. Start

```bash
docker compose up --build -d      # or: npm run docker:up
docker compose ps                 # db and server should show "(healthy)"
```

### 3. Initialize the database (migrations and seed)

```bash
docker compose exec server npm run db:setup    # or: npm run docker:db:setup
```

This runs the same `knex migrate:latest` and `knex seed:run` scripts as the local setup.
- **Nothing runs automatically.** Containers never migrate or seed on startup, so the database only changes when you run this command.
- **Safe to repeat.** Migrations that were already applied are skipped. The seed only upserts the 12 sample templates by slug and never deletes users or favorites.
- **Safe to run concurrently.** Knex holds a lock in `knex_migrations_lock` while migrating, so two runs at once cannot apply the same migration twice. In a tight race the second run either finds the schema "Already up to date" or stops with a "Migration table is already locked" error; if that happens, run the command again.

### 4. Open the app

- App: **http://localhost:5173**
- API health: http://localhost:4000/api/health should return `{"status":"ok","database":"up",...}`
- Database (optional): `psql -h localhost -p 5433 -U postgres template_store`, or `docker compose exec db psql -U postgres template_store`

### Everyday commands

```bash
docker compose logs -f server               # follow API logs (npm run docker:logs follows all services)
docker compose restart server               # pick up backend code changes (see "Hot reload" below)
docker compose exec server npm test         # run the API tests against the <db>_test database
docker compose exec server npm run lint
docker compose up --build -d                # rebuild after changing package.json / package-lock.json
docker compose down                         # stop and remove containers; data is kept
docker compose down -v                      # WARNING: also deletes the database volume (all users and favorites)
```

**Hot reload**
- **Frontend:** `client/src`, `client/public` and `client/index.html` are bind-mounted, and the Vite dev server polls for changes (`VITE_USE_POLLING=true`), so edits show up in the browser right away.
- **Backend:** `server/src`, `migrations`, `seeds` and `tests` are bind-mounted, and the API runs with `node --watch`. On Linux hosts it restarts by itself. Docker Desktop on Windows and macOS doesn't forward file-change events for these mounts, so run `docker compose restart server` after backend edits there.
- **Dependencies:** changes to `package.json` or `package-lock.json` need `docker compose up --build -d`.

**Persistent data**
- The database lives in the named volume `template-store_db-data`. It survives `down`, `up`, rebuilds and restarts.
- Only `docker compose down -v` or `docker volume rm template-store_db-data` deletes it.
- When the volume is first created, the script in `docker/postgres/initdb/` also creates a separate `<POSTGRES_DB>_test` database for the test suite. The tests refuse to run against any database whose name doesn't end in `_test`.

**Production builds.** The Compose setup is for development only. A static production build reads `VITE_API_URL` at **build time**, because Vite inlines it into the bundle. It has to be set when building, as Vercel does. Changing it while a container is running has no effect. Deployment stays on Render and Vercel, as described under [Deployment](#deployment).

## Environment variables

### Server (`server/.env`)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | `development`, `test` or `production` |
| `PORT` | no | `4000` | HTTP port |
| `DATABASE_URL` | **prod** | — | Postgres connection string. Takes precedence over `DB_*` |
| `DATABASE_SSL` | no | `false` | `true` to connect with SSL (e.g. an external Render URL) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | dev | `localhost` / `5432` / `postgres` / — / `template_store` | Local connection settings |
| `DB_NAME_TEST` / `TEST_DATABASE_URL` | tests | `template_store_test` | Test database. **Must end in `_test`** |
| `JWT_SECRET` | **yes** | — | HMAC signing secret. At least 32 characters in production |
| `JWT_EXPIRES_IN` | no | `1d` | Token lifetime (e.g. `1h`, `7d`) |
| `BCRYPT_ROUNDS` | no | `12` | bcrypt cost factor |
| `CORS_ORIGIN` | **prod** | `http://localhost:5173` | Comma-separated allowed frontend origins |
| `TRUST_PROXY` | no | `0` | Proxy hops in front of the API (`1` on Render) |
| `AUTH_RATE_LIMIT_WINDOW_MS` / `AUTH_RATE_LIMIT_MAX` | no | `900000` / `20` | Login/register rate limit per IP |

In production the server **refuses to start** if `DATABASE_URL`, `CORS_ORIGIN` or a strong `JWT_SECRET` is missing.

### Client (`client/.env.local`, optional)

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | API base URL including `/api`. Leave unset locally; set it on Vercel (e.g. `https://template-store-api.onrender.com/api`) |
| `VITE_DEV_API_PROXY` | Dev-only proxy target (default `http://localhost:4000`) |

## API reference

Base URL: `http://localhost:4000/api`. All responses are JSON.

- Success: `{ "data": ..., "meta"?: {...} }`
- Error: `{ "error": { "code": "...", "message": "...", "details"?: [{ "field", "message" }] } }`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | — | Service and database status |
| POST | `/auth/register` | — | Create an account (rate-limited) |
| POST | `/auth/login` | — | Get a JWT (rate-limited) |
| GET | `/auth/me` | Bearer | Current user |
| GET | `/templates` | optional | List templates (search, category, pagination) |
| GET | `/templates/categories` | — | Categories with counts |
| GET | `/templates/:id` | optional | Template detail |
| GET | `/favorites` | Bearer | Your favorites (paginated) |
| POST | `/favorites/:templateId` | Bearer | Add a favorite |
| DELETE | `/favorites/:templateId` | Bearer | Remove a favorite |

Authenticated requests send `Authorization: Bearer <token>`. On the public template endpoints a valid token is optional. When one is sent, each template includes the user's `is_favorited` state.

### Auth

**`POST /api/auth/register`**

```http
POST /api/auth/register
Content-Type: application/json

{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "Analytical1" }
```

`201 Created`

```json
{
  "data": {
    "user": { "id": 1, "name": "Ada Lovelace", "email": "ada@example.com", "created_at": "2026-10-11T08:00:00.000Z" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Rules: name 2–100 characters. Email must be valid and is trimmed and lower-cased. Password must be 8–72 characters with at least one letter and one number.
Errors: `400 VALIDATION_ERROR` (with `details`), `409 CONFLICT` (email already registered), `429 RATE_LIMITED`.

**`POST /api/auth/login`**: body `{ "email", "password" }`. Returns `200` with the same shape as register.
Errors: `400`, `401 UNAUTHORIZED` (`"Invalid email or password"`, the same message for an unknown email or a wrong password), `429`.

**`GET /api/auth/me`**: returns `200 { "data": { "user": { ... } } }`, or `401` if the token is missing, malformed, expired, has the wrong signature or claims, or belongs to a deleted user.

### Templates

**`GET /api/templates?search=&category=&page=1&limit=12`**

| Param | Type | Notes |
| --- | --- | --- |
| `search` | string ≤ 100 | Case-insensitive match on name **or** description. Wildcards are treated literally |
| `category` | string ≤ 50 | Exact category name, as returned by `/templates/categories` |
| `page` | int ≥ 1 | Default `1` |
| `limit` | int 1–50 | Default `12` |

```http
GET /api/templates?search=dashboard&page=1&limit=2
```

`200 OK`

```json
{
  "data": [
    {
      "id": 2,
      "name": "Metricly",
      "description": "Analytics dashboard with KPI cards, revenue charts, a sortable data table and a collapsible sidebar for internal tools.",
      "thumbnail_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=960&q=70",
      "category": "Dashboard",
      "is_favorited": false
    }
  ],
  "meta": { "page": 1, "limit": 2, "total": 1, "totalPages": 1 }
}
```

Errors: `400 VALIDATION_ERROR` for invalid query parameters.

**`GET /api/templates/categories`** returns `200 { "data": [{ "name": "Blog", "count": 2 }, ...] }`

**`GET /api/templates/:id`** returns `200 { "data": { ...template } }`. Errors: `400` for an id that is not a positive integer, `404 NOT_FOUND`.

### Favorites (authentication required)

**`POST /api/favorites/:templateId`** returns `201`

```json
{ "data": { "id": 7, "template_id": 2, "created_at": "2026-10-11T08:05:00.000Z" } }
```

Errors: `400` (invalid id), `401`, `404` (template does not exist), `409 CONFLICT` (already favorited, enforced by a database unique constraint).

**`GET /api/favorites?page=1&limit=12`** returns `200`. Results are newest first, and each item is the template plus `favorited_at`:

```json
{
  "data": [
    { "id": 2, "name": "Metricly", "description": "...", "thumbnail_url": "...", "category": "Dashboard",
      "favorited_at": "2026-10-11T08:05:00.000Z", "is_favorited": true }
  ],
  "meta": { "page": 1, "limit": 12, "total": 1, "totalPages": 1 }
}
```

**`DELETE /api/favorites/:templateId`** returns `204 No Content`. Errors: `400`, `401`, `404` (not in *your* favorites).

### Example with curl

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"Analytical1"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).data.token")

curl -X POST   http://localhost:4000/api/favorites/2 -H "Authorization: Bearer $TOKEN"
curl           http://localhost:4000/api/favorites   -H "Authorization: Bearer $TOKEN"
curl -X DELETE http://localhost:4000/api/favorites/2 -H "Authorization: Bearer $TOKEN"
```

## Testing

```bash
cd server && npm test        # 70 API tests: Jest + Supertest against a real PostgreSQL test DB
cd client && npm test        # 39 UI tests: Vitest + React Testing Library (API mocked)
npm test                     # both, from the repository root
```

**Server tests** run against the database named by `DB_NAME_TEST` / `TEST_DATABASE_URL`. A global setup applies migrations. Before each test the tables are truncated and the catalog is reloaded. As a safety guard, the suite **refuses to run unless the database name ends in `_test`**, so development data cannot be wiped. Coverage includes:
- registration (success, email normalization, bcrypt hashing, duplicates, invalid input) and login (success, wrong password, unknown email)
- JWT handling: missing, malformed, forged, expired and wrong-claim tokens, plus tokens of deleted users
- template listing, pagination, search (including literal wildcards), category filter, detail lookup, invalid ids, 404s
- favorites: create, duplicate (including concurrent requests), DB-level unique constraint, isolation between users, removal, 404s, cascade on user delete
- security headers, CORS allow/deny, body-size limit, JSON 404s, health check

**Client tests** cover form validation, API error feedback (including network errors), password visibility, protected routes and session restore, expired sessions, redirect-after-login, rendering, loading skeletons, image fallbacks, debounced search, category filtering, pagination, empty and error states with retry, optimistic favorite toggling with rollback, guest redirect, the favorites page (removal, undo, empty state), and logout.

## Deployment

Render hosts the API and the database. Vercel hosts the frontend.

### 1. Database and API on Render

**Option A: Blueprint (recommended)**
1. Push this repository to GitHub.
2. In Render: **New → Blueprint**, then select the repository. `render.yaml` creates:
   - `template-store-db`: a PostgreSQL database
   - `template-store-api`: a Node web service (`rootDir: server`) that runs `npm ci`, then `npm run start:prod` (migrate → seed → start), with health check `/api/health`
3. When prompted, set `CORS_ORIGIN` to your Vercel URL (you can fill it in after step 2 below). Render generates `JWT_SECRET` and wires `DATABASE_URL` automatically.

**Option B: manual**
1. Create a **PostgreSQL** instance and copy its *Internal Database URL*.
2. Create a **Web Service** from the repository with root directory `server`, build command `npm ci`, and start command `npm run start:prod`.
3. Set the environment variables: `NODE_ENV=production`, `DATABASE_URL=<internal url>`, `JWT_SECRET=<random 48+ chars>`, `CORS_ORIGIN=<vercel url>`, `TRUST_PROXY=1`. Set `DATABASE_SSL=true` only if you use the *external* URL.

Check the deployment with `https://<your-api>.onrender.com/api/health`. It should return `{"status":"ok","database":"up"}`.

> Render free web services sleep when idle, so the first request after a pause can take 30–60 seconds.

### 2. Frontend on Vercel

1. **Add New → Project** and import the repository.
2. Set **Root Directory** to `client`. The framework is detected as Vite, and `client/vercel.json` sets the build, the SPA rewrites and the security headers.
3. Add the environment variable `VITE_API_URL=https://<your-api>.onrender.com/api`.
4. Deploy, then copy the Vercel URL into the API's `CORS_ORIGIN` on Render and redeploy the API.

`client/vercel.json` ships a strict Content-Security-Policy whose `connect-src` allows `https://*.onrender.com`. If the API is hosted somewhere else, update that directive.

## Security notes

- **Passwords** are hashed with bcrypt (cost 12) and never returned or logged. Login returns one generic error message and runs a dummy bcrypt comparison for unknown emails, so neither the message nor the timing shows whether an email is registered.
- **JWTs** are signed with HS256. The API pins the algorithm and checks the issuer and audience on every request. Tokens expire (default 1 day), and protected routes check that the user still exists.
- **Token storage (assignment requirement):** the JWT is stored in `localStorage`. Any JavaScript running on the page can read `localStorage`, so a single **cross-site scripting (XSS)** bug would let an attacker steal tokens. Mitigations in this project:
  - React escapes all rendered content, and the code never uses `dangerouslySetInnerHTML` or `eval`.
  - The production CSP in `vercel.json` allows scripts only from the app's own origin (no inline or third-party scripts).
  - Token lifetime is short, the token is cleared on logout and on any 401, and the session also ends client-side when the token expires.
  - Credential endpoints never receive the token.
  - In a production system, prefer an **`HttpOnly`, `Secure`, `SameSite` cookie** (plus CSRF protection) so scripts can't read the token at all.
- **Input validation** with Zod on every endpoint (body, params and query). Unknown or malformed input returns `400` with field details.
- **SQL injection:** all queries go through Knex parameter binding, and LIKE wildcards in search input are escaped.
- **HTTP hardening:** Helmet security headers, `x-powered-by` disabled, CORS restricted to configured origins, 10 kB JSON body limit, rate limits on `/auth/*` (20 requests / 15 min / IP) and on the API overall.
- **Errors:** handled centrally. In production, 500 responses never include stack traces or database messages.
- **Logs:** record only method, path, status and duration. Bodies, headers, query strings and tokens are never logged.
- **Secrets:** come only from environment variables. `.env` files are git-ignored, and the `.env.example` files contain placeholders only.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `JWT_SECRET is required` on startup | Create `server/.env` from `.env.example` and set `JWT_SECRET`. |
| `Could not connect to PostgreSQL ... ECONNREFUSED` | Postgres isn't running, or `DB_HOST`/`DB_PORT` is wrong. On Windows, check the `postgresql-x64-<ver>` service. |
| `password authentication failed for user` | Fix `DB_USER`/`DB_PASSWORD` (or `DATABASE_URL`) in `server/.env`. |
| `database "template_store" does not exist` | Run `createdb template_store` (and `template_store_test` for tests). |
| `relation "templates" does not exist` | Run `npm run db:setup` in `server/`. |
| Tests fail with `Refusing to run tests against database ...` | Point `DB_NAME_TEST`/`TEST_DATABASE_URL` at a database whose name ends with `_test`. |
| Tests fail with `Could not prepare the test database` | Create the test database: `createdb template_store_test`. |
| Browser shows CORS errors in production | `CORS_ORIGIN` on the API must exactly match the Vercel origin (scheme + host, no trailing slash). |
| Frontend calls fail on Vercel (`/api/...` 404) | Set `VITE_API_URL` in Vercel and **redeploy**. Vite inlines env vars at build time. |
| Refreshing a page on Vercel returns 404 | Make sure Vercel's root directory is `client` so `vercel.json` rewrites apply. |
| Port 4000 or 5173 already in use | Change `PORT` in `server/.env` and set `VITE_DEV_API_PROXY` to match, or stop the other process. |
| **Docker:** `required variable POSTGRES_PASSWORD/JWT_SECRET is missing a value` | Create the root `.env` (`cp .env.example .env`) and set both values. |
| **Docker:** `ports are not available ... bind` | Another process is using 5173, 4000 or 5433. Stop it, or change `WEB_PORT` / `API_PORT` / `DB_PUBLISHED_PORT` in `.env`. |
| **Docker:** `server` never becomes healthy | Check `docker compose logs server`. `Could not connect to PostgreSQL` usually means `POSTGRES_PASSWORD` in `.env` changed after the volume was created; the volume keeps the original password. Put the old password back, or reset with `docker compose down -v` (this deletes all data). |
| **Docker:** `relation "templates" does not exist`, or the catalog is empty | Run `docker compose exec server npm run db:setup`. |
| **Docker:** `docker compose exec server npm test` can't find `template_store_test` | The volume was created before the init script existed. Run `docker compose exec db createdb -U postgres template_store_test`. |
| **Docker:** frontend changes don't appear | Make sure `VITE_USE_POLLING=true` is set in `.env`, run `docker compose up -d`, then hard-refresh the browser. |
| **Docker:** backend changes don't apply | Run `docker compose restart server`. Docker Desktop doesn't forward file-change events. |
| **Docker:** `Cannot connect to the Docker daemon`, or the `dockerDesktopLinuxEngine` pipe isn't found | Start Docker Desktop and wait until it shows as running. |
| Every login attempt returns 429 | You hit the auth rate limit. Wait 15 minutes or raise `AUTH_RATE_LIMIT_MAX` locally. |

## Author

- **Name:** _Chiranjeevi D_
- **Email:** _chiranjeevid011@gmail.com_
- **GitHub:** _https://github.com/chirannnn_
- **LinkedIn:** _https://www.linkedin.com/in/chiranjeevi-d_

Built as a full-stack internship assignment.
