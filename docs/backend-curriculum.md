# Node.js backend concepts — one-week course

A seven-day course on the ideas every JavaScript backend framework shares: **HTTP, routes, middleware, validation, sessions, and auth**. You will learn them in a small Express lab (the common dialect), then **transfer** each idea into Taem Baltina so the current project becomes practice, not the textbook.

Express, Fastify, Koa, Nest, and Next.js Route Handlers look different on disk. They all do the same job: take an HTTP request, run a pipeline, return a response.

```text
Request  →  middleware pipeline  →  route handler  →  Response
              (log, parse, auth…)     (your logic)
```

**By Friday** you should be able to explain that pipeline in your own words, implement a toy version of it, and point to where Taem Baltina does the same thing with different syntax.

---

## How to use this week

**Time.** 90–150 minutes a day. Labs are the course; skimming the prose is not.

**Daily rhythm.**

1. **Concept** (read this file for that day).
2. **Lab** in `docs/backend-lab` on port **3001** (type, run, break, fix).
3. **Transfer** — 15–25 minutes in Taem Baltina (port **3000**) applying the same idea.
4. **Exit ticket** — five to ten lines in a notebook.

**Setup (once).**

```bash
cd docs/backend-lab
npm install
```

Keep the real app available for transfer work:

```bash
# repo root, separate terminal
sudo pg_ctlcluster 16 main start    # this environment; locally: docker compose up -d
npm run dev                         # http://localhost:3000
```

Admin login for the real app is `ADMIN_USER` / `ADMIN_PASS` (local default `admin` / `password`).

**Rules.**

- Type the first version of each lab by hand at least once. Muscle memory matters.
- When a lab works, **change it**. Add a route, fail a request, log a header. Reading green output is not practice.
- Do not try to learn Next.js, Drizzle, and Postgres as the primary subject this week. They are the place you *apply* Node backend ideas.
- Framework docs at the bottom of each day are optional. Finish the lab first.

**Scratch cookie jar** (reuse all week):

```bash
# lab (port 3001)
curl -i -c /tmp/lab-cookies.txt -b /tmp/lab-cookies.txt http://localhost:3001/health

# app (port 3000) — after Day 5
curl -i -c /tmp/taem-cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password"}'
```

---

## The shared mental model

Every Node backend framework gives you four objects and a pipeline.

| Piece | What it is | Express | Next.js App Router (this repo) |
| --- | --- | --- | --- |
| Incoming HTTP | Method, URL, headers, body | `req` | `Request` (Fetch API) |
| Outgoing HTTP | Status, headers, body | `res.status().json()` | `NextResponse.json()` |
| Route | “If method + path match, run this function” | `app.get('/x', fn)` | `app/api/x/route.ts` → `export function GET` |
| Middleware | Code that runs *around* many routes | `app.use(fn)` | `middleware.ts` plus helpers inside handlers |
| Params | `/spices/:id` | `req.params.id` | folder `[id]` → `params.id` |
| Query | `?kg=2` | `req.query.kg` | `new URL(request.url).searchParams` |
| Body | JSON payload | `req.body` after `express.json()` | `await request.json()` |

You are not learning “how Express is different from Next.” You are learning **this table**. After that, any Node framework is a new column.

---

## Day 1 — Node, HTTP, and a process that listens

**Goal.** See a backend as a long-running Node process that reads bytes from a socket and writes bytes back. Frameworks only organize that.

### Concept

**Node.js** is a JavaScript runtime (V8 + libuv). It is not a backend framework. Express/Fastify/Next *run on* Node (or, for some Next middleware, on the Edge runtime — you will meet that distinction on Day 3).

An HTTP **request** is:

- a **method** (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) — the verb
- a **path** (`/health`, `/api/sales`) — the noun
- **headers** (metadata: `Content-Type`, `Cookie`, `Authorization`)
- an optional **body** (usually JSON for APIs)

An HTTP **response** is a **status code**, headers, and a body.

Status codes you must know this week:

