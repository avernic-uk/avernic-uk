# Avernic UK

A UK-only e-commerce website for Avernic UK, selling cosmetic peptide skincare (serums, moisturisers, eye care, cleansers, treatments — topical products only, not medicines or injectables): React + TypeScript + Vite + Tailwind CSS frontend, Cloudflare Pages Functions backend, Supabase (Postgres + Auth) database, Resend transactional email, and Fena Open Banking payment — see **Fena integration status** below.

**Product scope, deliberately:** only topical cosmetic peptide skincare. Injectable/"research" peptides (BPC-157, TB-500, Melanotan, GLP-1 analogues such as semaglutide/tirzepatide/retatrutide, etc.) are unlicensed medicinal products in the UK — selling them to consumers breaches the Human Medicines Regulations 2012 regardless of "research use only"/18+ labelling. Two such products were added to the live catalogue and removed once flagged; don't re-add anything in that category. A site-wide 18+ notice (`src/components/layout/AgeNotice.tsx`) is shown as a general caution, not because these products are legally age-restricted.

## Contents

- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database setup (Supabase)](#database-setup-supabase)
- [Local development](#local-development)
- [Fena integration status](#fena-integration-status)
- [Resend email status](#resend-email-status)
- [Project structure](#project-structure)
- [Theme & dark mode](#theme--dark-mode)
- [SEO](#seo)
- [Images and uploads](#images-and-uploads)
- [Analytics](#analytics)
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
| `FENA_INTEGRATION_ID`, `FENA_SECRET_KEY` | Server only | Fena Open Banking credentials — see below |
| `FENA_BANK_ACCOUNT_ID` | Server only | Optional; only needed with more than one bank account connected |
| `FENA_API_BASE_URL` | Server only | Optional override; defaults to Fena's production API |
| `FENA_WEBHOOK_SHARED_SECRET` | Server only | Optional; guards the Fena webhook endpoint against noise, see below |
| `SITE_URL` / `VITE_SITE_URL` | Both | Used to build absolute links (emails, sitemap, Fena redirect URL) |
| `ANALYTICS_SALT` | Server only | Secret salt for the cookieless analytics visitor hash — **set this in production**, see [Analytics](#analytics) |

## Database setup (Supabase)

1. Create a new Supabase project.
2. Run every file in `supabase/migrations/` against it **in filename order** (Supabase SQL editor,
   or `supabase db push` if you set up the CLI). `0001_init.sql` creates every table, constraint,
   index and Row Level Security policy; the later migrations add admin-editable site content, SEO
   settings, product reviews, Royal Mail shipping options and the product detail fields. They are
   written to be idempotent (`if not exists` / guarded `update`s), so re-running one is safe.
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

## Fena integration status

**Implemented, against Fena's own published PHP SDK** (github.com/fena-co/toolkit-php-sdk —
the same code their official WooCommerce/Shopify/OpenCart plugins are built on), since Fena does
not publish a plain REST API reference for this flow. What's real and confirmed from that SDK's
source: the base URL, the create-payment endpoint/headers/fields, and the public status-check
endpoint. What is **not** publicly documented anywhere: the exact webhook payload shape and
signature scheme Fena posts to a merchant's notification URL — so this integration deliberately
does not trust the webhook body. See the full explanation in `functions/_lib/fena.ts`.

- `functions/_lib/fena.ts` — `createFenaPayment()` creates a payment and returns the redirect URL;
  `checkFenaPaymentStatus()` fetches live status straight from Fena's public status endpoint. This
  is the only source of truth this integration trusts.
- `functions/_lib/paymentReconciliation.ts` — the shared, idempotent status-transition logic (maps
  Fena's status onto Avernic UK's own vocabulary, updates `orders`/`payments`, triggers the two
  confirmation emails exactly once on the transition into `paid`).
- `functions/api/checkout/create-order.ts` — creates the order as `pending_payment`, then starts
  the Fena payment. If Fena isn't configured, the order is still saved and the customer sees a
  clear "payment isn't available yet" message rather than a fake success.
- `functions/api/orders/lookup.ts` — when a customer lands back on the order-confirmation page
  with a payment still pending/processing, this re-checks status directly against Fena **before**
  responding, rather than trusting the redirect. This is the primary way payment gets confirmed.
- `functions/api/payments/fena/webhook.ts` — a secondary path: treats an incoming webhook purely
  as a "go re-check this payment" trigger (matched to a payment via a best-effort field-name
  guess), never as a trusted status report, since the payload/signature scheme isn't confirmed.

**What you need to provide** (from the Fena dashboard: Settings → API keys → Generate API Key,
role "Owner"/"Partner Integration"): the generated Terminal ID/Terminal Secret pair (→
`FENA_INTEGRATION_ID` / `FENA_SECRET_KEY`). `FENA_BANK_ACCOUNT_ID` can be left unset — confirmed
with a real live test call that when omitted, Fena uses the terminal's one connected bank account
automatically; only set it if a second account is ever connected and a non-default one is needed.
When generating the key, set the "Payment notification URL" to
`https://<your-domain>/api/payments/fena/webhook` (optionally with `?key=<a random secret>`,
matched against `FENA_WEBHOOK_SHARED_SECRET`, to keep random traffic off that endpoint) and the
redirect URL can be left as whatever Fena requires — the actual per-order redirect is set
dynamically by this codebase on each payment.

**Not yet confirmed / worth validating with a real sandbox payment before going live:** the exact
set of status strings Fena returns for this specific payment type (the mapping in `fena.ts` covers
the plausible set and safely no-ops on anything unrecognised, but a real test payment is the way
to be sure), and Fena's retry behaviour on the webhook (harmless either way, since the webhook is
only ever a trigger, not a source of truth).

## Resend email status

**Fully implemented and working**, pending only a real `RESEND_API_KEY` / verified sending domain:

- `functions/_lib/email.ts` sends both required emails (customer order confirmation, business
  notification to `ADMIN_NOTIFICATION_EMAIL`) via Resend's REST API.
- Idempotent via the `email_events` table (unique on `order_id, email_type`) — a duplicate Fena
  webhook, or a repeated status re-check, cannot send either email twice.
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
  lib/theme/               ThemeProvider — dark by default, per-browser toggle (see Theme & dark mode)
  lib/seo.ts, useDocumentMeta.ts, useJsonLd.ts   Per-page head tags + structured data (see SEO)
  lib/validation/          UK postcode validation
  pages/                    One file per route (see App.tsx for the full route tree)

functions/                 Cloudflare Pages Functions (the API — file-based routing)
  _middleware.ts            Edge SEO: fills title/OG/canonical/JSON-LD into the HTML shell per URL (see SEO)
  _lib/seoMeta.ts           Static page map + product/category meta lookups for the middleware
  _lib/                     Shared server code: supabaseAdmin, auth, pricing, fena, paymentReconciliation, email, respond
  api/basket/price.ts       POST — server-authoritative basket pricing
  api/checkout/create-order.ts   POST — validates, re-prices, creates order, starts Fena payment
  api/payments/fena/webhook.ts   POST — Fena webhook (trigger-only re-check, see Fena integration status)
  api/orders/lookup.ts      POST — guest-safe order lookup (order number + email)
  api/admin/*                Admin-only endpoints (server-side admin_users check on every request)
  api/contact.ts             Contact form → Resend
  sitemap.xml.ts             Dynamic sitemap from the live catalogue

supabase/
  migrations/0001_init.sql   Full schema + RLS policies
  seed.sql                   Sample catalogue data
```

## Theme & dark mode

The site is **dark by default** with a sun/moon toggle in the header; the choice is remembered per browser (`localStorage["avernic-theme"]`). There is no flash of the wrong theme: a tiny inline script in `index.html` applies the saved theme before first paint, then `src/lib/theme/ThemeProvider.tsx` takes over.

How it works, so the next change fits in:

- Tailwind runs with `darkMode: 'class'`, and **every colour in `tailwind.config.ts` resolves to a CSS variable** declared in `src/index.css` (`:root` = light palette, `.dark` = dark palette).
- The `ink` scale and `white` are **semantic, not literal**: `ink-950` is always the strongest foreground and `white` is always the page surface. So `bg-white text-ink-950` means "page surface, strongest text" in *both* themes — components don't need `dark:` variants for basic colours. Use `dark:` only for theme-specific flourishes (glows, glass).
- Text that sits on a fixed-colour background (white on the red danger button, near-black on the brass accent) uses the theme-independent `literal-white` / `literal-ink` colours.
- Palette: blue-black graphite grounds (`#0b0b10` page, `#12121a` raised) with a warmer, brighter brass accent in dark mode so it still glows. Light mode is the original slate/ochre palette.

## SEO

Two layers, sharing one set of `data-seo="…"`-tagged elements declared in `index.html`:

1. **In the browser** — `useDocumentMeta({ title, description, path?, image?, type?, noindex? })` sets `<title>`, description, robots, canonical, Open Graph and Twitter tags on every route; `useJsonLd` adds structured data. The site graph (Organization/OnlineStore + WebSite with a search action) is emitted from `Layout.tsx`; product pages emit `Product` + `BreadcrumbList`. Basket, checkout, account, auth and admin pages are `noindex`. `/shop` declares one canonical URL for every filter/search combination.
2. **At the edge** — `functions/_middleware.ts` runs on every HTML page request and, via `HTMLRewriter`, replaces the same tags *server-side* before the shell is served, looking product/category details up in Supabase (with a short Cache API TTL). This is what social link previews and non-JS crawlers see, so a shared product link shows the product's name, description and image rather than the homepage's. Unknown product/category slugs and unknown routes are served with a real **404 status** (the React 404 page still renders) so they aren't indexed as soft-404s. `/api/*`, `sitemap.xml`, `robots.txt` and anything with a file extension pass straight through.

Also: dynamic `sitemap.xml` from the live catalogue, `robots.txt` excluding private/transactional paths and search-result URLs, absolute `og:image` URLs, `max-image-preview:large`.

### Canonical domain

The canonical origin is **`https://www.avernic.uk`**. It is set in `wrangler.toml` (`SITE_URL`),
`index.html`, `public/robots.txt` and the fallbacks in `src/lib/seo.ts`, `functions/llms.txt.ts`,
`functions/llms-full.txt.ts` and `functions/sitemap.xml.ts`. If it ever changes, change it in all of
them together.

**Only `www.avernic.uk` has a DNS record.** The apex `avernic.uk` does not resolve at all — it has
never been added as a custom domain on the Cloudflare Pages project. This was briefly set as the
canonical host and it took the live site down: the middleware dutifully 301-redirected every visitor
from the working `www` host to an apex with no A record. **Before changing the canonical host, check
that the new host actually resolves** (`python3 -c "import socket;socket.getaddrinfo('host',None)"`
or `dig +short <host> A`) — do not infer it from a browser tool reporting an origin, which is what
went wrong.

To move to the apex later: add `avernic.uk` as a custom domain in Cloudflare Pages (Workers & Pages →
avernic-uk → Custom domains), confirm it resolves, then flip the values above.

`functions/_middleware.ts` 301-redirects duplicate hostnames onto the canonical one — the apex, the
`www` form, and the Cloudflare project domain `avernic-uk.pages.dev` — so the same catalogue can't be
crawled and ranked three times over. It works in whichever direction the canonical is configured, and
is deliberately narrow: `GET`/`HEAD` only, never `/api/*` (a 301 would break the Fena webhook), and
never hashed preview deployments like `<hash>.avernic-uk.pages.dev`, which stay independently
testable.

### Structured data

Product pages carry `Product` + `Offer` + `BreadcrumbList`, and — when a product has approved
reviews — `aggregateRating` and `review`. The `Offer` includes `shippingDetails` for both Royal Mail
options (rates read from Admin → Settings, so schema can never quote a price checkout doesn't
charge) and a `hasMerchantReturnPolicy` of 14 days, matching `/returns`. The product detail fields
are also emitted as `additionalProperty` entries. `/shop` and each category page carry
`CollectionPage` + `ItemList`, which is what gives them something to rank for before React boots.

The browser and the edge build the same shapes independently — `src/pages/ProductPage.tsx` and
`functions/_lib/seoMeta.ts` — so **when you change one, change the other**.

### AI answer engines (AIO)

`robots.txt` explicitly allows the major AI crawlers, and two documents are published for them
following the [llms.txt convention](https://llmstxt.org/), both generated live from the same
admin-editable content the storefront renders:

- **`/llms.txt`** — the index: what the shop is, business details, delivery and returns, the
  cosmetic-only boundary, a plain explanation of cosmetic peptides, categories, a one-line-per-
  product catalogue, and FAQs.
- **`/llms-full.txt`** — the whole catalogue in full: every product's complete description, key
  ingredients, numbered usage steps, suitability and INCI list.

Both are built by `functions/_lib/llmsText.ts`. The **"What Avernic UK does not sell"** section in
them is load-bearing, not boilerplate: searches for "peptides" are dominated by injectable and
research peptides, and stating the boundary in the document written for machines is what stops an
answer engine describing this site as a source for them.

## Images and uploads

Product photos, the logo and the homepage hero image are all set from the admin panel, and each field
accepts **either** an upload **or** a pasted URL (`src/components/admin/ImageField.tsx`).

Uploads go to a public Supabase Storage bucket, `site-images` (migration `0009`), via
`functions/api/admin/uploads.ts`. That endpoint is the **only** writer: the bucket has a public read
policy and deliberately no insert/update/delete policy, so writes succeed only because the endpoint
runs with the service-role key *after* `requireAdmin()` has passed. Without that asymmetry a public
bucket is an open file drop for anyone who finds the URL.

Limits are enforced in both the endpoint and the bucket itself (so they hold even if the endpoint
changes): 5MB, and JPEG/PNG/WebP/AVIF/GIF/SVG only. Object keys are `YYYY-MM-DD/slugified-name-
<random>.ext` — the random suffix means re-uploading `hero.jpg` never silently replaces a `hero.jpg`
already live on a page, which in turn makes the one-year `Cache-Control` safe.

SVG is allowed because logos often arrive that way. It is worth knowing that an SVG can carry script;
what contains that here is that only an admin can upload, and Storage serves from its own domain
rather than `avernic.uk`, so nothing uploaded shares an origin with the shop or its session. Remove
`image/svg+xml` from `ALLOWED_TYPES` and from the bucket's `allowed_mime_types` to disallow it.

**Hero image.** `site_settings.hero_image_url` replaces the floating logo mark on the homepage when
set, with a different treatment: a photograph gets a clean frame, while the logo keeps the brass rings
and float animation that stop a small mark looking adrift. Empty is a valid, good-looking state, not a
broken one. `hero_image_alt` describes it — a hero photograph is content, not decoration.

## Analytics

First-party and cookieless, in `analytics_events` / `analytics_daily` (migration `0008_analytics.sql`),
with a dashboard at **Admin → Analytics**. No Google Analytics, no third-party script, no data leaving
this Supabase project.

**Why cookieless.** PECR requires consent to store or read information on a visitor's device. This
stores nothing there, so no consent gate applies and measurement covers every visitor rather than only
the minority who accept a banner. The site still offers a real opt-out, and honours `DNT` /
`Sec-GPC`.

**How a visitor is counted without a cookie.** `functions/api/track.ts` hashes
`(daily-rotating salt + IP + user agent)` with SHA-256 and stores only that. The raw IP and user agent
are used for the hash and discarded — neither is ever written to the database, and nor is the full
referring URL (hostname only) or any query string. The salt rotates every 24h, so the same person on
two consecutive days produces two unrelated hashes. **That is deliberate, not a bug to fix:** being
unable to follow someone across days is what keeps the data effectively anonymous. It does mean
"visitors" is really "visitors per day", and multi-day returning-visitor rates are not knowable.

Set **`ANALYTICS_SALT`** to a long random string in the Cloudflare Pages environment. Without it the
code falls back to a known constant, and someone aware of the scheme could test whether a *specific*
IP had visited.

**What's excluded.** Known bots and crawlers by user-agent (including the AI crawlers `robots.txt`
deliberately invites, which would otherwise register as a large fake audience), and the `/admin`,
`/account`, `/checkout`, `/basket` and auth routes.

**Retention.** Raw events are kept 90 days, then `rollup_analytics()` aggregates them into
`analytics_daily` (counts only, no visitor hashes) and deletes them. A `pg_cron` job
`avernic-analytics-rollup` runs nightly at 03:30 UTC; the admin analytics API also calls the same
function opportunistically, so retention still works if that job is ever removed. Both are idempotent.

**Adding events.** The table already carries an `event_type` check constraint — extend it, add a
`trackEvent` call, and extend `analytics_summary()`. Basket and checkout funnel events were
deliberately *not* built (not requested), but the schema takes them without change.

**Charts** are hand-drawn SVG in `AdminAnalyticsPage.tsx`, single-hue (`rgb(var(--accent-500))`,
validated at 3.2:1 on the light surface and 6.1:1 on the dark one). Nothing on that page encodes
identity by colour, so no categorical palette is needed — and the design system only has one accent
hue, so inventing one would look foreign.

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
- **Payment status is never client-set, and never trusted from Fena's webhook body either.**
  `payment_status` only ever becomes `'paid'` after this server itself confirms it directly against
  Fena's own status API (`functions/_lib/paymentReconciliation.ts`); the admin order-update endpoint
  explicitly refuses to set it to `'paid'` (only `cancelled`/`refunded` are admin-settable).
- **Idempotency.** `payments.provider_reference` and `email_events (order_id, email_type)` both
  have unique indexes; the reconciliation logic and email sender check state before acting, so a
  duplicate webhook delivery or repeated status check cannot double-process an order or
  double-send emails.
- **Secrets never reach the browser.** `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and all
  `FENA_*` values are read only inside `functions/` from `context.env` — never from
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
4. In the Fena dashboard, set the "Payment notification URL" (when generating/editing the API key)
   to `https://<your-domain>/api/payments/fena/webhook` — add `?key=<your FENA_WEBHOOK_SHARED_SECRET>`
   if that's configured.
5. Point your domain's DNS at the Cloudflare Pages project.

## What's left before this is production-ready

This is **not** production-ready as-is. Outstanding, in priority order:

1. **Run `npm install` and fix whatever `npm run typecheck` / `npm run build` surface** — this
   codebase has not been compiled or executed anywhere yet (see Testing above).
2. **Fena Open Banking** — implemented against Fena's published SDK (see Fena integration status
   above); a real live diagnostic call has confirmed the create-payment endpoint, request/response
   shape, and default bank account selection. Not yet confirmed: the exact status strings this
   payment type returns as it moves through its lifecycle, and the real webhook payload — both
   worth watching on the first real customer payment.
3. **Real business/legal details** — every `[placeholder]` in the footer, About, Contact, Terms,
   Privacy, Cookies, Delivery and Returns pages needs the real company name, registration number,
   registered address, contact details, and reviewed legal text (ideally by a solicitor).
4. **Real product catalogue** — product photography is still Unsplash stock. The written copy is no
   longer placeholder: migration `0007_product_detail.sql` adds `size_label`, `key_ingredients`,
   `how_to_use`, `suitability` and `ingredients_inci` to `products`, and seeds **draft** copy for all
   ten real products. Two things still need a human before launch:
   - **Review the draft copy** in Admin → Products. It is written to stay inside cosmetic claim
     boundaries (appearance, feel and look only — nothing stating or implying a physiological or
     therapeutic effect), but it has not been checked against the actual formulations. In
     particular, confirm the named actives are really in each product.
   - **Fill in `ingredients_inci`** for every product, from the supplier's specification. It is
     deliberately left empty and was never auto-generated: it is a regulated declaration that a
     customer with an allergy relies on, so it must match the formulation exactly. The product page
     simply hides the section while it is blank.

   Each seeding `UPDATE` is guarded on the original placeholder text still being present, so the
   migration is safe to re-run and will never overwrite copy edited by hand afterwards.
5. **Delivery pricing** — `functions/_lib/pricing.ts` has placeholder delivery pricing (£2.95,
   free over £40); confirm and update the real figures.
6. **Set `ANALYTICS_SALT`** to a long random string in the Cloudflare Pages environment (see
   Analytics above) — without it the analytics visitor hash uses a publicly-known fallback salt.
7. **Supabase project, Resend domain verification, Cloudflare Pages project** all need to be
   created and connected end-to-end, then the full checkout → payment → webhook → email chain
   needs to be tested against them for real.
8. **Stay within the product scope above.** If the business wants to expand beyond topical cosmetic skincare (injectables, ingestibles, anything making a medical claim), that needs a UK healthcare regulatory lawyer's input before it's added to this codebase — not just a new product row.
