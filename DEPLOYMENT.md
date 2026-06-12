# Make Taem Baltina Inventory Live

This app needs two hosted services:

1. **A Postgres database** for inventory, sales, customers, repayments, and production records.
2. **A Next.js host** for the web app.

The easiest setup is **Neon Postgres + Vercel**.

## 1. Create a hosted Postgres database

1. Go to [neon.tech](https://neon.tech).
2. Create a free account.
3. Create a new project/database.
4. Copy the database connection string.
   - Use the pooled connection string if Neon gives you one.
   - It should look like:

```text
postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Keep this value. You will use it as `DATABASE_URL`.

## 2. Deploy the app on Vercel

1. Go to [vercel.com](https://vercel.com).
2. Sign in with GitHub.
3. Click **Add New Project**.
4. Import this GitHub repository.
5. Keep the default framework setting: **Next.js**.
6. Add these environment variables:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Your Neon Postgres connection string |
| `JWT_SECRET` | A long random secret, for example from a password generator |
| `PASSWORD_RESET_SECRET` | A long recovery secret used on the forgot-password page |
| `ADMIN_USER` | Optional bootstrap username for the first login only |
| `ADMIN_PASS` | Optional bootstrap password for the first login only |

7. Click **Deploy**.

After deployment, Vercel gives you a live URL like:

```text
https://your-project.vercel.app
```

## 3. Create the database tables

The app will deploy before the database has tables, but the inventory pages need tables before they can work.

Run these commands from your computer or any terminal that has Node.js installed:

```bash
npm install
DATABASE_URL="your-neon-connection-string" npm run drizzle:push
DATABASE_URL="your-neon-connection-string" npm run seed
```

**No tables in Neon?** Use the SQL Editor instead:

1. Neon → your project → **SQL Editor**
2. Open `scripts/neon-full-setup.sql` from this repo
3. Copy the entire file, paste into SQL Editor, click **Run**
4. Refresh **Tables** — you should see `products`, `ingredients`, `sales`, `admin_users`, and the rest

What these commands do:

- `npm run drizzle:push` creates/updates the database tables from `db/schema.ts`, including indexes, foreign keys, and the recipe unique constraint required by the seed script.
- `npm run seed` adds starter products, raw materials, recipes, and sample customers. It automatically uses SSL when connecting to Neon.

Run `npm run seed` only once unless you intentionally want to re-check/update starter data.

Required Vercel environment variables:

| Name | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon pooled connection string with `sslmode=require` |
| `JWT_SECRET` | Yes | Long random secret for session cookies |
| `PASSWORD_RESET_SECRET` | Yes | Recovery secret for forgot-password and first-time setup |
| `ADMIN_USER` | No | Bootstrap username used only when no admin exists yet |
| `ADMIN_PASS` | No | Bootstrap password used only when no admin exists yet |
| `PG_POOL_MAX` | No | Optional Postgres pool size (default `3`) |

## 4. Create your admin account

Open your Vercel URL:

```text
https://your-project.vercel.app
```

The app redirects to the login page.

Choose one of these first-time setup options:

### Option A — Forgot password (recommended)

1. Open `/admin/forgot-password`
2. Enter your desired username
3. Enter your `PASSWORD_RESET_SECRET`
4. Set a new password
5. Sign in on `/admin/login`

### Option B — Bootstrap from environment variables

1. Set `ADMIN_USER` and `ADMIN_PASS` in Vercel
2. Redeploy
3. Sign in once with those credentials
4. The account is saved in the database
5. Change your password from `/admin/account`

After the first account exists, day-to-day login uses the database password. You do not need to keep changing `ADMIN_PASS` in Vercel.

## 5. Recommended first real setup

After logging in:

1. Go to **Raw Materials** and enter your real ingredients.
2. Use **Restock Raw Material** whenever you buy more raw materials.
3. Go to **Products** and create/edit your finished products.
4. Use **Recipe** on each product to define how much raw material is used per product unit.
5. Go to **Production** when you produce finished goods.
   - This deducts raw materials.
   - This increases product stock.
6. Go to **Customers** and add credit customers.
7. Go to **Sales & Credit** for daily sales.
   - Paid sales can be walk-in.
   - Partial/credit sales must be linked to a customer.
8. Use **Payment** on unpaid sales when customers repay partially or fully.

## Troubleshooting

### Vercel deploys, but pages error

Most likely the database tables were not created yet.

Run:

```bash
DATABASE_URL="your-neon-connection-string" npm run drizzle:push
```

### Login does not work

1. Make sure `npm run drizzle:push` was run after the latest deploy so the `admin_users` table exists.
2. Check Vercel environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PASSWORD_RESET_SECRET`
3. If no admin account exists yet, use `/admin/forgot-password` to create one.
4. If you prefer bootstrap login, set `ADMIN_USER` and `ADMIN_PASS`, redeploy, then sign in once.
5. After signing in, use `/admin/account` to change your password any time.

### I forgot my password

1. Open `/admin/forgot-password`
2. Enter your username, `PASSWORD_RESET_SECRET`, and a new password
3. Sign in again with the new password

### Inventory data is empty

Run:

```bash
DATABASE_URL="your-neon-connection-string" npm run seed
```

Or enter your real data manually through the app.
