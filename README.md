# AgroVista Monthly — Secure Pay-Per-Issue E-Magazine

A monthly agriculture e-magazine site where readers:

1. **Sign in with just their email** (magic link — no passwords).
2. **Pay once per issue via Razorpay** to unlock it, permanently, under that email.
3. **Read it online in a protected viewer** — the PDF is never downloadable or
   directly linkable; pages are streamed as individually watermarked images.
4. Can sign back in with the **same email on any device** later and still see
   everything they've purchased — access is tied to the email, not a device
   or browser.

This is a real client + server application (not a static site) because
payments and access control have to be enforced server-side to mean anything.

---

## ⚠️ Please read: what "protected" actually means here

You asked for the PDF to not be downloadable, not viewable without payment,
and not copyable. Here's exactly what this build does, and where the honest
limits are:

**What's enforced (hard to bypass):**
- The original PDF file is **never sent to the browser** at all — not even
  to a paying reader. It lives only on the server.
- What the reader's browser receives is a **freshly rendered PNG image of
  one page at a time**, requested from an endpoint that checks (a) they're
  logged in and (b) they've paid for that specific issue, on every single
  request.
- Every page image is **watermarked server-side, baked into the pixels**,
  with the viewer's email + timestamp — so a leaked screenshot is traceable
  to the account that produced it.
- Right-click, drag-to-save, Ctrl+S/P, and printing are disabled in the
  viewer.
- Nothing is cached (`Cache-Control: no-store`), and images are served
  `inline`, never as an attachment.

**What is NOT possible for anyone to guarantee, on the web, ever:**
- Stopping a **screenshot or a phone photo of the screen**. If content is
  visible on a screen, it can be captured by the device showing it. No
  magazine, newspaper, or DRM'd e-book platform (including Kindle, Adobe
  DRM, etc.) can truly prevent this either — they rely on the same
  deterrents used here (no download, watermarking, disabled shortcuts) plus
  legal terms of use.
- Fully blocking browser dev tools or automated scripts from a technically
  determined user. The deterrents here (disabling right-click/shortcuts)
  stop casual copying, not a determined technical attacker.

If your priority is legal enforceability rather than technical prevention,
pair this with clear **Terms of Service** stating the content is licensed
for personal viewing only and watermarking (already included) so leaks are
traceable.

---

## Project structure

```
agrovista-secure/
├── server/                  ← Node.js/Express backend (run this)
│   ├── server.js            ← app entrypoint
│   ├── config.js            ← reads .env
│   ├── db.js                ← purchases store (simple JSON file; swap for real DB in prod)
│   ├── middleware/auth.js   ← session cookie (JWT) verification
│   ├── routes/
│   │   ├── auth.js          ← magic-link request + verify + /me + logout
│   │   ├── issues.js        ← issue metadata (never exposes the PDF path)
│   │   ├── payments.js      ← Razorpay order creation, verification, webhook
│   │   └── viewer.js        ← the protected page-image endpoint
│   ├── services/
│   │   ├── email.js         ← sends the magic link (nodemailer)
│   │   ├── razorpay.js      ← Razorpay order + signature verification
│   │   └── pdfRender.js     ← PDF → watermarked page images (poppler + sharp)
│   ├── data/
│   │   ├── issues.json      ← your issue catalog (title, price, category, etc.)
│   │   └── source-pdfs/     ← put your REAL PDF files here (never served directly)
│   ├── cache/                (auto-generated rendered page images; safe to delete)
│   ├── scripts/prerender.js ← pre-warms the image cache for every issue
│   ├── package.json
│   └── .env.example         ← copy to .env and fill in
└── public/                  ← the front-end (served by the same server)
    ├── index.html, archive.html, issue.html   (browse & buy)
    ├── login.html, auth-callback.html          (email magic-link flow)
    ├── viewer.html                              (the protected reader)
    ├── css/, js/, fonts/, images/
```

## 1. Prerequisites

- **Node.js 18+**
- **poppler-utils** installed on the server (provides `pdftoppm`, used to
  turn PDF pages into images):
  - Ubuntu/Debian: `sudo apt-get install poppler-utils`
  - macOS: `brew install poppler`
  - Most cloud hosts (Render, Railway, a VPS, Docker) can install this with
    one line in their build step / Dockerfile.
- A **Razorpay account** (test mode is fine to start): https://dashboard.razorpay.com
- An **SMTP account** to send the login email (Gmail app password, SendGrid,
  Postmark, Amazon SES, Mailgun — any standard SMTP works). In development,
  if you skip this, the magic link is just printed to your terminal (and
  shown on the login page) so you can still test everything end-to-end.

