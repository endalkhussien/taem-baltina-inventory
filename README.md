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

After starting the local Postgres (`docker compose up -d`), apply the migrations and seed sample products, raw ingredients, product recipes, and credit customers:

```bash
npm ci
# Push schema using drizzle-kit (configured in `drizzle.config.ts`)
npm run drizzle:push
# Seed initial products (Berbere, Shiro, Mitmita), ingredients, recipes, and customers
npm run seed
```

If you prefer to run the raw SQL migration instead of `drizzle:push`, you can execute the file `drizzle/migrations/0001_init.sql` against your database.
Then apply `drizzle/migrations/0002_customers_production.sql` for customers, customer-linked sales, and production batches.
