# Backend curriculum — Taem Baltina (one week)

This is a one-week, project-first backend course. You will not build a toy Express API on the side. You will learn backend by reading, tracing, querying, and then changing **this** app.

Taem Baltina is an inventory and sales tracker for a spice business. The “backend” is not a separate server. It lives inside a Next.js 14 App Router app:

- HTTP handlers: `app/api/**/route.ts`
- Gatekeeping: `middleware.ts`
- Database model: `db/schema.ts`
- Domain logic: `lib/*.ts`
- Input rules: `lib/validators/*.ts`
- Postgres via Drizzle: `lib/db.ts`

By the end of the week you should be able to follow a request from cookie to SQL, explain why stock cannot go negative, and make a small, correct backend change without breaking money or inventory.

---

## How to use this

**Audience.** You already write some frontend. You are new to backend. You learn fastest when a concept is attached to a file you can open.

**Pace.** Seven days, **90–150 minutes each**. Do not skip labs to “finish the reading.” The labs *are* the course.

**Daily rhythm.**

1. **Read** the listed files in order (20–40 min).
2. **Trace** one real request with curl or the browser Network tab (20–30 min).
3. **Do** the lab (30–50 min).
4. **Write** 5–10 lines in a notebook answering that day’s “exit ticket.”

**Tools.** Node 18+, this repo, Postgres, `curl`, and `psql` (or any SQL client). Login is `ADMIN_USER` / `ADMIN_PASS` from `.env` (local default is `admin` / `password`).

**Start the stack each session.**

```bash
sudo pg_ctlcluster 16 main start   # this environment; locally: docker compose up -d
npm run dev                        # http://localhost:3000
```

**Rules that keep the week honest.**

- Every concept starts in this repo. External articles are optional and listed last.
- Prefer `curl` over clicking when you study APIs. You want to see status codes and JSON.
- Do not rewrite the architecture. Your job this week is to *understand and extend* it.
- When something fails, read the JSON `error` field and the server log. That is backend debugging.

**What “done” looks like on Friday.** You can:

1. Draw the request path for admin, partner, and public shop.
2. Explain `db.schema.ts` tables involved in “buy raw material → produce → sell on credit → collect payment.”
3. Name the HTTP status this app uses for bad JSON (400), bad shape (422), missing row (404), business conflict (409), and auth (401).
4. Explain why sales and production use `db.transaction`.
5. Change one small backend behavior and prove it with curl.

---

## Map of the classroom

Three products share one database:

| Surface | Who | Auth | API prefix | Example |
| --- | --- | --- | --- | --- |
| Admin ops | Internal staff | Cookie `taem_token` | `/api/...` (most routes) | Record a sale, produce a batch |
| Partner shop | Independent reseller | Cookie `taem_partner_token` | `/api/partner/...` | Buy stock from HQ, sell locally |
| Public shop | End customer | None | `/api/public/...` | Place a marketplace order |

**Request path (commit this to memory on Day 1):**

```text
Browser / curl
  → Next.js middleware.ts          (cookie? role? public?)
    → app/api/.../route.ts         (GET/POST/PATCH/DELETE)
      → parseJsonBody              (lib/apiErrors.ts)
        → Zod schema               (lib/validators/)
          → db.transaction / db    (lib/db.ts → Postgres)
            → NextResponse.json    (status + body)
```

**Folder cheat sheet.**

| Path | Role |
| --- | --- |
| `middleware.ts` | Auth gate for `/admin`, `/branch`, `/api` |
| `app/api/` | Route handlers (the HTTP layer) |
| `db/schema.ts` | Tables, columns, FKs, indexes |
| `docs/erd.md` | Picture of the same model |
| `lib/db.ts` | Drizzle client + `pg` pool |
| `lib/auth.ts` / `lib/partnerAuth.ts` / `lib/password.ts` | Sessions and hashes |
| `lib/validators/` | What a request body is allowed to be |
| `lib/sales.ts`, `lib/productionCost.ts`, `lib/credit.ts`, `lib/profit.ts` | Money and inventory math (no HTTP) |
| `scripts/seed.js` | Idempotent starter data |
| `DEPLOYMENT.md` | Neon + Vercel, env vars, pooling |

