# Habesha Spice Tracker — Taem Baltina

Monolithic Next.js app for managing spice production and distribution (B2B).

Quick start (after installing Node.js and Docker):

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Start local Postgres:

```bash
docker compose up -d
```

3. Install dependencies:

```bash
npm install
```

4. Run dev server:

```bash
npm run dev
```

Development notes: Drizzle is used for DB modeling and migrations. See `db/schema.ts` for table definitions.

Migrations and seed
-------------------

After starting the local Postgres (`docker compose up -d`), apply the initial migration and seed sample products, raw ingredients, and product recipes:

```bash
npm ci
# Push schema using drizzle-kit (configured in `drizzle.config.ts`)
npm run drizzle:push
# Seed initial products (Berbere, Shiro, Mitmita), ingredients, and recipes
npm run seed
```

If you prefer to run the raw SQL migration instead of `drizzle:push`, you can execute the file `drizzle/migrations/0001_init.sql` against your database.
