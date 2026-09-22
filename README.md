# AgroVista

A full magazine platform on Next.js 16 (App Router) + Supabase (Postgres + Storage) + Razorpay: catalog (years → volumes → issue slots), subscriptions (with optional Razorpay Autopay/mandate renewal), one-time issue purchases, hard-copy order + return/refund management, coupons, an article submission → editorial review → publish pipeline, and a full admin panel — built from [`AgroVista_Planning.md`](AgroVista_Planning.md).

The original Express/vanilla-JS pay-per-issue app this project started from is preserved under [`legacy-express-app/`](legacy-express-app/) for reference.

## Stack

Next.js 16 · TypeScript · Tailwind CSS · Supabase Postgres + Storage · bcryptjs + JWT auth (role-based: `user`/`admin`) · Razorpay (orders, autopay mandates, refunds) · react-hook-form · react-hot-toast · lucide-react

## Adapter layer (`lib/adapters/`)

Storage, payments, and notifications (email + SMS) are each behind a small adapter interface, selected by env var, so the app runs with zero external services in `stub` mode (everything just logs to the console) until real credentials are wired in:

| Env var | Values | Purpose |
|---|---|---|
| `STORAGE_ADAPTER` | `stub` \| `supabase` | Poster images, issue PDFs, submission files |
| `PAYMENT_ADAPTER` | `stub` \| `razorpay` | Orders, autopay mandates, refunds |
| `NOTIFIER_ADAPTER` | `stub` \| `email-sms` | Email always sends when active; SMS (Fast2SMS) stays off unless `SMS_NOTIFICATIONS_ENABLED=true` — email is the default channel |
| `SENTRY_ENABLED` | `true` \| `false` | Error monitoring wrapper (`lib/adapters/monitoring.ts`) — currently logs to console; wire up `@sentry/nextjs` when ready |

## 1. Install & configure

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:
- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from Project Settings → API. The service role key is server-only and bypasses RLS; nothing in this app runs Supabase queries from the browser.
- **Auth** — `JWT_SECRET` (generate with `openssl rand -hex 32`).
- **Razorpay** — `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` from the dashboard, plus `RAZORPAY_WEBHOOK_SECRET` (step 5).
- **Notifications** — Gmail App Password for SMTP; Fast2SMS API key if you want SMS later.

## 2. Database

Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor. It creates all 14 tables (`users`, `publication_years`, `volumes`, `issue_slots`, `issues`, `subscription_plans`, `subscriptions`, `issue_orders`, `return_requests`, `cart_items`, `coupons`, `coupon_usages`, `article_submissions`, `submission_versions`) with RLS enabled and no policies — every access goes through this app's server code via the service role key.

## 3. Storage buckets

```bash
npm run setup:buckets
```

Creates `issue-posters` (public), `issue-pdfs` (private), `submission-files` (private), `admin-edits` (private).

## 4. Create your first admin user

```bash
npm run seed:admin -- --email you@example.com --password "Something8+" --name "Your Name"
```

Promotes the user to `role = 'admin'` if they already registered, or creates them directly.

## 5. Razorpay webhook (for Autopay renewals)

1. Dashboard → **Settings → Webhooks → Add New Webhook**.
2. URL: `https://YOUR_DOMAIN/api/payment/webhook`
3. Events: `subscription.charged`, `subscription.cancelled`, `subscription.halted`, `subscription.completed`.
4. Copy the **Webhook Secret** into `.env.local` as `RAZORPAY_WEBHOOK_SECRET`.

## 6. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign in at `/login` with your seeded admin account to reach `/admin`.

## How auth works

Custom bcrypt + JWT — **not** Supabase Auth. `POST /api/auth/register` hashes the password (bcrypt, 12 rounds) and signs a JWT `{ userId, email, role }` into an httpOnly `agrovista_session` cookie (`JWT_EXPIRY_DAYS`, default 7). `proxy.ts` (Next 16's middleware convention) does a cheap cookie-presence redirect for `/admin`, `/account`, `/checkout`, `/submit-article` — the real signature + role check happens server-side via `getSession()`/`requireAdminOrRedirect()` on every protected page and route, since JWT verification needs Node's `crypto`, unavailable in Edge middleware.

## How PDF access works

No more watermarked page-streaming viewer (that was the old Express app's model). Per the plan: `GET /api/download/[id]` checks the caller has either a paid one-time order or an active subscription covering that issue's publish date, then returns a 15-minute Supabase Storage **signed URL** — the storage path itself is never exposed. This also means the app has no native-binary dependency (no poppler), so it deploys cleanly on plain Vercel serverless, unlike the old approach.

## How Autopay works

Choosing "Enable Autopay" on `/subscribe` creates a Razorpay **Plan** (cached on `subscription_plans.razorpay_plan_id`, created lazily on first use) and a mandate **Subscription**, and Checkout opens with `subscription_id` instead of `order_id`. Renewal charges arrive as `subscription.charged` webhook events, which extend `subscriptions.end_date` — no cron job needed. Turning off auto-renew (`/account/subscriptions`) cancels the Razorpay mandate but leaves current access untouched until `end_date`.

## Known simplifications (given the scope of the full spec)

- **Archive filters**: year is a free-text field rather than a derived dropdown; volume filtering isn't exposed in the archive UI (the API supports it via `volumeId`).
- **Special edition / submission-publish forms**: take a raw Volume ID / Slot ID (copy from the admin Years & Volumes page URL) rather than a cascading picker.
- **Cart checkout**: each cart line is paid via its own Razorpay Checkout (the plan's `create-order` API is one-order-per-item); a coupon entered at checkout applies to the first item paid.
- **Sentry**: the monitoring wrapper exists and is env-gated, but `@sentry/nextjs` itself isn't installed — add it and fill in `lib/adapters/monitoring.ts` when you're ready to turn it on.

## Deployment

Standard Next.js app — no native binaries required, so it deploys on Vercel serverless as-is. Set every `.env.local` var in your host's environment config, point `NEXT_PUBLIC_APP_URL` at your real domain, and use live Razorpay keys once tested.
