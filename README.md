# Habesha Spice Tracker — Taem Baltina

Internal Next.js inventory app for managing spice raw materials, production, B2B sales, customer credit, repayments, and expenses.

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

Live deployment
---------------

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for step-by-step instructions to put the app live with Vercel and Neon Postgres.

Migrations and seed
-------------------

After starting the local Postgres (`docker compose up -d`), create tables and seed sample products, raw ingredients, product recipes, and credit customers:

```bash
npm ci
# Create or update tables from db/schema.ts (recommended for local and Vercel/Neon)
npm run drizzle:push
# Seed initial products, ingredients, recipes, and customers (starts with zero stock)
npm run seed
```

`db/schema.ts` is the source of truth for the database. Use `npm run drizzle:push` for both local development and production (Neon).

To wipe all transactional data and start from zero amounts:

```bash
CONFIRM_RESET=yes DATABASE_URL="your-neon-url" npm run reset
```

Or use **Finance → Start fresh** in the app (type `RESET ALL` to confirm).

The SQL files in `drizzle/migrations/` are kept for reference. If you prefer raw SQL instead of `drizzle:push`, apply them in order through `0006_production_costs.sql`.

The **Finance** page (`/admin/finance`) lets you record manual cash-on-hand counts, debts you owe (bank, family, supplier), payments against those debts, and see your net position (cash + customer credit − debts owed).

Production batches record **material cost** (from raw material prices × recipe), plus **labour**, **equipment** (e.g. grinding machine), and **other overhead**. The dashboard uses these costs to estimate profit on sales.

Admin login is stored in the database. Use `/admin/forgot-password` with `PASSWORD_RESET_SECRET` to create or reset an account, and `/admin/account` to change your password after signing in.

Quality checks
--------------

```bash
npm run typecheck
npm run lint
npm run build
```
