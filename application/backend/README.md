# CloudBoard Backend

Node.js + Express + MongoDB (Mongoose) API.

## Endpoints

| Method | Path         | Description                          |
|--------|--------------|---------------------------------------|
| GET    | `/`          | Service info                          |
| GET    | `/health`    | Health check (app + MongoDB status)   |
| GET    | `/api/users` | List users (most recent 100)          |
| POST   | `/api/users` | Create a user (`name`, `email`)       |

## Local development

```bash
cp .env.example .env      # edit if your MongoDB URI differs
npm install
npm run dev                # nodemon, auto-restarts on change
```

Server starts and answers `/health` immediately, even before MongoDB is reachable -
this is intentional (see `src/db/connection.js`), so Kubernetes readiness/liveness
probes never depend on the database being up.

## Testing

```bash
npm test        # runs Jest with mocked Mongoose model layer
npm run lint     # ESLint
```

> **Note:** `mongodb-memory-server` is included as a dev dependency for full
> DB-integration testing (spins up a real, ephemeral MongoDB for the test run).
> In this development sandbox that approach is disabled because outbound network
> access is restricted to an allowlist that excludes `fastdl.mongodb.org` (the
> binary download host) - `tests/api.test.js` mocks the model layer instead so
> tests are runnable here. The GitHub Actions CI pipeline (Phase 4) has normal
> internet access and can use the full in-memory-DB integration approach if
> preferred; either strategy is valid for this project.

## Design notes

- **Config** (`src/config`) is the single source of truth for env vars; it fails
  fast in production if `MONGO_URI` is missing.
- **Structured logging** (`src/utils/logger.js`) uses Pino, emitting JSON in every
  environment except local development (pretty-printed there). This is what
  Promtail/Loki will scrape from container stdout in Phase 13.
- **DB connection** does not block server startup and retries with backoff;
  `/health` reports real MongoDB connectivity rather than assuming it.
- **Graceful shutdown** handles `SIGTERM`/`SIGINT` (what Kubernetes sends before
  killing a pod): stop accepting new connections, let in-flight requests finish,
  close the MongoDB connection, then exit - with a hard timeout as a safety net.
