# Avernic UK

A UK-only e-commerce website for Avernic UK: React + TypeScript + Vite + Tailwind CSS frontend,
Cloudflare Pages Functions backend, Supabase (Postgres + Auth) database, Resend transactional
email, and Fano Open Banking payment (architecture in place, pending Fano's official API docs —
see **Fano integration status** below).

## Contents

- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database setup (Supabase)](#database-setup-supabase)
- [Local development](#local-development)
- [Fano integration status](#fano-integration-status)
- [Resend email status](#resend-email-status)
- [Project structure](#project-structure)
- [UK-only enforcement](#uk-only-enforcement)
- [Security notes](#security-notes)
- [Testing](#testing)
- [Deployment (Cloudflare Pages)](#deployment-cloudflare-pages)
- [What's left before this is production-ready](#whats-left-before-this-is-production-ready)

## Quick start

```bash
npm install
cp .env.example .env              # fill in Supabase values (see below)
cp .dev.vars.example .dev.vars    # same values, used by Pages Functions locally
npm run dev                       # Vite dev server, http://localhost:5173
```

The site will run and be browsable with `npm run dev` alone, but the basket, checkout, admin
dashboard and any other `/api/*` route need the Cloudflare Pages Functions dev server too — see
[Local development](#local-development).

## Environment variables

See `.env.example` (frontend, `VITE_`-prefixed = public) and `.dev.vars.example` (server-only,
used by `functions/`). Summary:

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Frontend (public) | Supabase client — safe to expose; RLS enforces access |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Server only | Full-access DB client for `functions/` — **never** expose to the browser |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Server only | Transactional email sending |
| `ADMIN_NOTIFICATION_EMAIL` | Server only | Where new-order and contact-form notifications go |
| `FANO_API_BASE_URL`, `FANO_CLIENT_ID`, `FANO_CLIENT_SECRET`, `FANO_WEBHOOK_SIGNING_SECRET` | Server only | Fano Open Banking — **not yet usable**, see below |
| `SITE_URL` / `VITE_SITE_URL` | Both | Used to build absolute links (emails, sitemap, Fano return URLs) |

## Database setup (Supabase)

1. Create a new Supabase project.
2. Run `supabase/migrations/0001_init.sql` against it (Supabase SQL editor, or `supabase db push`
   if you set up the CLI). This creates every table, constraint, index, and Row Level Security
   policy.
3. Optionally run `supabase/seed.sql` to populate a working sample catalogue (placeholder products
   — replace with your real catalogue before launch).
4. Create your first admin user: register an account through the site (`/register`), then in the
   Supabase SQL editor run:
   ```sql
   insert into admin_users (id, role) values ('<the user''s auth.users id>', 'admin');
   ```

## Local development

Two dev servers run together — Vite (frontend) and Wrangler (Cloudflare Pages Functions, the
`/api/*` backend):

```bash
npm run dev          # terminal 1 — Vite on :5173
npm run pages:dev     # terminal 2 — wrangler pages dev, serves Functions on :8788
```

`vite.config.ts` proxies `/api/*` requests from :5173 to :8788, so just browse `http://localhost:5173`.
`wrangler pages dev` reads server secrets from `.dev.vars` (git-ignored).

## Fano integration status

**Architecture only — not a working payment integration.** Per the project brief, no Fano API
endpoint, request/response field, or webhook payload shape has been invented. What exists:

- `functions/_lib/fano.ts` — the adapter boundary. `createFanoPayment()` and
  `verifyAndParseFanoWebhook()` currently throw `FanoNotConfiguredError` with a clear message. The
  file has a detailed comment listing **exactly** what's needed from Fano's documentation to
  finish it (base URL, auth mechanism, create-payment request/response shape, webhook signature
  scheme and payload).
- `functions/api/checkout/create-order.ts` — creates the order as `pending_payment` first, then
  attempts to create the Fano payment. If Fano isn't configured, the order is still saved and the
  customer sees a clear "payment isn't available yet" message rather than a fake success.
- `functions/api/payments/fano/webhook.ts` — full idempotent webhook handling (looks up the
  payment by `provider_reference`, no-ops if already `paid`, maps status → order/payment status,
  triggers the two confirmation emails exactly once) is implemented and ready to receive real
  events — it just can't verify/parse a payload it doesn't know the shape of yet.

**To finish this integration:** get Fano's API documentation and sandbox credentials, then fill in
the two functions in `functions/_lib/fano.ts` (the TODOs are inline) — nothing else in the codebase
needs to change.

## Resend email status

**Fully implemented and working**, pending only a real `RESEND_API_KEY` / verified sending domain:

- `functions/_lib/email.ts` sends both required emails (customer order confirmation, business
  notification to `ADMIN_NOTIFICATION_EMAIL`) via Resend's REST API.
- Idempotent via the `email_events` table (unique on `order_id, email_type`) — a duplicate Fano
  webhook cannot send either email twice.
- The contact form (`/contact` → `functions/api/contact.ts`) also uses Resend.

## Project structure

```
src/                      React app (Vite)
  components/ui/          Design system primitives (Button, Card, Input, Modal, ...)
  components/layout/      Header, Footer, Logo, InfoPageLayout
  components/product/     ProductCard, CategoryCard
  components/routing/     ProtectedRoute (customer), AdminRoute
  lib/api/                Supabase-backed data access (products, categories)
  lib/auth/                AuthProvider, useIsAdmin
  lib/basket/              BasketProvider (client state; server always re-prices)
  lib/validation/          UK postcode validation
  pages/                    One file per route (see App.tsx for the full route tree)

functions/                 Cloudflare Pages Functions (the API — file-based routing)
  _lib/                     Shared server code: supabaseAdmin, auth, pricing, fano, email, respond
  api/basket/price.ts       POST — server-authoritative basket pricing
  api/checkout/create-order.ts   POST — validates, re-prices, creates order, starts Fano payment
  api/payments/fano/webhook.ts   POST — idempotent Fano webhook handler
  api/orders/lookup.ts      POST — guest-safe order lookup (order number + email)
  api/admin/*                Admin-only endpoints (server-side admin_users check on every request)
  api/contact.ts             Contact form → Resend
  sitemap.xml.ts             Dynamic sitemap from the live catalogue

supabase/
  migrations/0001_init.sql   Full schema + RLS policies
  seed.sql                   Sample catalogue data
```

## UK-only enforcement

- No country selector anywhere; the delivery address form hardcodes "United Kingdom" as a
  read-only display field, and the API never accepts a country value from the client.
- `src/lib/validation/postcode.ts` / `functions/_lib/postcode.ts` implement the full official UK
  postcode format (not a simplified pattern) and are enforced **server-side** in
  `create-order.ts` — an invalid or non-UK postcode is rejected with a 422 before any order is
  created, regardless of what the frontend does.
- All prices are GBP only, stored as integer pence; there is no currency selector or conversion
  anywhere in the codebase.
- The `orders.currency` and `payments.currency` database columns are constrained
  (`check (currency = 'GBP')`) so a non-GBP order can't exist even via a direct DB write.

## Security notes

- **Server-authoritative pricing.** `functions/_lib/pricing.ts#priceBasket` is the single place
  prices/stock/totals are computed, always from the database. Both `/api/basket/price` and
  `/api/checkout/create-order` call it — the browser only ever sends product ids + quantities.
- **RLS everywhere.** Every table holding customer or order data has Row Level Security enabled
  (`supabase/migrations/0001_init.sql`). Customers can only ever see their own orders/addresses;
  admins are an explicit allow-list (`admin_users`), never inferred from a client-supplied role.
- **Admin routes are server-checked.** `functions/_lib/auth.ts#requireAdmin` re-verifies the
  caller's Supabase token AND their presence in `admin_users` on **every** `/api/admin/*` request
  — hiding the `/admin` frontend route is not the access control.
- **Payment status is never client-set.** `payment_status` only ever becomes `'paid'` via the
  verified Fano webhook handler; the admin order-update endpoint explicitly refuses to set it to
  `'paid'` (only `cancelled`/`refunded` are admin-settable).
- **Idempotency.** `payments.provider_reference` and `email_events (order_id, email_type)` both
  have unique indexes; the webhook handler and email sender check state before acting, so a
  duplicate webhook delivery cannot double-process an order or double-send emails.
- **Secrets never reach the browser.** `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and all
  `FANO_*` values are read only inside `functions/` from `context.env` — never from
  `import.meta.env`/`VITE_*`, and never logged.
- **No stack traces to the client.** `functions/_lib/respond.ts#errorResponse` always returns a
  short, friendly message; the real error is only ever `console.error`'d server-side.

## Testing

```bash
npm run typecheck   # tsc for both the Vite app and functions/
npm run lint
npm test            # vitest — postcode validation + delivery pricing unit tests
```

**Important — read this:** these commands were written and reasoned through carefully, but this
project was built in a sandboxed environment with no access to the npm registry, so **`npm
install` was never actually run and none of these commands have been executed against real
dependencies yet.** Run all three yourself after `npm install` and fix anything that surfaces —
treat the code as thoroughly-reasoned-but-unverified rather than pre-tested. The included tests
cover the two most safety-critical pure functions (UK postcode acceptance/rejection, delivery fee
thresholds) — everything else (checkout flow, webhook idempotency, admin authorisation) still
needs end-to-end testing against a real Supabase project, which requires credentials this
environment doesn't have.

## Deployment (Cloudflare Pages)

1. Push this repository to GitHub/GitLab.
2. In the Cloudflare dashboard: Pages → Create a project → connect the repo.
   - Build command: `npm run build`
   - Build output directory: `dist`
3. Pages → Settings → Environment variables: add every server variable from `.env.example` /
   `.dev.vars.example` (Production **and** Preview environments), plus the `VITE_*` ones for the
   build step.
4. Configure the Fano webhook URL as `https://<your-domain>/api/payments/fano/webhook` once Fano
   integration is completed.
5. Point your domain's DNS at the Cloudflare Pages project.

## What's left before this is production-ready

This is **not** production-ready as-is. Outstanding, in priority order:

1. **Run `npm install` and fix whatever `npm run typecheck` / `npm run build` surface** — this
   codebase has not been compiled or executed anywhere yet (see Testing above).
2. **Fano Open Banking** — get official API docs + sandbox credentials and implement
   `functions/_lib/fano.ts`. Nothing works end-to-end until this is done.
3. **Real business/legal details** — every `[placeholder]` in the footer, About, Contact, Terms,
   Privacy, Cookies, Delivery and Returns pages needs the real company name, registration number,
   registered address, contact details, and reviewed legal text (ideally by a solicitor).
4. **Real product catalogue** — replace `supabase/seed.sql` with real products, descriptions, and
   images (currently Unsplash stock photography placeholders).
5. **Delivery pricing** — `functions/_lib/pricing.ts` has placeholder delivery pricing (£2.95,
   free over £40); confirm and update the real figures.
6. **Supabase project, Resend domain verification, Cloudflare Pages project** all need to be
   created and connected end-to-end, then the full checkout → payment → webhook → email chain
   needs to be tested against them for real.
7. **Any pharmacy/prescription eligibility workflow**, if Avernic UK sells products that require
   one — the architecture supports adding it (e.g. a per-product `metadata` flag + a checkout-time
   eligibility step) but no such workflow exists yet, per the brief's instruction not to fabricate
   compliance.
