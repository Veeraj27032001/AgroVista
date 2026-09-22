# AgroVista — Detailed Technical Planning

**Version:** 1.0  
**Date:** September 2026  
**Stack:** Next.js 14 + Supabase PostgreSQL + Supabase Storage + Razorpay + Custom JWT Auth  
**Hosting:** Vercel

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Folder Structure](#2-project-folder-structure)
3. [Database Schema](#3-database-schema)
4. [Supabase Storage Buckets](#4-supabase-storage-buckets)
5. [Authentication Flow](#5-authentication-flow)
6. [API Routes](#6-api-routes)
7. [Public Pages](#7-public-pages)
8. [Admin Pages](#8-admin-pages)
9. [Component Architecture](#9-component-architecture)
10. [Key Business Logic Flows](#10-key-business-logic-flows)
11. [Payment Flow (Razorpay)](#11-payment-flow-razorpay)
12. [Subscription Logic](#12-subscription-logic)
13. [Coupon Logic](#13-coupon-logic)
14. [Article Submission Flow](#14-article-submission-flow)
15. [Return and Refund Flow](#15-return-and-refund-flow)
16. [Environment Variables](#16-environment-variables)
17. [Deployment Plan](#17-deployment-plan)

---

## 1. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack React framework, deployed on Vercel |
| Language | TypeScript | Type safety across frontend and backend |
| Styling | Tailwind CSS | Utility-first CSS |
| Database | Supabase PostgreSQL | Primary relational database |
| DB Client | @supabase/supabase-js v2 | Server-side DB queries |
| Storage | Supabase Storage | PDFs, posters, Word files |
| Auth | Custom JWT (bcryptjs + jsonwebtoken) | Password hashing, session via HttpOnly cookie |
| Payment | Razorpay | Orders, subscriptions, refunds |
| Forms | react-hook-form | Form validation |
| Notifications | react-hot-toast | UI feedback toasts |
| Icons | lucide-react | Icon library |
| Date Utils | date-fns | Date calculations for subscriptions |
| Hosting | Vercel | Deployment and edge functions |

---

## 2. Project Folder Structure

```
agrovista/
├── app/
│   ├── layout.tsx                        # Root layout (font, toast provider)
│   ├── globals.css
│   │
│   ├── (public)/                         # Public-facing pages (no auth required to view)
│   │   ├── layout.tsx                    # Public layout (Navbar + Footer)
│   │   ├── page.tsx                      # Home — recently released issues
│   │   ├── archive/
│   │   │   └── page.tsx                  # Browse all issues with search + filters
│   │   ├── issues/
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Issue detail page
│   │   ├── special-editions/
│   │   │   └── page.tsx                  # Browse special editions
│   │   ├── subscribe/
│   │   │   └── page.tsx                  # Subscription plans listing
│   │   ├── cart/
│   │   │   └── page.tsx                  # Cart / Bag
│   │   ├── checkout/
│   │   │   └── page.tsx                  # Checkout with coupon + Razorpay
│   │   ├── login/
│   │   │   └── page.tsx                  # Sign in
│   │   ├── register/
│   │   │   └── page.tsx                  # Register with address fields
│   │   ├── submit-article/
│   │   │   └── page.tsx                  # Article submission form
│   │   └── account/
│   │       ├── layout.tsx                # Account sidebar layout
│   │       ├── page.tsx                  # Profile (view + edit)
│   │       ├── subscriptions/
│   │       │   └── page.tsx              # My active subscriptions
│   │       ├── purchases/
│   │       │   └── page.tsx              # Owned issues (one-time purchases)
│   │       ├── orders/
│   │       │   └── page.tsx              # Hard copy orders + status
│   │       ├── orders/
│   │       │   └── [id]/
│   │       │       └── return/
│   │       │           └── page.tsx      # Submit return request
│   │       └── submissions/
│   │           └── page.tsx              # My article submissions + status
│   │
│   ├── (admin)/                          # Admin panel (requires admin role)
│   │   ├── layout.tsx                    # Admin layout (sidebar + header)
│   │   └── admin/
│   │       ├── page.tsx                  # Dashboard (stats overview)
│   │       ├── years/
│   │       │   ├── page.tsx              # List publication years
│   │       │   └── [id]/
│   │       │       ├── page.tsx          # Year detail (volumes list)
│   │       │       └── volumes/
│   │       │           └── [volId]/
│   │       │               └── page.tsx  # Volume detail (issue slots list)
│   │       ├── issues/
│   │       │   ├── page.tsx              # All issues list
│   │       │   ├── new/
│   │       │   │   └── page.tsx          # Create / publish new issue
│   │       │   └── [id]/
│   │       │       └── page.tsx          # Edit issue
│   │       ├── special-editions/
│   │       │   ├── page.tsx              # All special editions
│   │       │   └── new/
│   │       │       └── page.tsx          # Create special edition
│   │       ├── plans/
│   │       │   ├── page.tsx              # Subscription plans list
│   │       │   └── new/
│   │       │       └── page.tsx          # Create plan
│   │       ├── subscriptions/
│   │       │   └── page.tsx              # All user subscriptions
│   │       ├── orders/
│   │       │   ├── page.tsx              # All hard copy orders
│   │       │   └── [id]/
│   │       │       └── page.tsx          # Order detail + status update
│   │       ├── returns/
│   │       │   ├── page.tsx              # Return requests list
│   │       │   └── [id]/
│   │       │       └── page.tsx          # Return detail + action
│   │       ├── coupons/
│   │       │   ├── page.tsx              # Coupons list
│   │       │   └── new/
│   │       │       └── page.tsx          # Create coupon
│   │       ├── submissions/
│   │       │   ├── page.tsx              # Article submissions list
│   │       │   └── [id]/
│   │       │       └── page.tsx          # Submission detail + review + publish
│   │       └── users/
│   │           └── page.tsx              # All registered users
│   │
│   └── api/                              # API Route Handlers (Next.js server)
│       ├── auth/
│       │   ├── register/route.ts
│       │   ├── login/route.ts
│       │   └── logout/route.ts
│       ├── me/
│       │   └── route.ts                  # GET current user
│       ├── profile/
│       │   └── route.ts                  # PATCH update profile
│       ├── issues/
│       │   ├── route.ts                  # GET published issues (public)
│       │   └── [id]/
│       │       └── route.ts              # GET single issue
│       ├── download/
│       │   └── [id]/
│       │       └── route.ts              # GET signed URL for PDF download
│       ├── cart/
│       │   └── route.ts                  # Cart stored client-side (localStorage)
│       ├── payment/
│       │   ├── create-order/route.ts     # POST create Razorpay order
│       │   └── verify/route.ts           # POST verify Razorpay payment
│       ├── subscriptions/
│       │   ├── route.ts                  # GET user subscriptions
│       │   └── upgrade/route.ts          # POST upgrade subscription
│       ├── orders/
│       │   ├── route.ts                  # GET user orders
│       │   └── [id]/
│       │       └── return/route.ts       # POST submit return request
│       ├── submissions/
│       │   ├── route.ts                  # POST submit article, GET my submissions
│       │   └── [id]/
│       │       └── resubmit/route.ts     # POST resubmit revised article
│       ├── coupons/
│       │   └── validate/route.ts         # POST validate coupon code
│       └── admin/
│           ├── years/
│           │   ├── route.ts              # GET list, POST create
│           │   └── [id]/route.ts         # PATCH, DELETE
│           ├── volumes/
│           │   ├── route.ts              # POST create
│           │   └── [id]/route.ts         # PATCH, DELETE
│           ├── slots/
│           │   ├── route.ts              # POST create
│           │   └── [id]/route.ts         # PATCH, DELETE
│           ├── issues/
│           │   ├── route.ts              # GET all, POST create
│           │   └── [id]/route.ts         # GET, PATCH, DELETE
│           ├── special-editions/
│           │   ├── route.ts              # GET all, POST create
│           │   └── [id]/route.ts         # PATCH, DELETE
│           ├── plans/
│           │   ├── route.ts              # GET all, POST create
│           │   └── [id]/route.ts         # PATCH, DELETE
│           ├── subscriptions/
│           │   └── route.ts              # GET all subscriptions
│           ├── orders/
│           │   ├── route.ts              # GET all orders
│           │   └── [id]/
│           │       └── status/route.ts   # PATCH update order status
│           ├── returns/
│           │   ├── route.ts              # GET all return requests
│           │   └── [id]/
│           │       └── action/route.ts   # POST reissue | refund | reject
│           ├── coupons/
│           │   ├── route.ts              # GET all, POST create
│           │   └── [id]/route.ts         # PATCH, DELETE
│           ├── submissions/
│           │   ├── route.ts              # GET all
│           │   └── [id]/
│           │       ├── review/route.ts   # POST send revision request
│           │       ├── accept/route.ts   # POST accept submission
│           │       ├── upload-edit/route.ts # POST upload admin-edited version
│           │       └── publish/route.ts  # POST publish as issue
│           └── users/
│               └── route.ts              # GET all users
│
├── components/
│   ├── ui/                               # Generic reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Spinner.tsx
│   │   ├── FileUpload.tsx
│   │   └── Pagination.tsx
│   ├── public/
│   │   ├── Navbar.tsx                    # Top nav with cart icon + login/account
│   │   ├── Footer.tsx
│   │   ├── IssueCard.tsx                 # Issue thumbnail card
│   │   ├── IssueGrid.tsx                 # Grid of IssueCards
│   │   ├── FormatSelector.tsx            # Soft / Hard / Both radio picker
│   │   ├── CouponInput.tsx               # Coupon code field + validate
│   │   ├── CartDrawer.tsx                # Slide-in cart panel
│   │   ├── PlanCard.tsx                  # Subscription plan card
│   │   └── SubscriptionBadge.tsx         # Shows user's active plan tag on issue
│   └── admin/
│       ├── AdminSidebar.tsx
│       ├── AdminHeader.tsx
│       ├── StatCard.tsx                  # Dashboard stat tiles
│       ├── StatusBadge.tsx               # Order / return / submission status chip
│       ├── IssueForm.tsx                 # Shared form for create/edit issue
│       ├── PlanForm.tsx
│       ├── CouponForm.tsx
│       ├── YearVolumeTree.tsx            # Year > Volume > Slot tree view
│       └── OrderStatusSelect.tsx
│
├── lib/
│   ├── supabase.ts                       # Supabase server client (service role)
│   ├── supabase-browser.ts               # Supabase browser client (anon key)
│   ├── auth.ts                           # JWT sign/verify, cookie helpers
│   ├── razorpay.ts                       # Razorpay client, createOrder, verifySignature, createRefund
│   ├── storage.ts                        # Supabase Storage: upload, getSignedUrl, delete
│   ├── subscription.ts                   # Subscription access check helpers
│   └── types.ts                          # All shared TypeScript interfaces and types
│
├── middleware.ts                         # Route protection (admin routes, auth routes)
├── supabase/
│   └── schema.sql                        # Full database schema with indexes
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Database Schema

### 3.1 `users`

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone         TEXT,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  pincode       TEXT,
  role          TEXT NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.2 `publication_years`

```sql
CREATE TABLE publication_years (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year       INTEGER UNIQUE NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.3 `volumes`

```sql
CREATE TABLE volumes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id       UUID NOT NULL REFERENCES publication_years(id) ON DELETE CASCADE,
  volume_number INTEGER NOT NULL,
  name          TEXT,
  quarter       TEXT CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  start_month   INTEGER CHECK (start_month BETWEEN 1 AND 12),
  end_month     INTEGER CHECK (end_month BETWEEN 1 AND 12),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (year_id, volume_number)
);
```

### 3.4 `issue_slots`

```sql
CREATE TABLE issue_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volume_id    UUID NOT NULL REFERENCES volumes(id) ON DELETE CASCADE,
  slot_number  INTEGER NOT NULL,
  month        INTEGER CHECK (month BETWEEN 1 AND 12),
  issue_type   TEXT NOT NULL DEFAULT 'monthly'
                 CHECK (issue_type IN ('monthly', 'weekly')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (volume_id, slot_number)
);
```

### 3.5 `issues`

```sql
CREATE TABLE issues (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id             UUID REFERENCES issue_slots(id) ON DELETE SET NULL,
  volume_id           UUID REFERENCES volumes(id) ON DELETE SET NULL,
  is_special_edition  BOOLEAN NOT NULL DEFAULT FALSE,
  title               TEXT NOT NULL,
  description         TEXT,
  language            TEXT NOT NULL DEFAULT 'English',
  poster_url          TEXT,
  pdf_storage_path    TEXT,             -- Supabase Storage path (not public URL)
  soft_copy_rate      NUMERIC(10,2),
  hard_copy_rate      NUMERIC(10,2),
  both_rate           NUMERIC(10,2),
  coupon_applicable   BOOLEAN NOT NULL DEFAULT TRUE,
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published')),
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- For regular issues: slot_id is set, is_special_edition = false
-- For special editions: volume_id is set, slot_id is null, is_special_edition = true
```

### 3.6 `subscription_plans`

```sql
CREATE TABLE subscription_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  format            TEXT NOT NULL CHECK (format IN ('soft','hard','both')),
  duration_months   INTEGER NOT NULL,
  duration_label    TEXT NOT NULL,  -- 'Quarterly', 'Half Yearly', 'Yearly', '2 Year', '5 Year'
  price             NUMERIC(10,2) NOT NULL,
  coupon_applicable BOOLEAN NOT NULL DEFAULT TRUE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.7 `subscriptions`

```sql
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id               UUID NOT NULL REFERENCES subscription_plans(id),
  format                TEXT NOT NULL CHECK (format IN ('soft','hard','both')),
  start_date            DATE NOT NULL,
  end_date              DATE NOT NULL,
  amount_paid           NUMERIC(10,2) NOT NULL,
  coupon_id             UUID REFERENCES coupons(id),
  coupon_discount       NUMERIC(10,2) DEFAULT 0,
  razorpay_order_id     TEXT,
  razorpay_payment_id   TEXT,
  razorpay_sub_id       TEXT,          -- For auto-renewal tracking
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','active','expired','cancelled')),
  auto_renew            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.8 `issue_orders` (one-time purchases)

```sql
CREATE TABLE issue_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issue_id            UUID NOT NULL REFERENCES issues(id),
  format              TEXT NOT NULL CHECK (format IN ('soft','hard','both')),
  amount              NUMERIC(10,2) NOT NULL,
  coupon_id           UUID REFERENCES coupons(id),
  coupon_discount     NUMERIC(10,2) DEFAULT 0,
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  delivery_name       TEXT,
  delivery_address    TEXT,
  delivery_city       TEXT,
  delivery_state      TEXT,
  delivery_pincode    TEXT,
  delivery_phone      TEXT,
  order_status        TEXT NOT NULL DEFAULT 'pending'
                        CHECK (order_status IN (
                          'pending','processing',
                          'out_for_delivery','delivered',
                          'return_requested','returned',
                          'refund_initiated','refund_processing',
                          'refund_completed','refund_failed',
                          'reissue_initiated','new_copy_dispatched',
                          'reissue_delivered'
                        )),
  payment_status      TEXT NOT NULL DEFAULT 'pending'
                        CHECK (payment_status IN ('pending','paid','failed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.9 `return_requests`

```sql
CREATE TABLE return_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES issue_orders(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  reason          TEXT NOT NULL,
  admin_action    TEXT CHECK (admin_action IN ('reissue','refund','reject')),
  admin_note      TEXT,
  refund_amount   NUMERIC(10,2),
  razorpay_refund_id TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','reviewed','actioned')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actioned_at     TIMESTAMPTZ
);
```

### 3.10 `cart_items` (server-side optional; can use localStorage on client)

```sql
-- Option A: Store in DB for cross-device persistence
CREATE TABLE cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issue_id   UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  format     TEXT NOT NULL CHECK (format IN ('soft','hard','both')),
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, issue_id)
);
```

### 3.11 `coupons`

```sql
CREATE TABLE coupons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT UNIQUE NOT NULL,
  discount_type    TEXT NOT NULL CHECK (discount_type IN ('flat','percent')),
  discount_value   NUMERIC(10,2) NOT NULL,
  subscription_usage_type TEXT CHECK (subscription_usage_type IN ('one_time','recurring')),
  -- NULL means applies to issue one-time purchases only
  expiry_date      DATE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.12 `coupon_usages`

```sql
CREATE TABLE coupon_usages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   UUID NOT NULL REFERENCES coupons(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  order_id    UUID REFERENCES issue_orders(id),
  sub_id      UUID REFERENCES subscriptions(id),
  used_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Used to enforce one-time-per-user rule for issue coupons
```

### 3.13 `article_submissions`

```sql
CREATE TABLE article_submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  language    TEXT NOT NULL DEFAULT 'English',
  status      TEXT NOT NULL DEFAULT 'submitted'
                CHECK (status IN (
                  'submitted','under_review',
                  'revision_requested','resubmitted',
                  'accepted'
                )),
  admin_note  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.14 `submission_versions`

```sql
CREATE TABLE submission_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES article_submissions(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  word_path       TEXT NOT NULL,    -- Supabase Storage path
  pdf_path        TEXT NOT NULL,    -- Supabase Storage path
  submitted_by    TEXT NOT NULL CHECK (submitted_by IN ('user','admin')),
  is_admin_edit   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- submitted_by = 'admin' + is_admin_edit = true → internal edited copy visible to admin only
```

### 3.15 Key Indexes

```sql
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_slot_id ON issues(slot_id);
CREATE INDEX idx_issues_volume_id ON issues(volume_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_issue_orders_user_id ON issue_orders(user_id);
CREATE INDEX idx_issue_orders_status ON issue_orders(order_status);
CREATE INDEX idx_submissions_user_id ON article_submissions(user_id);
CREATE INDEX idx_submissions_status ON article_submissions(status);
CREATE INDEX idx_coupon_usages_user_coupon ON coupon_usages(user_id, coupon_id);
```

---

## 4. Supabase Storage Buckets

| Bucket Name | Access | Contents |
|---|---|---|
| `issue-posters` | Public | Cover/poster images for issues |
| `issue-pdfs` | Private | PDF files — accessed via signed URL only |
| `submission-files` | Private | User-submitted Word + PDF files |
| `admin-edits` | Private | Admin-uploaded edited versions (admin-only) |

**Signed URL Strategy for PDFs:**
- On download request, backend verifies user has paid access
- Backend generates a short-lived signed URL (15 minutes) from Supabase Storage
- URL returned to frontend for download — never the raw storage path

---

## 5. Authentication Flow

### 5.1 Registration
```
POST /api/auth/register
Body: { name, email, password, phone, address, city, state, pincode }

1. Check email not already taken
2. Hash password with bcrypt (rounds: 12)
3. Insert into users table with role = 'user'
4. Sign JWT: { userId, email, role, exp: 7d }
5. Set HttpOnly cookie: agrovista_session = <token>
6. Return: { user: { id, name, email, role } }
```

### 5.2 Login
```
POST /api/auth/login
Body: { email, password }

1. Find user by email
2. Compare password with bcrypt.compare()
3. Sign JWT and set HttpOnly cookie
4. Return: { user: { id, name, email, role } }
```

### 5.3 Logout
```
POST /api/auth/logout
1. Clear agrovista_session cookie
```

### 5.4 Middleware Protection
```
middleware.ts intercepts:
  /admin/*       → require role = 'admin'
  /account/*     → require role = 'user' or 'admin'
  /checkout/*    → require authenticated user
  /submit-article → require authenticated user

On fail → redirect to /login
```

### 5.5 JWT Payload Structure
```typescript
{
  userId: string,
  email: string,
  role: 'user' | 'admin',
  iat: number,
  exp: number   // 7 days
}
```

---

## 6. API Routes

### 6.1 Public Auth Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out (clear cookie) |
| GET | `/api/me` | Get current user from cookie |
| PATCH | `/api/profile` | Update user profile |

### 6.2 Public Issue Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/issues` | List published issues (with filters: year, volume, language, search, page) |
| GET | `/api/issues/[id]` | Get single issue detail |
| GET | `/api/download/[id]` | Get signed PDF URL (requires purchase/subscription check) |

### 6.3 Payment Routes

| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/api/payment/create-order` | `{ type, itemId, format, couponCode }` | Create Razorpay order |
| POST | `/api/payment/verify` | `{ orderId, paymentId, signature, type, ... }` | Verify and record payment |

### 6.4 Subscription Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/subscriptions` | Get current user's subscriptions |
| POST | `/api/subscriptions/upgrade` | Upgrade plan (pay difference) |

### 6.5 Order Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/orders` | Get current user's orders |
| POST | `/api/orders/[id]/return` | Submit return request |

### 6.6 Article Submission Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/submissions` | Submit new article (multipart: title, desc, lang, word file, pdf file) |
| GET | `/api/submissions` | Get my submissions |
| POST | `/api/submissions/[id]/resubmit` | Resubmit revised files |

### 6.7 Coupon Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/coupons/validate` | Validate coupon for given item type and user |

### 6.8 Admin Routes

| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/admin/years` | List / Create publication years |
| PATCH/DELETE | `/api/admin/years/[id]` | Update / Delete year |
| GET/POST | `/api/admin/volumes` | List / Create volumes |
| PATCH/DELETE | `/api/admin/volumes/[id]` | Update / Delete volume |
| GET/POST | `/api/admin/slots` | List / Create issue slots |
| GET/POST | `/api/admin/issues` | List / Create issues |
| PATCH/DELETE | `/api/admin/issues/[id]` | Update / Delete issue |
| GET/POST | `/api/admin/special-editions` | List / Create special editions |
| GET/POST | `/api/admin/plans` | List / Create subscription plans |
| PATCH/DELETE | `/api/admin/plans/[id]` | Update / Delete plan |
| GET | `/api/admin/subscriptions` | List all subscriptions |
| GET | `/api/admin/orders` | List all orders (filter by status) |
| PATCH | `/api/admin/orders/[id]/status` | Update order status |
| GET | `/api/admin/returns` | List return requests |
| POST | `/api/admin/returns/[id]/action` | Action: reissue / refund / reject |
| GET/POST | `/api/admin/coupons` | List / Create coupons |
| PATCH/DELETE | `/api/admin/coupons/[id]` | Update / Delete coupon |
| GET | `/api/admin/submissions` | List all article submissions |
| POST | `/api/admin/submissions/[id]/review` | Send revision request |
| POST | `/api/admin/submissions/[id]/accept` | Accept submission |
| POST | `/api/admin/submissions/[id]/upload-edit` | Upload admin-edited version |
| POST | `/api/admin/submissions/[id]/publish` | Publish as issue |
| GET | `/api/admin/users` | List all users |

---

## 7. Public Pages

### 7.1 Home (`/`)
- Hero banner (latest issue)
- Recently published issues grid (last 6)
- Call to action: Subscribe Now
- Featured subscription plans section

### 7.2 Archive (`/archive`)
- Search bar (title / keyword)
- Filters: Year, Volume, Language
- Paginated grid of all published issues and special editions
- Each card shows: cover image, title, volume/issue number, language, price options

### 7.3 Issue Detail (`/issues/[id]`)
- Cover image, title, description, language
- Volume / Issue info
- Pricing: Soft / Hard / Both (radio select)
- Add to Cart button
- Buy Now (single click checkout) button
- If user already owns: Show Download PDF / Order Placed badge
- If user has active subscription covering this issue: Show Access PDF button

### 7.4 Subscribe (`/subscribe`)
- Grid of all active subscription plans
- Grouped by format (Soft / Hard / Both)
- Each plan shows: duration, price, what's included
- Subscribe button → checkout

### 7.5 Cart (`/cart`)
- List of items in cart
- Format selected per item
- Coupon code field
- Price breakdown: subtotal, discount, total
- Proceed to Payment button

### 7.6 Checkout (`/checkout`)
- Order summary
- Razorpay payment modal
- Hard copy: shows registered delivery address with option to confirm

### 7.7 Login (`/login`)
- Email + Password form
- Link to Register

### 7.8 Register (`/register`)
- All registration fields
- Name, Email, Password, Confirm Password, Phone, Address, City, State, Pincode

### 7.9 Submit Article (`/submit-article`)
- Title, Description, Language
- Upload Word file
- Upload PDF file
- Submit button

### 7.10 My Account — Profile (`/account`)
- View and edit: Name, Phone, Address, City, State, Pincode

### 7.11 My Account — Subscriptions (`/account/subscriptions`)
- Active subscriptions with plan details, format, start/end date
- Renew button (if near expiry)
- Upgrade button
- Auto-renew toggle

### 7.12 My Account — Purchases (`/account/purchases`)
- All one-time purchased issues
- Download PDF button (soft copy)
- Order status badge (hard copy)

### 7.13 My Account — Orders (`/account/orders`)
- All hard copy orders
- Status chip per order
- Request Return button (visible only when status = Delivered)

### 7.14 My Account — Submissions (`/account/submissions`)
- List of submitted articles with status
- View admin review note
- Resubmit button (when status = Revision Requested)

---

## 8. Admin Pages

### 8.1 Dashboard (`/admin`)
- Stat cards: Total Users, Active Subscriptions, Pending Orders, Open Returns, Pending Submissions, Monthly Revenue
- Recent orders table
- Recent submissions table

### 8.2 Year Configuration (`/admin/years`)
- List publication years
- Create new year
- Click year → view volumes

### 8.3 Volume Detail (`/admin/years/[id]/volumes/[volId]`)
- Volume info (quarter, months)
- List issue slots
- Add issue slot
- Status of each slot: Empty / Draft / Published
- Publish issue into slot button

### 8.4 Issues (`/admin/issues`)
- All issues table: title, volume, issue number, language, status, rates
- Create New Issue button
- Edit / Delete per row

### 8.5 Create / Edit Issue (`/admin/issues/new` and `/admin/issues/[id]`)
- Select Year → Volume → Issue Slot
- Title, Description, Language
- Upload Poster
- Upload PDF
- Set Soft / Hard / Both rates
- Coupon Applicable toggle
- Draft / Publish toggle

### 8.6 Special Editions (`/admin/special-editions`)
- Same form as issue but linked to Volume only (no slot)

### 8.7 Subscription Plans (`/admin/plans`)
- Table of all plans
- Create plan: format, duration label, duration months, price, coupon applicable

### 8.8 All Subscriptions (`/admin/subscriptions`)
- Table: user, plan, format, start, end, status, auto-renew
- Filter by status

### 8.9 Orders (`/admin/orders`)
- Table: user, issue, format, amount, address, status, date
- Filter by status
- Click order → update status

### 8.10 Return Requests (`/admin/returns`)
- Table: user, order, reason, date, status
- Click request → view detail
- Action buttons: Reissue / Refund / Reject
- Reject: requires reason input
- Refund: shows refund amount input

### 8.11 Coupons (`/admin/coupons`)
- Table: code, type, value, usage type, expiry, active
- Create coupon form
- Toggle active/inactive

### 8.12 Article Submissions (`/admin/submissions`)
- Table: user, title, language, status, date
- Filter by status
- Click submission → view detail

### 8.13 Submission Detail (`/admin/submissions/[id]`)
- Article info + version history (all Word + PDF versions)
- Current status
- Send Revision Request (with comment)
- Accept Submission button
- After accept: Upload Admin Edited Version (Word + PDF) — admin-only
- Publish as Issue button (opens issue form pre-filled with article data)

### 8.14 Users (`/admin/users`)
- Table: name, email, phone, city, role, joined date
- Search by name/email

---

## 9. Component Architecture

### 9.1 Shared UI Primitives (`components/ui/`)

| Component | Props |
|---|---|
| `Button` | variant (primary/secondary/danger), size, loading, disabled |
| `Input` | label, error, register (react-hook-form) |
| `Select` | label, options, error |
| `Textarea` | label, rows, error |
| `Badge` | color, label |
| `Modal` | isOpen, onClose, title, children |
| `Table` | columns, data, loading |
| `Spinner` | size |
| `FileUpload` | accept, label, onChange, current file name |
| `Pagination` | page, totalPages, onChange |

### 9.2 Public Components (`components/public/`)

**IssueCard:**
- Shows cover image, title, volume+issue tag, language badge, price range
- Quick-add to cart button

**FormatSelector:**
- Radio group: Soft Copy (₹XX) / Hard Copy (₹XX) / Both (₹XX)
- Disabled options shown greyed if not available

**CartDrawer:**
- Slide-in panel from right
- Lists cart items with format selector per item
- Remove button per item
- Subtotal + Proceed to Checkout

**CouponInput:**
- Text field + Apply button
- Shows discount amount when valid
- Error message when invalid/expired

**PlanCard:**
- Plan name, format badge, duration, price
- Subscribe button

### 9.3 Admin Components (`components/admin/`)

**YearVolumeTree:**
- Collapsible tree: Year > Volume > Slots
- Each slot shows status chip and Edit/Publish button

**IssueForm:**
- Reused for create and edit
- Dynamic slot selector (Year → Volume → Slot dropdowns)
- File upload for poster and PDF
- Rate fields, coupon toggle, status toggle

**StatusBadge:**
- Color-coded chip for all order/return/submission statuses

**StatCard:**
- Dashboard tile with label, value, optional trend

---

## 10. Key Business Logic Flows

### 10.1 PDF Access Check
```
GET /api/download/[issueId]

1. Verify user is authenticated
2. Check issue_orders where user_id = me AND issue_id = X AND format IN ('soft','both') AND payment_status = 'paid'
3. OR check subscriptions where user_id = me AND status = 'active'
     AND start_date <= issue.published_at <= end_date
     AND format IN ('soft','both')
4. If access granted → generate Supabase signed URL (15 min TTL) → return URL
5. If no access → return 403 Forbidden
```

### 10.2 Subscription Issue Auto-Delivery
```
When admin publishes an issue (status: draft → published):

1. Find all active subscriptions where:
   - status = 'active'
   - start_date <= NOW() <= end_date
   - format IN ('soft','hard','both')

2. For each soft/both subscription holder:
   - No action needed: access is automatic via the PDF Access Check above

3. For each hard/both subscription holder:
   - Automatically create an issue_order record:
     - user_id = subscriber
     - issue_id = newly published issue
     - format = 'hard' (or 'both' if both subscriber)
     - payment_status = 'paid' (covered by subscription)
     - order_status = 'pending'
     - delivery_* = copied from user's profile
```

### 10.3 Subscription Upgrade (Pro-Rata)
```
POST /api/subscriptions/upgrade

1. Get current active subscription: remaining_days, amount_paid, total_days
2. Calculate unused value: (remaining_days / total_days) * amount_paid
3. New plan price - unused value = amount_to_pay
4. Create Razorpay order for amount_to_pay
5. On payment success:
   - Cancel old subscription (status = 'cancelled')
   - Create new subscription starting today
```

---

## 11. Payment Flow (Razorpay)

### 11.1 One-Time Issue Purchase

```
Frontend                          Backend                         Razorpay
   |                                 |                               |
   |-- POST /api/payment/create-order-->|                           |
   |   { type:'issue', issueId, format, couponCode }               |
   |                                 |-- createOrder(amount) ------>|
   |                                 |<-- { orderId }               |
   |<-- { orderId, amount, key_id } --|                             |
   |                                 |                               |
   |-- Open Razorpay Checkout modal -------------------------------->|
   |<-- { paymentId, orderId, signature } <--------------------------|
   |                                 |                               |
   |-- POST /api/payment/verify ----->|                             |
   |   { paymentId, orderId, signature, type, issueId, format }     |
   |                                 |-- verifySignature()          |
   |                                 |-- INSERT issue_orders (paid) |
   |                                 |-- UPDATE coupon_usages       |
   |<-- { success, orderId } ---------|                             |
```

### 11.2 Subscription Purchase

Same flow but:
- `type: 'subscription'`
- On verify success: INSERT subscriptions (status = 'active')
- Record coupon_usage if coupon applied

### 11.3 Refund

```
Admin actions refund → POST /api/admin/returns/[id]/action
Body: { action: 'refund', refundAmount }

1. Find razorpay_payment_id from original issue_order
2. Call Razorpay Refund API: razorpay.payments.refund(paymentId, { amount })
3. Store razorpay_refund_id in return_requests
4. Update order_status = 'refund_initiated'
5. Webhook or polling updates to 'refund_completed' or 'refund_failed'
```

---

## 12. Subscription Logic

### 12.1 Duration to Months Mapping

| Label | Months |
|---|---|
| Quarterly | 3 |
| Half Yearly | 6 |
| Yearly | 12 |
| 2 Year | 24 |
| 5 Year | 60 |

### 12.2 Access Rule
User can access issue PDF if:
- `subscription.start_date <= issue.published_at <= subscription.end_date`
- AND `subscription.status = 'active'`
- AND `subscription.format IN ('soft','both')`

### 12.3 Auto-Renewal
- Before subscription end_date, a scheduled check (Vercel Cron Job, daily) identifies subscriptions expiring within 3 days
- Create a Razorpay order for renewal amount
- On payment: extend end_date by duration_months
- If recurring coupon attached: apply again
- If payment fails: notify user, set status = 'expired' after grace period

---

## 13. Coupon Logic

### 13.1 Validation Steps
```
POST /api/coupons/validate
Body: { code, itemType: 'issue' | 'subscription', itemId }

1. Find coupon by code where is_active = true
2. Check expiry_date >= TODAY
3. Check item (issue or plan) has coupon_applicable = true
4. For issue purchase: check coupon_usages where user_id = me AND coupon_id = X → must be 0
5. For subscription one_time: same check
6. For subscription recurring: always valid (applied each renewal)
7. Calculate discount:
   - flat: min(discount_value, item_price)
   - percent: (discount_value / 100) * item_price
8. Return: { valid: true, discountAmount, finalPrice }
```

---

## 14. Article Submission Flow

```
1. User fills form → uploads Word + PDF → POST /api/submissions
2. Files stored in Supabase Storage: submission-files/{submissionId}/v1/
3. submission_versions row created: version_number=1, submitted_by='user'
4. article_submissions status = 'submitted'

5. Admin reviews → POST /api/admin/submissions/[id]/review
   - Stores admin_note, sets status = 'revision_requested'
   - User sees note in My Account > Submissions

6. User resubmits → POST /api/submissions/[id]/resubmit
   - New files stored: submission-files/{submissionId}/v2/
   - New submission_versions row: version_number=2
   - Status = 'resubmitted'

7. Admin accepts → POST /api/admin/submissions/[id]/accept
   - Status = 'accepted'

8. Admin uploads edited version → POST /api/admin/submissions/[id]/upload-edit
   - Files stored: admin-edits/{submissionId}/
   - submission_versions row: is_admin_edit=true, submitted_by='admin'
   - Visible to admin only

9. Admin publishes → POST /api/admin/submissions/[id]/publish
   - Body: { slotId, posterUrl, softRate, hardRate, bothRate, language }
   - Creates issue record linked to slot
   - pdf_storage_path = admin's edited PDF path
```

---

## 15. Return and Refund Flow

```
1. User views delivered order → clicks "Request Return"
2. POST /api/orders/[id]/return { reason }
   - Validates: order must be delivered + format includes 'hard'
   - Creates return_requests row: status = 'pending'
   - Updates order_status = 'return_requested'

3. Admin sees request in Returns panel
4. Admin chooses action:

   REJECT:
   - POST /api/admin/returns/[id]/action { action:'reject', adminNote }
   - return_requests: admin_action='reject', status='actioned'
   - order_status = 'delivered' (unchanged)
   - User notified via status update

   REISSUE:
   - POST /api/admin/returns/[id]/action { action:'reissue' }
   - return_requests: admin_action='reissue', status='actioned'
   - order_status = 'reissue_initiated'
   - Admin then updates: 'new_copy_dispatched' → 'reissue_delivered'

   REFUND:
   - POST /api/admin/returns/[id]/action { action:'refund', refundAmount }
   - Call Razorpay refund API
   - return_requests: razorpay_refund_id stored
   - order_status: 'refund_initiated' → 'refund_processing' → 'refund_completed'
```

---

## 16. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx          # Server-side only, never exposed to client

# Custom Auth
JWT_SECRET=your_random_secret_min_32_chars
JWT_EXPIRY_DAYS=7

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxx   # Exposed to client for checkout

# App
NEXT_PUBLIC_APP_URL=https://agrovista.vercel.app
NODE_ENV=production
```

---

## 17. Deployment Plan

### 17.1 Prerequisites
1. Supabase project created
2. Run `supabase/schema.sql` in Supabase SQL editor
3. Create Storage buckets: `issue-posters` (public), `issue-pdfs` (private), `submission-files` (private), `admin-edits` (private)
4. Seed admin user manually in `users` table with role = 'admin'
5. Razorpay account configured (test mode first, then live)

### 17.2 Vercel Deployment
1. Push code to GitHub repository
2. Connect GitHub repo to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy (auto on push to main)
5. Set up Vercel Cron Job for subscription auto-renewal check: `0 2 * * *` (daily at 2 AM)

### 17.3 Vercel Cron Job (subscription renewal)
- File: `app/api/cron/renew-subscriptions/route.ts`
- Runs daily, checks expiring subscriptions, triggers Razorpay orders
- Protected with `CRON_SECRET` header check

### 17.4 Phase Order
| Phase | Scope |
|---|---|
| Phase 1 | Auth + DB setup + Admin year/volume/issue management |
| Phase 2 | Public browse pages + Cart + Razorpay one-time purchase |
| Phase 3 | Subscription plans + purchase + access control |
| Phase 4 | Hard copy order management + return/refund flow |
| Phase 5 | Coupons + discount logic |
| Phase 6 | Article submission system |
| Phase 7 | Auto-renewal cron + final QA |
