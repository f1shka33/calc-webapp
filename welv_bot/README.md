# welv_bot

> Digital weapons for artists who want to **sound, look, and sell insane.**

A dark luxury marketplace for underground artists, SoundCloud rappers, TikTok musicians, producers, and creators. Sells vocal presets, FL Studio mixer chains, cover art packs, SoundCloud banners, AI prompt packs, beats, mixing services, TikTok promo ideas, artist branding kits, and custom orders.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma**, **PostgreSQL**, **NextAuth**, **Zod**, and a swappable **Stripe / YooKassa / fake-checkout** payment architecture.

---

## Quick start

### 1. Prerequisites

- Node 18.18+ (Node 20 recommended)
- npm 10+ (or pnpm / yarn)
- A running PostgreSQL 14+ instance — e.g. via Docker:
  ```bash
  docker run --name welv-pg \
    -e POSTGRES_USER=welv \
    -e POSTGRES_PASSWORD=welv \
    -e POSTGRES_DB=welv_bot \
    -p 5432:5432 \
    -d postgres:16
  ```

### 2. Install & configure

```bash
git clone https://github.com/<your>/welv_bot.git
cd welv_bot
cp .env.example .env
# edit DATABASE_URL, NEXTAUTH_SECRET, etc.
npm install
```

### 3. Database

```bash
npm run prisma:migrate     # creates the schema (will name your first migration "init")
npm run db:seed            # populates 10 categories, 10 products, and an admin user
```