There are **no automated tests** in this repo today. That is a gap you will notice on Day 7, and a good place to practice.

---

## Day 1 — What a backend is in this app

**Goal.** Stop thinking “backend = another framework.” See HTTP handlers, status codes, and JSON as the product.

### Concepts

- A **route handler** is a function named after an HTTP verb (`GET`, `POST`, …) that receives a `Request` and returns a `Response`.
- **REST-ish** here means: collections at `/api/customers`, one row at `/api/customers/[id]`. Not every resource is a perfect REST noun (see `/api/production`).
- Status codes this codebase actually uses:
  - `200` / `201` success (create often returns `201`)
  - `400` malformed JSON (`parseJsonBody`)
  - `401` missing/invalid session (`middleware.ts`)
  - `404` row not found
  - `409` business rule failed (not enough stock, no recipe, …)
  - `422` body failed Zod
  - `500` unexpected / database (`databaseErrorResponse`)
  - `503` admin login when no users exist yet

### Read (in this order)

1. `middleware.ts` — what is public, what needs admin, what needs partner.
2. `lib/apiErrors.ts` — JSON parse + database error shape.
3. `app/api/customers/route.ts` — simplest useful collection: list + create.
4. `app/api/expenses/[id]/route.ts` — GET / PATCH / DELETE by id.
5. `lib/db.ts` and `lib/pgConnection.ts` — how the process talks to Postgres.

### Trace

Log in, then use cookies for later calls:

```bash
curl -i -c /tmp/taem-cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password"}'
```

You should see `Set-Cookie: taem_token=...` and `{ "ok": true, ... }`.

```bash
curl -i -b /tmp/taem-cookies.txt http://localhost:3000/api/customers
```

Then create one:

```bash
curl -i -b /tmp/taem-cookies.txt -X POST http://localhost:3000/api/customers \
  -H 'Content-Type: application/json' \
  -d '{"name":"Curriculum Lab","phone":"0911000000"}'
```

Now break it on purpose:

```bash
curl -i -b /tmp/taem-cookies.txt -X POST http://localhost:3000/api/customers \
  -H 'Content-Type: application/json' \
  -d 'not-json'

curl -i http://localhost:3000/api/customers
```

Write down the status codes. The last call has **no cookie**. That is middleware, not the route.

### Lab

On paper (or a note file outside git), fill this table for `POST /api/customers` and `GET /api/expenses/99999`:

| Step | File | What happens if it fails |
| --- | --- | --- |
| middleware | | |
| parse JSON | | |
| Zod | | |
| database | | |
| JSON response | | |

### Exit ticket

In your own words: *Where does backend work happen in a Next.js App Router app, and how is that different from a React page in `app/admin/`?*

### Optional reading