## 2. Install & configure

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:

- `BASE_URL` — where this app is reachable (e.g. `http://localhost:4000` for
  local dev, or `https://magazine.yourdomain.com` in production).
- `JWT_SECRET` — generate one with `openssl rand -hex 32`.
- `SMTP_*` — your email provider's credentials.
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — from Razorpay Dashboard →
  Settings → API Keys. Use the `rzp_test_...` keys while developing.
- `RAZORPAY_WEBHOOK_SECRET` — see step 4 below.

## 3. Add your real issues

Two things per issue:

1. **Metadata** — edit `server/data/issues.json`. Each entry looks like:
   ```json
   {
     "id": "v3-i10-2026-10",
     "year": 2026, "volume": 3, "issueNumber": 10,
     "month": "October",
     "title": "Your Real Article Title",
     "category": "Technology",
     "summary": "One or two sentences shown on cards.",
     "cover": "images/covers/2026-10.jpg",
     "price": 49,
     "pages": 72,
     "fileSize": "—",
     "sourcePdf": "source-pdfs/v3-i10-2026-10.pdf",
     "toc": ["Article 1", "Article 2", "Article 3"]
   }
   ```
2. **The real PDF file** — drop it in `server/data/source-pdfs/`, named
   exactly what `sourcePdf` says.

Cover images referenced from `public/images/covers/` should be placed there
(the starter kit ships with 33 sample issues using placeholder covers from
placehold.co and tiny sample PDFs so you can test the whole flow immediately
— replace both before going live).

Run this any time after adding new PDFs so the first reader doesn't wait for
conversion:

```bash
npm run prerender
```

## 4. Configure Razorpay webhook (important — do this)

The browser calls `/api/payments/verify` right after checkout, but if the
browser closes/crashes before that finishes, you'd otherwise lose the sale.
The webhook is the authoritative backup confirmation:

1. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**.
2. URL: `https://YOUR_DOMAIN/api/payments/webhook`
3. Active events: check **`payment.captured`**.
4. Copy the **Webhook Secret** it gives you into `.env` as
   `RAZORPAY_WEBHOOK_SECRET`.

## 5. Run it

```bash
cd server
npm start
```

Visit `http://localhost:4000`. In dev mode (no SMTP configured) the login
page will show the magic link directly on-screen so you don't need real
email to test.

## 6. Deploy

This is a normal Node.js app — deploy it anywhere that runs Node (a VPS,
Render, Railway, Fly.io, etc.), as long as `poppler-utils` is installed on
that machine (add it to your Dockerfile / build script). Point your domain's
DNS at it, set `BASE_URL` to the real HTTPS URL, and switch Razorpay to live
keys once you've tested with test keys.

**Production checklist:**
- Serve over **HTTPS** (required for secure cookies and by Razorpay live mode).
- Set `NODE_ENV=production` so session cookies get the `secure` flag.
- Swap `server/db.js`'s JSON-file storage for a real database (Postgres,
  MySQL, etc.) once you expect concurrent traffic at scale — the function
  signatures in that file are the only thing to reimplement.
- Take regular backups of `server/data/purchases.json` (or your real DB) —
  it's the only record of who has paid for what.

## How the pieces fit together (quick tour)

- **Sign in:** `login.html` → `POST /api/auth/request-link` → emails a
  15-minute JWT link → `auth-callback.html` → `GET /api/auth/verify` → sets
  an httpOnly session cookie good for 180 days → redirected back to where
  they started.
- **Buy an issue:** "Unlock & Read" button → `POST /api/payments/create-order`
  (requires login; ties the order to that email) → Razorpay Checkout modal
  opens → on success, `POST /api/payments/verify` checks the cryptographic
  signature → purchase recorded against the email → redirected to
  `viewer.html`. The webhook independently confirms the same payment
  server-to-server as a safety net.
- **Read an issue:** `viewer.html` → `GET /api/viewer/:id/meta` (401 if not
  logged in, 402 if not purchased) → then one `<img>` per page pointing at
  `GET /api/viewer/:id/page/:n`, each request re-checked against the
  session + purchase record, each response a watermarked PNG that's never
  cached or downloadable.
- **Return later, any device:** sign in again with the same email → the
  purchase record is keyed by email, not device/browser, so access follows
  the reader automatically.

## Customizing look & feel

All colors/fonts/spacing are CSS variables at the top of
`public/css/style.css` (`:root { ... }`) — change `--primary-color`,
`--custom-btn-bg-color`, etc. to re-theme the whole site from one place.