| Code | Meaning | Typical cause |
| --- | --- | --- |
| 200 | OK | Successful read or update |
| 201 | Created | Successful insert |
| 400 | Bad request | Body is not JSON, malformed |
| 401 | Unauthorized | Not logged in / bad credentials |
| 403 | Forbidden | Logged in, not allowed |
| 404 | Not found | No such route *or* no such row |
| 409 | Conflict | Valid request, business rule refuses |
| 422 | Unprocessable | JSON parsed, fields invalid |
| 500 | Server error | Unhandled exception |

**JSON APIs** set `Content-Type: application/json` and send objects. The browser, curl, and your admin UI are all just HTTP clients.

**Async.** Node handles many connections by not blocking the thread. `await db.query(...)` pauses *that function*, not the whole server. You do not need the event loop internals this week; you do need to `await` every I/O.

### Lab (port 3001)

Open `docs/backend-lab/01-http.js`. Type a mental picture: `app` is the server, `app.get` is one route, `app.listen` opens a port.

```bash
npm run day1
curl -i http://localhost:3001/health
```

Then change the program:

1. Add `GET /time` that returns `{ now: new Date().toISOString() }`.
2. Add `POST /echo` with `app.use(express.json())` and respond with the body you received. If the client sends invalid JSON, observe Express’s default error (often 400).
3. Return `res.status(201).json(...)` from POST. Confirm curl prints `201`.
4. Stop the process (`Ctrl+C`). Curl should fail with “connection refused.” A backend is just a process holding a port.

### Transfer (15 min)

You will not read the whole app. Answer two questions in your notes:

1. Taem Baltina does not have `app.listen`. Who listens? (Next.js, via `npm run dev` / `next start`.)
2. Open **one** file: `app/api/customers/route.ts`. Find the function that is the moral equivalent of `app.get` and `app.post`. What does it return instead of `res.json()`?

### Exit ticket

*What is the difference between Node.js and Express? What does a client actually send on the wire when it “calls an API”?*

### Optional

- MDN: [HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)
- Node: [What is Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)

---

## Day 2 — Routes: mapping URLs to functions

**Goal.** Design and implement routes the way every Node framework does: method + path → handler.

### Concept

A **route** is a declaration: “when a request matches this method and path pattern, run this function.”

**REST** (as used in real APIs, not the dissertation) treats paths as **resources** and methods as **actions**:

| Method | Usually means | Example |
| --- | --- | --- |
| GET | Read, no side effects | `GET /spices`, `GET /spices/3` |
| POST | Create | `POST /spices` |
| PATCH | Partial update | `PATCH /spices/3` |
| PUT | Replace | less common in this style |
| DELETE | Remove | `DELETE /spices/3` |

**Path parameters** (`/spices/:id`) are part of the path. **Query strings** (`/spices?category=hot`) are filters. **Bodies** carry data that does not belong in the URL (passwords, large JSON).

**404 has two meanings.** No route matched, or the route ran and the row does not exist. Clients cannot always tell. Your error JSON should.

**Routers.** Express (and Nest, Fastify plugins) let you mount a group: `app.use('/api', apiRouter)`. Next.js does the same with folders: `app/api/sales/route.ts`. File-based routing is still routing.

**Idempotency (light).** `GET` should not create records. `POST /sales` creating a sale twice if the user double-clicks is a real backend bug. You do not need a full idempotency-key design this week; you do need to notice side effects.

### Lab

Run `npm run day2`. Then, in `02-routes.js`:

1. `GET /spices?minKg=5` — filter with `req.query`. Query values are **strings**.
2. `POST /spices` — `{ name, kg }` → push onto the array, return **201** and the new object.
3. `PATCH /spices/:id` — update `kg` only; **404** if missing.
4. `DELETE /spices/:id` — **404** if missing; **200** `{ ok: true }` if deleted.
5. Add a nested resource: `GET /spices/:id/label` that returns `{ name, label: name.toUpperCase() }`. Nested routes are still just strings.

Prove with curl:

```bash
curl -s http://localhost:3001/spices
curl -s http://localhost:3001/spices/2
curl -s -X POST http://localhost:3001/spices -H 'Content-Type: application/json' -d '{"name":"Korerima","kg":1}'
curl -s http://localhost:3001/spices/99
```