- MDN: [HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- Next.js: [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## Day 2 — Postgres, schema, and Drizzle

**Goal.** Treat the database as the source of truth. The UI is a client of tables.

### Concepts

- **Table / row / column** — one kind of thing, one instance, one field.
- **Primary key** — `serial('id')` here.
- **Foreign key** — `product_id` references `products.id`. `onDelete: 'cascade' | 'restrict' | 'set null'` is a business decision, not decoration.
- **Index** — speeds lookup (`idx_sales_customer_id`); unique indexes also enforce rules (`product_id + ingredient_id` on recipes).
- **`numeric` vs `integer`** — money and kg are decimals (`precision` / `scale`). Counts of batches are integers. Mixing these is a classic inventory bug.
- **ORM vs SQL** — Drizzle writes SQL for you from TypeScript. You still need to understand the SQL.
- **`drizzle:push` vs migration files** — this project treats `db/schema.ts` as source of truth and pushes the schema. `drizzle/` SQL files are reference.

### Read

1. `docs/erd.md` (the picture).
2. `db/schema.ts` all the way through — products, ingredients, recipes, purchases, sales, production, credit, market orders, partner shops.
3. `drizzle.config.ts` — how Drizzle finds the database.
4. `scripts/seed.js` (skim) — what “starter data” actually inserts.

### Trace (SQL)

```bash
psql postgresql://postgres:postgres@localhost:5432/taem_baltina_dev
```

Run:

```sql
\dt
\d products
\d product_ingredients
\d sales

SELECT id, name, selling_price, stock_quantity FROM products;
SELECT id, name, quantity, unit, cost_per_unit FROM ingredients;

SELECT p.name, i.name, pi.quantity_per_unit
FROM product_ingredients pi
JOIN products p ON p.id = pi.product_id
JOIN ingredients i ON i.id = pi.ingredient_id
ORDER BY p.name;
```

Then ask the database a business question:

```sql
SELECT c.name, COALESCE(SUM(s.balance), 0) AS outstanding
FROM customers c
LEFT JOIN sales s ON s.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY outstanding DESC;
```

Compare that to `GET /api/customers` in `app/api/customers/route.ts` (it also adds credit-ledger balances).

### Lab

Draw the **spice lifecycle** as a chain of tables (boxes + arrows):

`ingredients` ← `purchases`  
`ingredients` + `products` ← `product_ingredients` (recipe)  
`production_batches` consumes ingredients and increases `products.stock_quantity`  
`sales` decreases product stock  
`repayments` decrease `sales.balance`  
`credit_ledgers` / `credit_payments` are a parallel credit book  
`market_orders` are public shop orders waiting for ops  
`partner_stock` is a *separate* warehouse for a reseller

For each arrow, write the **foreign key column** and whether delete is cascade or restrict.

### Exit ticket

*Why does `sales.product_id` use `onDelete: 'restrict'` while `product_ingredients` uses `cascade`? What would break if those were swapped?*

### Optional reading

- Postgres tutorial: [Table basics](https://www.postgresql.org/docs/current/tutorial-table.html)
- Drizzle: [PostgreSQL schema](https://orm.drizzle.team/docs/sql-schema-declaration)

---

## Day 3 — Validation and CRUD patterns

**Goal.** Never trust the client. Learn the house style for a Taem route.

### Concepts

- **Validation** happens *before* SQL. Zod schemas in `lib/validators/` are the contract.
- `safeParse` → `success: false` → **422**, not 500.
- Path params (`[id]`) are strings. This app converts with `Number` and rejects non-integers as **400**.
- **List vs item routes**: `app/api/expenses/route.ts` (collection) vs `app/api/expenses/[id]/route.ts` (item).
- Coercion: `lib/validators/numeric.ts` accepts `"12.5"` or `12.5` because HTML forms and JSON clients are messy.
- Partial updates: `expensePatchSchema` + building `updateData` only for provided fields.

### Read

1. `lib/validators/numeric.ts`
2. `lib/validators/customer.ts`, `lib/validators/expense.ts`, `lib/validators/sale.ts`
3. `app/api/customers/route.ts` (POST) again — now focusing on Zod.
4. `app/api/expenses/route.ts` and `app/api/expenses/[id]/route.ts`
5. `app/api/products/[id]/route.ts` and `app/api/products/[id]/recipe/route.ts`

### Trace

Send bodies that should fail:

```bash
# missing required fields
curl -i -b /tmp/taem-cookies.txt -X POST http://localhost:3000/api/expenses \
  -H 'Content-Type: application/json' \
  -d '{}'

# invalid id
curl -i -b /tmp/taem-cookies.txt http://localhost:3000/api/expenses/abc

# patch a real id (use an id from GET /api/expenses)
curl -i -b /tmp/taem-cookies.txt -X PATCH http://localhost:3000/api/expenses/1 \
  -H 'Content-Type: application/json' \
  -d '{"amount":-5}'
```

Note whether the error body is `parsed.error.format()` (nested Zod) or a single `issues[0].message`. The app is **inconsistent** here. That is a real-world lesson: house style drifts; you should pick one when you add a route.

### Lab

Pick **one** existing POST route you did not read yesterday. Write its contract:

```text
POST /api/<thing>
Auth: admin cookie | partner cookie | public
Body fields:
  field     type     required?    extra rules
Success: status ____  body contains ____
Failures: 400 / 401 / 404 / 409 / 422 — when?
SQL: INSERT into ____, also UPDATE ____ ?
```

Then implement the same contract as **pseudocode only** (no commit required) for a fictional `POST /api/notes` with `{ title, body }` — using `parseJsonBody`, a Zod schema, `db.insert`, `201`. The point is to memorize the sequence, not to ship notes.

### Exit ticket

*What is the difference between 400, 422, and 409 in this codebase? Give one real example of each from a file you opened.*

### Optional reading

- Zod: [Basic usage](https://zod.dev/?id=basic-usage)
- [RFC 9110 — HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110) (skim status code sections only)

---

## Day 4 — Transactions and inventory invariants

**Goal.** This is the heart of the backend. A sale is not “insert a row.” It is “insert a sale **and** decrement stock, or do neither.”

### Concepts

- **Invariant**: a rule the database must still satisfy after every request (stock ≥ 0, amount_paid ≤ total, credit sales have a customer).
- **Transaction**: `db.transaction(async (tx) => { ... })`. If you `throw` or the process dies, Postgres rolls back.
- **Check-then-act race**: two sales can both read stock = 1. The code defends with  
  `UPDATE ... WHERE stock_quantity >= quantity RETURNING ...`  
  If no row returns → **409** “another sale may have used the remaining kg.”
- **Money**: `computeSaleTotals` rounds to cents. Never accumulate floats without rounding.
- **Weighted average cost**: a purchase does not replace `cost_per_unit`; it blends old and new (`lib/inventoryCost.ts`).

### Read (slowly)

1. `lib/sales.ts` — totals, paid, balance, status.
2. `app/api/sales/route.ts` — the full POST transaction.
3. `app/api/purchases/route.ts` — stock up + average cost.
4. `lib/productionCost.ts`
5. `app/api/production/route.ts` — recipe check, deduct ingredients, add product kg, store costs.
6. `lib/inventoryCost.ts`

### Trace

Use the UI or curl to:

1. `GET /api/products` and note `stock_quantity` for one product.
2. `POST /api/sales` with a quantity **larger than stock**. Expect **409**.
3. `POST /api/sales` with a walk-in (`customerId` 0) and `amountPaid` less than total. Expect **422** (walk-ins must pay in full).
4. Record a **valid** paid sale. Confirm stock dropped.

Then in `psql`:

```sql
SELECT id, sale_code, quantity, total_amount, amount_paid, balance, payment_status
FROM sales
ORDER BY id DESC
LIMIT 5;

SELECT id, name, stock_quantity FROM products;
```

For production, try producing a product **after** imagining a missing recipe: read the `recipe.length === 0` branch. Optionally `GET /api/products/:id/recipe`.

### Lab

Write a numbered sequence for **one production batch** as if you were Postgres:

1. Lock / read product.
2. Read recipe lines + ingredient quantities.
3. Reject if any ingredient short.
4. Compute material / labor / equipment / overhead / cost per kg.
5. `UPDATE ingredients SET quantity = quantity - required`.
6. `UPDATE products SET stock_quantity = stock_quantity + kg`.
7. `INSERT production_batches`.

Mark which steps must share a transaction. Then answer: *If step 5 succeeded and step 6 failed without a transaction, what lie would the dashboard tell?*

**Stretch (still Day 4 if you have time):** Read `app/api/public/orders/route.ts`. Public orders check stock but may not decrement it the same way as admin sales. Decide whether that is intentional (reservation vs fulfillment) and write your verdict. Disagreement with the code is allowed if you can justify it.

### Exit ticket

*Why is `WHERE stock_quantity >= quantity` safer than reading stock into JavaScript and then updating? When would that still not be enough?*

### Optional reading

- Postgres: [Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- “Lost update” / check-then-act (any short article on race conditions in web apps)

---

## Day 5 — Auth, cookies, and three audiences

**Goal.** Backend security here is cookies + middleware + a second check on partner routes. Understand *what* is protected and *what is not*.

### Concepts

- **Authentication** — who are you? (`authenticateAdmin`, `requirePartner`)
- **Authorization** — what may you touch? Admin sees all shops; a partner query is always `.where(eq(shop_id, session.shopId))`.
- **JWT** (`jose`) signed with `JWT_SECRET`, stored in **httpOnly** cookies (`taem_token`, `taem_partner_token`). JavaScript on the page cannot read them. That is deliberate.
- **Password storage** — `scrypt` + salt in `lib/password.ts`. `timingSafeEqual` avoids leaking hash comparison time. You never store `ADMIN_PASS` in the users table after bootstrap.
- **Bootstrap** — first login can create the admin from env (`bootstrapAdminFromEnv`) if the table is empty.
- **Public routes** — `/api/public/*` and `/api/partner/auth/*` skip admin middleware. Public does **not** mean “no validation.”
- Cookie flags: `httpOnly`, `sameSite: 'lax'`, `secure` in production.

### Read

1. `lib/password.ts`
2. `lib/auth.ts`
3. `lib/adminUsers.ts`
4. `app/api/auth/login/route.ts`, `logout`, `change-password`, `reset-password`
5. `lib/partnerAuth.ts`
6. `app/api/partner/auth/login/route.ts`, `register`, `app/api/partner/me/route.ts`
7. `middleware.ts` again — now you will actually see the branches.
8. `app/api/partner/purchases/route.ts` — `requirePartner` **and** filter by `shopId`.

### Trace

```bash
# no cookie — should 401
curl -i http://localhost:3000/api/products

# public catalog — should 200 without cookie
curl -i http://localhost:3000/api/public/products

# login as admin, then hit a partner API with the admin cookie — should 401
curl -i -b /tmp/taem-cookies.txt http://localhost:3000/api/partner/me
```

Register or log in as a partner (UI at `/branch/register` or `/branch/login`), save `taem_partner_token`, then:

```bash
curl -i -b /tmp/partner-cookies.txt http://localhost:3000/api/partner/me
curl -i -b /tmp/partner-cookies.txt http://localhost:3000/api/partner/stock
```

Open `lib/password.ts` and `app/api/auth/login/route.ts`. Confirm the password never appears in the JSON response.

### Lab

Write a **threat model of three sentences** for each audience:

1. Someone who stole an admin cookie.
2. A partner calling `/api/sales` (HQ sales) with their partner cookie.
3. A stranger posting to `/api/public/orders` with a huge `quantityKg`.

For (3), read the public order handler and say whether stock is actually reserved. If not, that is an authorization/integrity issue, not just a UX issue.

### Exit ticket

*Middleware returns 401 for `/api/*` without a cookie, except some prefixes. List those prefixes. Why must partner routes still call `requirePartner` inside the handler?*

### Optional reading

- OWASP: [Session Management cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) (skim)
- Node `crypto`: [scrypt](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback)

---

## Day 6 — Domain logic: credit, cost, and reports

**Goal.** Backend is also *business rules* that do not look like CRUD. This app’s value is spice math: recipes, COGS, credit, cash vs debt.

### Concepts

- **Keep HTTP handlers thin** when possible: `computeSaleTotals`, `computeBatchMaterialCost`, `weightedAverageCost` are testable functions with no `Request`.
- **Derived data**: customer `total_credit` is not a column. `GET /api/customers` aggregates `sales.balance` and `credit_ledgers.balance`.
- **Two credit systems** exist: sale-level credit (`sales.balance` + `repayments`) and the credit ledger (`credit_ledgers` + `credit_payments` + line items). You must know which screen talks to which.
- **COGS**: production batches store `total_cost` / `cost_per_unit`; `estimateSalesCogs` uses average cost per product.
- **Finance identity** (from README): net position ≈ cash on hand + customer credit − liabilities.
- **Aggregation in SQL** (`sum`, `groupBy`) vs aggregation in JS (`lib/dashboardMetrics.ts`, `lib/monthly-financials.ts`). Both appear. SQL is better for large tables; JS is fine when the handler already loaded the rows.

### Read

1. `lib/credit.ts`
2. `app/api/credit-ledgers/route.ts` and `app/api/credit-payments/route.ts`
3. `app/api/repayments/route.ts`
4. `lib/profit.ts`, `lib/productionCost.ts` (again), `lib/stock.ts`, `lib/stockValue.ts`
5. `lib/dashboardMetrics.ts` — charts and “top products” are backend-ish even if called from a page
6. `lib/monthly-financials.ts` — Ethiopian calendar periods
7. `app/api/cash-entries/route.ts`, `app/api/liabilities/route.ts`, `app/api/liability-payments/route.ts`

### Trace

1. Create a credit sale (customer + partial `amountPaid`).
2. `POST /api/repayments` for that sale. Watch `balance` and `payment_status` change in `GET /api/sales`.
3. Open `/admin/finance` and `/admin/dashboard`. For each number you care about, hunt the function that produced it.

In `psql`, rebuild dashboard-ish numbers yourself:

```sql
SELECT SUM(total_amount) AS revenue, SUM(amount_paid) AS collected, SUM(balance) AS outstanding
FROM sales;
```

### Lab (workbook, not a feature)

Take **one seeded product**. On paper compute:

1. Recipe material cost for 1 batch (`quantity_per_unit × cost_per_unit`, summed).
2. Add fictional labor/equipment.
3. Cost per kg.
4. Selling price minus cost per kg = profit per kg (`lib/profit.ts`).
5. After a 2 kg paid sale: revenue, COGS, remaining stock.

Then compare to a real `production_batches` row if you record a batch in the UI.

### Exit ticket

*If you stored `customers.outstanding_balance` as a cached column, what would you have to update on every sale, repayment, and credit payment? Why does this app compute it on read instead?*

### Optional reading

- “Derived vs stored aggregates” (any short accounting/CS note)
- Postgres: [Aggregate functions](https://www.postgresql.org/docs/current/tutorial-agg.html)

---

## Day 7 — Production, gaps, and a small real change

**Goal.** See how this backend is deployed, what is fragile, and prove you can change it safely.

### Concepts

- **Env vars** are part of the backend: `DATABASE_URL`, `JWT_SECRET`, `PASSWORD_RESET_SECRET`, `ADMIN_USER` / `ADMIN_PASS`, `PG_POOL_MAX`.
- **Connection pooling**: `createPgPoolOptions` caps pool size (default `3`) because serverless/Vercel + Neon cannot open dozens of connections per instance.
- **SSL**: Neon URLs get `ssl: { rejectUnauthorized: false }`. Local does not.
- **Build vs runtime**: `resolveDatabaseUrl` allows a dummy URL during `next build` so CI can compile without Postgres.
- **Idempotent seed vs destructive reset**: `npm run seed` vs `npm run reset` / `POST /api/admin/reset`.
- **Observability** today is `console.error` inside `databaseErrorResponse`. There is no test suite.

### Read

1. `DEPLOYMENT.md`
2. `lib/pgConnection.ts` (again)
3. `scripts/reset.js` (skim — know that it wipes data)
4. `app/api/admin/reset/route.ts`
5. `.env.example`

### Trace

```bash
npm run typecheck
npm run lint
```

Hit a route that will 500 if you like (optional): stop Postgres and `GET /api/products` with a cookie. Read the JSON `hint`. Start Postgres again.

### Lab — pick **one** capstone (90 minutes max)

Do **one**. Ship it on a branch if it is code; otherwise keep it in your notes.

**Option A — Tests for pure domain functions (recommended).**  
Add a tiny test runner if you want (`node:test` is enough) or a few assertions in a `lib/*.test.ts` using whatever the repo will accept. Cover:

- `computeSaleTotals` — paid, partial, credit, overpay
- `computeBatchMaterialCost` / `computeCostPerKg`
- `weightedAverageCost` for empty stock vs restock

This teaches the most important backend habit: **logic that can run without HTTP**.

**Option B — Align one error-response style.**  
Pick a route that returns `parsed.error.format()` and change it to the same `{ error: firstIssue.message }` pattern as sales, with status 422. Do not drive-by refactor every file.

**Option C — Read-only API improvement.**  
Add a documented query param to an existing GET (for example sales filtered by `customerId` or a date key), using Zod for the query string. Follow join style from `app/api/sales/route.ts`. Prove with curl.

**Option D — Written design (if you cannot change prod code today).**  
Write a one-page design: “Should public checkout decrement stock?” Include current behavior, race conditions, and a proposed transaction. No code.

### Exit ticket (week retrospective)

Answer all five:

1. What file would you open first to add a new admin API?
2. What must go in the same transaction as inserting a sale?
3. How does a partner get isolated from another shop’s stock?
4. Name one backend risk you still would not trust yourself to change (indexes, migrations, money rounding, …).
5. What will you practice next week?

---

## After this week

Stay inside this repo. Suggested follow-ups, one at a time:

1. Add tests around `lib/sales.ts` and `lib/productionCost.ts` if you chose a different capstone.
2. Read `app/api/wholesale-orders/` and compare to `sales` + `market_orders`.
3. Sketch (do not implement) moving transactions into `lib/` services so route files only do HTTP.
4. Learn `EXPLAIN ANALYZE` on the customers outstanding-balance query.
5. Read `DEPLOYMENT.md` and explain why `PG_POOL_MAX` defaults to 3.

Do **not** start a second backend stack until you can modify a transaction in this one without guessing.

---

## Glossary (as used here)

| Term | Meaning in Taem Baltina |
| --- | --- |
| Route handler | `export async function POST` in `app/api/.../route.ts` |
| Middleware | `middleware.ts`; runs before matching routes |
| Session | JWT payload in an httpOnly cookie |
| Schema | TypeScript table defs in `db/schema.ts` |
| Push | `npm run drizzle:push` — apply schema to Postgres |
| Transaction | All-or-nothing unit of SQL |
| Invariant | Rule like “never sell more kg than stock” |
| 409 Conflict | Valid JSON, but the business refuses |
| 422 Unprocessable | JSON parsed, Zod failed |
| COGS | Cost of goods sold, from production batch costs |
| Partner | Reseller shop with its own stock table |
| Bootstrap admin | First user created from `ADMIN_USER` / `ADMIN_PASS` |
| Pool | Reused Postgres connections (`pg.Pool`) |

---

## File index (week map)

| Day | Primary files |
| --- | --- |
| 1 | `middleware.ts`, `lib/apiErrors.ts`, `app/api/customers/route.ts`, `app/api/expenses/[id]/route.ts`, `lib/db.ts` |
| 2 | `docs/erd.md`, `db/schema.ts`, `drizzle.config.ts`, `scripts/seed.js` |
| 3 | `lib/validators/*`, expenses + products routes |
| 4 | `app/api/sales/route.ts`, `app/api/production/route.ts`, `app/api/purchases/route.ts`, `lib/sales.ts`, `lib/productionCost.ts`, `lib/inventoryCost.ts` |
| 5 | `lib/auth.ts`, `lib/password.ts`, `lib/adminUsers.ts`, `lib/partnerAuth.ts`, `app/api/auth/*`, `app/api/partner/**` |
| 6 | `lib/credit.ts`, credit + repayment routes, `lib/profit.ts`, `lib/dashboardMetrics.ts`, finance routes |
| 7 | `DEPLOYMENT.md`, `lib/pgConnection.ts`, `app/api/admin/reset/route.ts`, your capstone |

---

## End-of-week self-check

Score yourself 0 (cannot) / 1 (with notes) / 2 (from memory):

- [ ] Explain the request path including middleware.
- [ ] Point at the tables for recipe, production, sale, and partner stock.
- [ ] Choose 401 vs 404 vs 409 vs 422 for a scenario I describe.
- [ ] Explain why production and sales use transactions.
- [ ] Hash vs JWT vs cookie: what each is for.
- [ ] Find where average ingredient cost is updated.
- [ ] Use curl with a cookie file against at least three endpoints.
- [ ] Use `psql` to inspect stock after a sale.
- [ ] Name every required env var in `DEPLOYMENT.md`.
- [ ] Make (or specify) one backend change that does not break invariants.

**12+ is a pass.** Below that, repeat the matching day rather than rushing Day 7.
