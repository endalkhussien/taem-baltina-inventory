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
| `ADMIN_USER` | Your admin login username |
| `ADMIN_PASS` | Your admin login password |

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

What these commands do:

- `npm run drizzle:push` creates/updates the database tables.
- `npm run seed` adds starter products, raw materials, recipes, and sample customers.

Run `npm run seed` only once unless you intentionally want to re-check/update starter data.

## 4. Log in

Open your Vercel URL:

```text
https://your-project.vercel.app
```

The app redirects to the internal inventory dashboard/login.

Log in with the values you set:

- Username: `ADMIN_USER`
- Password: `ADMIN_PASS`

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

Check Vercel environment variables:

- `JWT_SECRET`
- `ADMIN_USER`
- `ADMIN_PASS`

Redeploy after changing environment variables.

### Inventory data is empty

Run:

```bash
DATABASE_URL="your-neon-connection-string" npm run seed
```

Or enter your real data manually through the app.