Restart the server and `GET /spices` again. Your POST is gone. **Memory is not a database.** Day 4 will make that discomfort useful.

### Transfer

Compare **syntax only** (do not study business rules yet):

- Collection + create: `app/api/customers/route.ts` (`GET` + `POST`)
- Item by id: `app/api/expenses/[id]/route.ts` (`GET`, `PATCH`, `DELETE`)
- Nested resource: `app/api/products/[id]/recipe/route.ts`

In notes: rewrite one of those as three Express lines (`app.get`, `app.post`, `app.patch`). If you can, you understand routes.

### Exit ticket

*Why is `GET /spices?id=2` a worse design than `GET /spices/2` for fetching one item? When is a query string the right tool?*

### Optional

- MDN: [HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
- Express: [Routing](https://expressjs.com/en/guide/routing.html)

---

## Day 3 — Middleware: the pipeline around routes

**Goal.** See middleware as “functions that run before (and sometimes after) the handler,” not as a Next.js-only file.

### Concept

**Middleware** is a function that receives the request, may mutate it, may send a response, or may pass control along.

Express signature:

```js
function middleware(req, res, next) {
  // 1. do work
  // 2. either next()  → continue pipeline
  // 3. or res.status(...).json(...) and do not call next()  → stop
}
```

This is the same idea as:

- Koa: `async (ctx, next) => { await next() }`
- Fastify: `onRequest` / `preHandler` hooks
- Nest: middleware, guards, interceptors (same pipeline, more classes)
- Next.js: `middleware.ts` (runs on the **Edge** runtime, before Node route handlers)

**Order is behavior.** `app.use(log)` then `app.use(auth)` then `app.get('/secret', ...)` means every request is logged, then auth runs, then the route. If auth sends 401, the route never runs.

**Built-in middleware you already used:** `express.json()` is middleware that reads the body and sets `req.body`. Without it, POST JSON is just a stream of bytes.

**Error middleware** in Express has four arguments `(err, req, res, next)`. `next(err)` jumps there. Uncaught `throw` inside async handlers does **not** always reach it unless you wrap them — a classic Express footgun. Fastify and Next are stricter about catching.

**Two layers in production apps:**

1. **Global** — CORS, logging, JSON parse, cookie parse, auth gate for `/api/*`.
2. **Per-route** — “only admins,” “only the shop that owns this id.”

Next.js `middleware.ts` is layer 1 (and it cannot use the Postgres pool — Edge vs Node). Per-route checks stay inside `route.ts` (layer 2). That split is a **middleware concept**, not a Next quirk.

### Lab

Run `npm run day3`. In `03-middleware.js`:

1. Keep `requestLog`. Confirm every curl prints a line.
2. Write `requireApiKey(req, res, next)` that checks `req.header('x-api-key') === 'lab'`. If missing, `401` and **do not** call `next()`.
3. Apply it only to `/secret`: `app.get('/secret', requireApiKey, handler)`. `/open` must still work without the header.
4. Mount it on a prefix: `app.use('/admin', requireApiKey)` and add `GET /admin/stats`. Everything under `/admin` is now gated — that is how people protect `/api`.
5. **Order experiment:** register `requireApiKey` globally *before* `/open`. Watch `/open` break. Then move it. Middleware order is a debug skill.
6. Throw `throw new Error('boom')` in a route. What status do you get? Add a four-argument error handler that returns `{ error: err.message }` with 500.

```bash
curl -i http://localhost:3001/open
curl -i http://localhost:3001/secret
curl -i http://localhost:3001/secret -H 'x-api-key: lab'
```

### Transfer

Open **only** `middleware.ts` in the real app. Do not read every API file.

Map it onto today’s vocabulary:

- What is the “matcher” (which paths enter this pipeline)?
- Where does it **call next** (allow through) vs **send a response** (redirect or 401)?
- Which prefixes are public (skip the auth gate)?
- Why would a partner route still check the cookie *again* inside the handler? (Layer 1 vs layer 2.)

### Exit ticket

*If logging middleware runs after a handler that already sent 401, what do you lose? Why must `next()` be called at most once?*

### Optional

- Express: [Using middleware](https://expressjs.com/en/guide/using-middleware.html)
- Next.js: [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) — read *after* the lab, looking for Edge limitations

---

## Day 4 — Bodies, validation, errors, and state

**Goal.** Treat input as hostile. Separate “HTTP shape is wrong” from “business rule refused.” See why handlers talk to a database instead of an array.

### Concept

**Parsing ≠ validating.** `express.json()` / `request.json()` only turn bytes into an object. `{ kg: -3 }` is valid JSON and an invalid sale.

**Validation libraries** (Zod, Valibot, Joi, Yup, Fastify JSON Schema) answer: “does this value match the contract?” Common Node pattern:

```text
parse body → 400 if not JSON
schema.safeParse(body) → 422 if fields wrong
handler logic → 404 / 409 if the world disagrees
try/catch → 500 for unexpected failures
```

**Keep that mapping stable.** Mixing them (Zod failure as 500, missing row as 400) makes clients impossible to write.

**Layering** (names vary; the split matters):

```text
Route handler    HTTP: status codes, cookies, JSON
Service / domain Money, stock, “can this sale happen?”
Data access      SQL / ORM
```

Fat handlers (all three in one function) are how apps start. Pulling **pure functions** (`computeTotals(kg, price, paid)`) out of handlers is how they stay testable. You do not need a full “service layer” this week; you do need to notice when math does not belong in HTTP.

**State.** Yesterday’s POST vanished on restart because it lived in RAM. A **database** is a separate process that keeps data. Node talks to it over a TCP connection, usually through a **pool** (a few reused connections, not one per request).

**ORM / query builder** (Drizzle, Prisma, Kysely, Knex) writes SQL for you. You still own **transactions**: several writes that must all succeed or all fail (`BEGIN` … `COMMIT` / `ROLLBACK`). Classic example: insert a sale and decrement stock. If only one happens, the books lie.

**409 vs 422.** 422 = the payload is nonsense (`kg: -1`). 409 = the payload is fine but stock is 0. Frameworks will not choose this for you.

### Lab

Run `npm run day4`. In `04-validation.js`:

1. Reject `kg` as a string that is not numeric, zero, or negative — all **422**.
2. Add `productId` required positive integer. Unknown `productId` (pretend only `1` and `2` exist) → **404**.
3. Give each product a `stock` in memory. If `kg > stock` → **409**. If OK, decrement stock **and** push the sale in the same function. You are simulating a transaction.
4. Add a second request that decrements stock without checking. Then fix it so both writes happen only if both succeed (for an array this is just “check, then write”; say out loud what would go wrong with two concurrent requests).
5. Optional: copy the idea of a schema — a `function validateSale(body)` that returns `{ ok: true, data }` or `{ ok: false, error }`. That function is Zod’s job in real apps.

```bash
curl -i -X POST http://localhost:3001/sales -H 'Content-Type: application/json' -d '{"kg":-1}'
curl -i -X POST http://localhost:3001/sales -H 'Content-Type: application/json' -d '{"kg":2}'
```

### Transfer

Pick **one** create endpoint in the app and label each step with today’s words (parse / validate / 404 / 409 / write):

- Simpler: `app/api/customers/route.ts`
- Richer: `app/api/sales/route.ts` (transaction + stock)

Also glance at `lib/validators/` — those modules are Day 4, independent of Next. And `lib/sales.ts` is domain math with no `Request` object. That is the layering idea.

### Exit ticket

*Write the status code you would return for: invalid JSON; `quantity: -1`; product id 99999; quantity larger than stock; database connection down.*

### Optional

- Zod: [Basic usage](https://zod.dev/?id=basic-usage)
- Postgres: [Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) (concept; SQL syntax is enough)

---

## Day 5 — Auth: identity, passwords, sessions, tokens

**Goal.** Separate **authentication** (who are you?) from **authorization** (what may you do?). Implement both a **server session** and a **signed token**, and know when each is used.

### Concept

**Authentication** proves identity. **Authorization** uses that identity to allow or deny (admin vs partner shop vs public).

**Never store passwords.** Store a **hash** with a **salt** (`scrypt`, `argon2`, `bcrypt`). Use a **constant-time compare** so attackers cannot time the check. The lab still uses a plaintext password so you can see the *session* clearly; the real app must not.

Three common ways to remember a login:

| Style | What the browser stores | What the server stores | Strength | Typical use |
| --- | --- | --- | --- | --- |
| Server session | Opaque cookie (`abc123`) | Map `abc123` → `{ userId }` in memory/Redis/DB | Revocable instantly (delete the map entry) | Traditional apps |
| Signed JWT / similar | Cookie or `Authorization: Bearer` with claims + signature | Secret (or public key) only | No lookup; hard to revoke before expiry | APIs, horizontally scaled apps |
| API key | Header | Key (hashed) in DB | Simple machines | Webhooks, scripts |

**Cookies vs `Authorization` header.** Browsers automatically send cookies to the same site. JavaScript SPAs often send `Bearer` tokens. **httpOnly** cookies cannot be read by `document.cookie` (helps against XSS stealing sessions). **`SameSite=Lax`** reduces CSRF. **`Secure`** means HTTPS-only (production).

A **JWT** is not magic. It is `base64(payload) + signature`. Anyone can *decode* the payload; the signature proves it was not forged. Do not put passwords in a JWT. Set an **expiry**.

**Session cookie flow:**

```text
POST /login (credentials)
  → verify password hash
  → create session id
  → Set-Cookie: session=…; HttpOnly
GET /me
  → Cookie: session=…
  → lookup session → user
```

**Token flow:**

```text
POST /login
  → verify password
  → sign { userId, exp } with secret
  → Set-Cookie or return token in JSON
GET /me
  → verify signature + exp → user (no database lookup required)
```

Taem Baltina uses the token-in-httpOnly-cookie style (JWT via `jose`), which is a **hybrid**: JWT properties, cookie transport. Partner and admin are different cookies so two roles cannot be confused.

**Logout.** Session style: delete server record + clear cookie. JWT style: clear cookie (and/or a denylist). You cannot “delete” a JWT the client still holds until it expires, unless you track revocation.

### Lab

Run `npm run day5`. `05-auth.js` already has both styles. Your job is to **use and then break** them.

```bash
# session
curl -i -c /tmp/lab-cookies.txt -X POST http://localhost:3001/login-session \
  -H 'Content-Type: application/json' -d '{"username":"admin","password":"password"}'
curl -i -b /tmp/lab-cookies.txt http://localhost:3001/me-session

# token
curl -i -c /tmp/lab-token.txt -X POST http://localhost:3001/login-token \
  -H 'Content-Type: application/json' -d '{"username":"admin","password":"wrong"}'
curl -i -c /tmp/lab-token.txt -X POST http://localhost:3001/login-token \
  -H 'Content-Type: application/json' -d '{"username":"admin","password":"password"}'
curl -i -b /tmp/lab-token.txt http://localhost:3001/me-token
```

Then:

1. Add `POST /logout-session` that `sessions.delete(...)` and `res.clearCookie('lab_session')`. Confirm `/me-session` is 401.
2. Restart the server. Session logins die (memory map is empty). Token logins still verify **if** you kept the cookie — that is the JWT tradeoff.
3. Tamper with the token cookie (change one character in the payload part). You should get 401 Bad signature.
4. Add `requireSession` middleware and mount it on `GET /me-session` instead of inline code. Auth *is* middleware.
5. Optional: add `role: 'admin'` into the signed payload and a `GET /admin-only` that returns 403 if role !== admin. That is authorization.

### Transfer

Read these as **illustrations of Day 5**, not as a feature tour:

1. `lib/password.ts` — salt, scrypt, `timingSafeEqual` (what the lab skipped).
2. `lib/auth.ts` — sign/verify JWT, cookie name.
3. `app/api/auth/login/route.ts` — Set-Cookie flags (`httpOnly`, `sameSite`, `secure` in production).
4. `lib/partnerAuth.ts` — second cookie, `typ: 'partner'` claim so an admin token cannot pretend to be a shop.

Curl the real app: login, `GET /api/customers` with cookie, then without. That is the same experiment as `/me-session`.

### Exit ticket

*A JWT is stored in an httpOnly cookie. Is that “sessions” or “tokens”? What can you revoke immediately, and what must wait for expiry?*

### Optional

- OWASP: [Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) (skim cookie flags)
- MDN: [Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- `jose` / JWT intro of your choice — after you understand HMAC in the lab

---

## Day 6 — Authorization, tenancy, and the rest of the stack

**Goal.** Finish the picture: once you know *who*, you still must scope *what*. Plus the boring production pieces every Node API needs.

### Concept

**Authorization patterns** you will see everywhere:

- **Role** — `admin` vs `user`. Coarse.
- **Ownership** — `WHERE shop_id = session.shopId`. A partner must not `GET` another shop’s rows even with a valid cookie.
- **Public vs authenticated vs privileged** — three stacks of middleware, not one boolean.

If you only check “is logged in” and then `SELECT * FROM sales`, you have authentication without authorization. That is a data leak.

**CORS.** Browsers block a web page on origin A from reading responses from origin B unless the server sends `Access-Control-Allow-Origin`. Same-site Next.js (UI + `/api` on one origin) often needs little CORS. A separate frontend on Vite talking to Express on 3001 **does**. `Access-Control-Allow-Credentials: true` is required if cookies should cross origins, and then `*` is not allowed as the origin.

**Env vars.** Secrets (`JWT_SECRET`, database URLs) do not belong in source control. `process.env` is how Node frameworks configure prod vs local. Never log secrets.

**Connection pooling.** Serverless (Vercel) plus hosted Postgres (Neon) will run out of connections if each invocation opens a pool of 20. Tiny pools are a backend concern, not a cloud mystery.

**Idempotency and concurrency (light).** Two `POST /sales` at the same time can both read stock = 1. The fix is in the data layer (`UPDATE ... WHERE stock >= kg`), not in middleware. You already simulated this on Day 4; name it **lost update**.

**Defense in depth.** Middleware rejects missing cookies. The handler still checks `shopId`. The query still filters by `shopId`. One forgotten layer should not dump the table.

### Lab (no new starter file — extend Day 5)

Add to `05-auth.js` (or a copy `06-tenancy.js` if you prefer a clean file):

1. In-memory `orders = [{ id: 1, shopId: 1, total: 10 }, { id: 2, shopId: 2, total: 99 }]`.
2. Login that puts `{ username, shopId: 1 }` in the session or token.
3. `GET /orders` returns **only** that shop’s orders (filter in the handler).
4. `GET /orders/:id` returns 404 (not 403) if the order exists but belongs to another shop — a common choice so you do not leak ids. Then try 403 instead and notice the difference.
5. Add `GET /cors-demo` with `res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')`. Optional: open the browser console on the real app and `fetch('http://localhost:3001/cors-demo')` — read the error if CORS is missing, then with the header.

If time remains, add `process.env.LAB_API_KEY` instead of the hardcoded `'lab'` from Day 3.

### Transfer

Answer in notes, with file names:

1. Where does the app enforce **admin vs anonymous** (global middleware)?
2. Where does it enforce **partner vs admin** (different cookie / `typ` claim)?
3. Where does it enforce **this shop’s data only** (query `shop_id`)? Start at `app/api/partner/purchases/route.ts` or `lib/partnerAuth.ts`.
4. Where do env secrets live conceptually? (`DEPLOYMENT.md` env table is enough; do not commit `.env`.)

### Exit ticket

*A logged-in partner calls `GET /api/sales` (HQ sales). Should that be 401, 403, or 200 with filtered rows? What does this app actually do, and which concept is that?*

### Optional

- MDN: [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- OWASP: [Broken Access Control](https://owasp.org/www-community/Broken_Access_Control)

---

## Day 7 — Fluency check and apply it in the real app

**Goal.** Prove the concepts are in your head, then do **one** small piece of work on Taem Baltina using this week’s vocabulary.

### Concept review (30–40 min, no laptop if possible)

Explain each aloud. If you stall, re-run that day’s lab.

1. Node vs framework vs HTTP.
2. Route = method + path → function. Params vs query vs body.
3. Middleware = pipeline; order matters; `next()` vs send-and-stop.
4. 400 / 401 / 403 / 404 / 409 / 422 / 500.
5. Session cookie vs signed JWT vs JWT-in-cookie.
6. Authn vs authz vs tenancy (`shop_id`).
7. Why decrementing stock and inserting a sale share a transaction.

### Lab — whiteboard the real request

Pick **one** real request (suggestion: `POST /api/auth/login` or `POST /api/sales`). Draw:

```text
client → middleware → parse → validate → authz → domain → db → json
```

Fill each box with a **file or function name**. This is the transfer of the whole week. Keep the drawing; it is your cheat sheet when you next change the app.

### Apply (pick one capstone, 60–90 min)

Work on a branch. Keep the change small. Use the words from this course in the commit message.

**A. Tests for domain functions (best default).**  
`lib/sales.ts` and similar have no HTTP. Add tests (`node:test` is enough) for totals / paid / credit. You are testing Day 4 layering.

**B. One handler, one status-code cleanup.**  
Find a route that returns Zod’s full `error.format()` and make it return `{ error: message }` with **422**, matching sales. You are practicing a stable error contract.

**C. New GET with query validation.**  
e.g. filter a list by query param, validated like a body schema. You are practicing Day 2 + Day 4.

**D. Lab replay in notes only.**  
If you cannot change the app today: rewrite `POST /api/sales` as a tiny Express app in `docs/backend-lab` (in-memory stock). Same statuses. Then list what the real handler does that yours does not (SQL, transactions, rounding).

### Exit ticket (week)

1. Draw the shared pipeline from memory.
2. Name one Express API and its Next.js equivalent for: route param, JSON body, middleware gate, Set-Cookie.
3. What will you still look up next time (pooling, CSRF, JWT alg, Drizzle)? Looking it up is fine; not knowing the *category* is not.

---

## After this week

Stay with Node backend ideas, now that you have a map:

- Add Fastify or Nest to the same lab folder and reimplement Day 2–3. You should finish faster — that is the point.
- Read `lib/auth.ts` and `middleware.ts` again; it should feel like Day 3 + 5, not like a foreign language.
- Learn SQL/transactions next if Day 4’s concurrency paragraph still feels fuzzy — that is data-layer, not framework.

Do not collect more frameworks until you can add a route + middleware + 422 validation in Express without copying.

---

## Glossary

| Term | Meaning |
| --- | --- |
| Handler / controller | Function that finishes an HTTP request |
| Route | Method + path pattern bound to a handler |
| Router | Group of routes mounted on a prefix |
| Middleware | Pipeline function around handlers |
| Edge runtime | Limited JS runtime (Next `middleware.ts`); not full Node |
| Session | Server-side record keyed by an opaque cookie |
| JWT | Signed blob of claims; often used as a bearer token |
| httpOnly | Cookie not readable from JavaScript |
| Authentication | Proving who you are |
| Authorization | Checking what you may do |
| Tenancy | Scoping rows to an org/shop |
| Validation | Checking shape/type/range of input |
| Transaction | All-or-nothing group of writes |
| Pool | Reused DB connections |
| CORS | Browser rule for cross-origin HTTP |

---

## Self-check

Score 0 / 1 (with notes) / 2 (from memory):

- [ ] Node is a runtime; Express/Next are frameworks on HTTP.
- [ ] I can add `GET`/`POST`/`PATCH` routes with params and query.
- [ ] I can write middleware that logs, that 401s, and that calls `next()`.
- [ ] I can choose 401 vs 403 vs 404 vs 409 vs 422.
- [ ] I can explain server sessions vs JWT vs cookie-stored JWT.
- [ ] I know why password hashes use a salt and a slow function.
- [ ] I can filter data by `shopId` after login (tenancy).
- [ ] I can point at the same ideas in Taem Baltina without rereading this doc.

**12+ is a pass.** Re-run the weak day’s lab instead of collecting more tutorials.
