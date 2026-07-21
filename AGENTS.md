# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 14 app (App Router) called "Taem Baltina" — an internal spice inventory/sales tracker backed by PostgreSQL via Drizzle ORM. Standard commands live in `package.json` and `README.md`; only the non-obvious cloud caveats are captured here.

### Database (PostgreSQL) — must be running before dev/build-time DB use
- The repo's `docker-compose.yml` expects Docker, but Docker is not available in this environment. Instead, PostgreSQL 16 is installed natively via `apt` and persists in the VM snapshot (cluster + `taem_baltina_dev` database + seed data included).
- Postgres does NOT auto-start on VM boot. Start it each session before running the app or DB scripts:
  ```bash
  sudo pg_ctlcluster 16 main start
  ```
- Connection matches `.env`: `postgresql://postgres:postgres@localhost:5432/taem_baltina_dev` (user `postgres` / password `postgres`).
- `.env` is gitignored (persists in the snapshot, not committed). It sets `DATABASE_URL`, `ADMIN_USER=admin`, `ADMIN_PASS=password`, and `JWT_SECRET`. If `.env` is missing, recreate it from `.env.example`.
- Schema/seed already applied. To reset or re-apply: `npm run drizzle:push` (creates/updates tables from `db/schema.ts`) then `npm run seed` (idempotent starter data). `db/schema.ts` is the source of truth; the SQL files in `drizzle/` are reference only.

### Run / quality checks
- Dev server: `npm run dev` (http://localhost:3000; `/` redirects to `/admin/dashboard`, unauthenticated users land on `/admin/login`).
- Login with `ADMIN_USER` / `ADMIN_PASS` (default `admin` / `password`).
- Lint: `npm run lint` · Typecheck: `npm run typecheck` · Build: `npm run build`.
- The husky `pre-commit` hook runs `npm run typecheck && npm run lint`, so keep both green before committing.