The seed creates an admin account (`admin@welv.bot` / `admin12345` by default — override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

### 4. Run

```bash
npm run dev
# http://localhost:3000
```

That's it. Sign up, browse the catalog, pretend-pay, unlock downloads.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Run the dev server. |
| `npm run build` | Generate Prisma client + production build. |
| `npm start` | Start the production server (after `build`). |
| `npm run lint` | Run ESLint via `next lint`. |
| `npm run typecheck` | Run `tsc --noEmit`. |
| `npm run prisma:generate` | Regenerate Prisma client. |
| `npm run prisma:migrate` | Run `prisma migrate dev`. |
| `npm run prisma:deploy` | Apply migrations in CI / prod. |
| `npm run prisma:studio` | Open Prisma Studio. |
| `npm run db:seed` | Seed categories, products, and the admin user. |

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Var | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string. |
| `NEXTAUTH_URL` | yes | Public URL of the app (`http://localhost:3000` in dev). |
| `NEXTAUTH_SECRET` | yes | Long random string. Generate with `openssl rand -base64 48`. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | optional | Override the seeded admin user. |
| `PAYMENT_PROVIDER` | optional | `fake` (default) / `stripe` / `yookassa`. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | optional | Stripe wiring (placeholder). |
| `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` | optional | YooKassa wiring (placeholder). |
| `USD_TO_RUB` | optional | Rate used when computing RUB prices in the seed (default 95). |

---

## Project structure

```
prisma/
  schema.prisma          # all models (User, Product, Category, Order, OrderItem,
  seed.ts                # Download, Review, CustomOrder, AdminLog)

src/
  app/
    page.tsx             # Landing page
    catalog/             # Catalog with filters / search / sort
    products/[slug]/     # Product detail page
    custom-order/        # Custom-order brief form
    ai-brief/            # AI Brief Generator (template-driven)
    checkout/fake/       # Fake-checkout dev page
    dashboard/           # User dashboard (overview, orders, custom orders, settings)
    admin/               # Admin dashboard (overview, products, categories,
                         #                  orders, custom orders, users)
    api/
      auth/              # NextAuth handler + signup
      checkout/          # Create + confirm payment
      downloads/[token]/ # Tokenized digital file delivery
      custom-orders/     # User-facing custom-order intake
      account/           # Profile / password updates
      admin/             # Admin-only CRUD endpoints (products, categories,
                         #   orders, custom orders, file upload)

  components/            # Reusable UI (ProductCard, CatalogFilters, ProductForm, …)
  lib/
    prisma.ts            # Prisma client singleton
    auth.ts              # NextAuth options + session typing
    session.ts           # `requireUser`, `requireAdmin`
    admin.ts             # `requireAdminApi` for API routes
    payments/            # Provider abstraction (fake / stripe / yookassa)
    briefs.ts            # AI Brief Generator templates
    validators.ts        # Zod schemas
    format.ts            # USD / RUB formatters
    cn.ts                # tailwind-merge helper
  middleware.ts          # NextAuth-based protection for /dashboard, /admin, /checkout
```

The most-important files to know:
- `prisma/schema.prisma` — the data model. Editing this is the primary way to extend the app.
- `src/lib/payments/index.ts` — payment provider switch. Implement Stripe / YooKassa here.
- `src/lib/auth.ts` + `src/middleware.ts` — auth and route protection.
- `src/app/page.tsx` — landing page; lots of UI copy lives here.
- `src/app/catalog/page.tsx` + `src/components/CatalogFilters.tsx` — catalog logic + filters.
- `src/app/admin/products/[id]/page.tsx` + `src/components/ProductForm.tsx` — product CRUD UI.

---

## Payment architecture

Provider switching is controlled by `PAYMENT_PROVIDER`:

- `fake` (default) — orders go through `/checkout/fake` and are confirmed via `/api/checkout/confirm`. Always succeeds (or simulates failure on demand).
- `stripe` — placeholder in `src/lib/payments/stripe.ts`. Add the `stripe` SDK, implement `createPayment` (Checkout Sessions) and a webhook route at `src/app/api/webhooks/stripe/route.ts`. Convert `checkout.session.completed` events into `confirmPayment(...)`.
- `yookassa` — placeholder in `src/lib/payments/yookassa.ts`. Hit `POST https://api.yookassa.ru/v3/payments` with an Idempotence-Key header. Verify webhook events `payment.succeeded` and call `confirmPayment(...)`.

Order lifecycle: `PENDING → PAID` (unlocks downloads) `→ FAILED` / `REFUNDED`.

---

## Authentication

- NextAuth with the `Credentials` provider (email + password, bcrypt-hashed).
- `JWT` strategy; the `role` claim controls admin access.
- `src/middleware.ts` protects `/dashboard`, `/admin`, and `/checkout`. Server pages additionally call `requireUser()` / `requireAdmin()` from `src/lib/session.ts`.

To create more admins, either:
- Run the seed with a different `SEED_ADMIN_EMAIL`, or
- Open Prisma Studio (`npm run prisma:studio`) and flip a user's `role` to `ADMIN`.

---

## Uploads

`POST /api/admin/upload` writes to `public/uploads/` for development. **Replace this with S3 / R2 / Supabase Storage in production** — the route is intentionally minimal so it's easy to swap.

Product `imageUrl` and `fileUrl` accept either uploaded paths (`/uploads/...`) or fully-qualified URLs.

---

## What is already working

- Landing page with the full set of sections (hero, best sellers, why, categories, how it works, reviews, FAQ, final CTA).
- Catalog with category, format, price, sort, and full-text search filters.
- Product detail pages with description, includes, license, compatibility, reviews, and related products.
- Sign up / login / logout / role-based dashboards.
- User dashboard with downloads, orders, custom orders, and account settings.
- Admin dashboard with full CRUD for products, categories, file upload, and status management for orders + custom orders.
- Custom-order intake form, persisted to the database, visible to both the buyer and admin.
- AI Brief Generator with five different brief templates rendered client-side.
- Fake-checkout flow: order goes from `PENDING` → `PAID`, downloads unlock automatically.
- Token-protected download URLs with per-user authorization and download counters.

## What is still placeholder

- Stripe and YooKassa providers throw "not configured" — wire them up in `src/lib/payments/`.
- File uploads are stored on local disk under `public/uploads/`. Swap to object storage for production.
- Reviews are read-only on the frontend (the schema and admin path support them; add a "Write a review" form when ready).
- Product preview imagery is generated procedurally from each product's title — replace with real artwork by setting `Product.imageUrl`.
- No email transactional delivery yet (sign-up confirmation, custom-order acknowledgements). Hook in Resend / SES / SMTP when needed.

## Next steps to deploy

1. Provision Postgres (Supabase, Neon, RDS, Railway, …) and set `DATABASE_URL`.
2. Generate a strong `NEXTAUTH_SECRET` and set `NEXTAUTH_URL` to your public domain.
3. `npm run prisma:deploy && npm run db:seed` to apply migrations and load demo data (skip seed in production once you've added real products).
4. Pick a host: Vercel works out of the box. For Stripe, expose `/api/webhooks/stripe`; for YooKassa, expose its webhook endpoint.
5. Replace the dev upload handler with S3 / R2 / Supabase Storage and update `Product.imageUrl` / `fileUrl` accordingly.
6. (Optional) Add a transactional email provider for order receipts and custom-order updates.

---

## License

Private project scaffold. © welv_bot.
