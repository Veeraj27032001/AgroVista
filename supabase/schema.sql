-- AgroVista — full schema. Run once in the Supabase SQL editor.
-- All application access goes through this app's server code using the
-- service_role key, which bypasses RLS — so RLS is enabled with NO policies,
-- meaning the anon/publishable key can never read or write these tables.

create extension if not exists pgcrypto;

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text unique not null,
  password_hash text not null,
  phone         text,
  address       text,
  city          text,
  state         text,
  pincode       text,
  role          text not null default 'user' check (role in ('user', 'admin')),
  created_at    timestamptz not null default now()
);

create table if not exists publication_years (
  id         uuid primary key default gen_random_uuid(),
  year       integer unique not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists volumes (
  id            uuid primary key default gen_random_uuid(),
  year_id       uuid not null references publication_years(id) on delete cascade,
  volume_number integer not null,
  name          text,
  quarter       text check (quarter in ('Q1', 'Q2', 'Q3', 'Q4')),
  start_month   integer check (start_month between 1 and 12),
  end_month     integer check (end_month between 1 and 12),
  created_at    timestamptz not null default now(),
  unique (year_id, volume_number)
);

create table if not exists issue_slots (
  id          uuid primary key default gen_random_uuid(),
  volume_id   uuid not null references volumes(id) on delete cascade,
  slot_number integer not null,
  month       integer check (month between 1 and 12),
  issue_type  text not null default 'monthly' check (issue_type in ('monthly', 'weekly')),
  created_at  timestamptz not null default now(),
  unique (volume_id, slot_number)
);

create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  slug       text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists issues (
  id                 uuid primary key default gen_random_uuid(),
  slot_id            uuid references issue_slots(id) on delete set null,
  volume_id          uuid references volumes(id) on delete set null,
  category_id        uuid references categories(id) on delete set null,
  is_special_edition boolean not null default false,
  title              text not null,
  description        text,
  language           text not null default 'English',
  poster_url         text,
  pdf_storage_path   text, -- private "issue-pdfs" bucket path, never sent to the browser directly
  soft_copy_rate     numeric(10, 2),
  hard_copy_rate     numeric(10, 2),
  both_rate          numeric(10, 2),
  coupon_applicable  boolean not null default true,
  status             text not null default 'draft' check (status in ('draft', 'published')),
  published_at       timestamptz,
  created_at         timestamptz not null default now()
);

-- Safe to re-run: adds category_id to an `issues` table that already existed
-- before this column was introduced (the CREATE TABLE above is a no-op then).
alter table issues add column if not exists category_id uuid references categories(id) on delete set null;

create table if not exists subscription_plans (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  format            text not null check (format in ('soft', 'hard', 'both')),
  duration_months   integer not null,
  duration_label    text not null,
  price             numeric(10, 2) not null,
  coupon_applicable boolean not null default true,
  is_active         boolean not null default true,
  -- Cached Razorpay Plan id (Subscriptions API) for autopay mandates against this plan.
  -- Created lazily on first autopay subscribe; null until then.
  razorpay_plan_id  text,
  created_at        timestamptz not null default now()
);

create table if not exists coupons (
  id                       uuid primary key default gen_random_uuid(),
  code                     text unique not null,
  discount_type            text not null check (discount_type in ('flat', 'percent')),
  discount_value           numeric(10, 2) not null,
  subscription_usage_type  text check (subscription_usage_type in ('one_time', 'recurring')),
  expiry_date              date,
  is_active                boolean not null default true,
  created_at               timestamptz not null default now()
);

create table if not exists subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  plan_id             uuid not null references subscription_plans(id),
  format              text not null check (format in ('soft', 'hard', 'both')),
  start_date          date not null,
  end_date            date not null,
  amount_paid         numeric(10, 2) not null,
  coupon_id           uuid references coupons(id),
  coupon_discount     numeric(10, 2) default 0,
  razorpay_order_id   text,
  razorpay_payment_id text,
  razorpay_sub_id     text,
  status              text not null default 'pending' check (status in ('pending', 'active', 'expired', 'cancelled')),
  auto_renew          boolean not null default true,
  created_at          timestamptz not null default now()
);

create table if not exists issue_orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  issue_id            uuid not null references issues(id),
  format              text not null check (format in ('soft', 'hard', 'both')),
  amount              numeric(10, 2) not null,
  coupon_id           uuid references coupons(id),
  coupon_discount     numeric(10, 2) default 0,
  razorpay_order_id   text,
  razorpay_payment_id text,
  delivery_name       text,
  delivery_address    text,
  delivery_city       text,
  delivery_state      text,
  delivery_pincode    text,
  delivery_phone      text,
  order_status        text not null default 'pending' check (order_status in (
    'pending', 'processing',
    'out_for_delivery', 'delivered',
    'return_requested', 'returned',
    'refund_initiated', 'refund_processing',
    'refund_completed', 'refund_failed',
    'reissue_initiated', 'new_copy_dispatched',
    'reissue_delivered'
  )),
  payment_status      text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  created_at          timestamptz not null default now()
);

create table if not exists return_requests (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references issue_orders(id) on delete cascade,
  user_id            uuid not null references users(id),
  reason             text not null,
  admin_action       text check (admin_action in ('reissue', 'refund', 'reject')),
  admin_note         text,
  refund_amount      numeric(10, 2),
  razorpay_refund_id text,
  status             text not null default 'pending' check (status in ('pending', 'reviewed', 'actioned')),
  created_at         timestamptz not null default now(),
  actioned_at        timestamptz
);

create table if not exists cart_items (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references users(id) on delete cascade,
  issue_id uuid not null references issues(id) on delete cascade,
  format   text not null check (format in ('soft', 'hard', 'both')),
  added_at timestamptz not null default now(),
  unique (user_id, issue_id)
);

create table if not exists coupon_usages (
  id        uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id),
  user_id   uuid not null references users(id),
  order_id  uuid references issue_orders(id),
  sub_id    uuid references subscriptions(id),
  used_at   timestamptz not null default now()
);

create table if not exists article_submissions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  title       text not null,
  description text,
  language    text not null default 'English',
  status      text not null default 'submitted' check (status in (
    'submitted', 'under_review',
    'revision_requested', 'resubmitted',
    'accepted'
  )),
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists submission_versions (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references article_submissions(id) on delete cascade,
  version_number integer not null,
  word_path      text not null,
  pdf_path       text not null,
  submitted_by   text not null check (submitted_by in ('user', 'admin')),
  is_admin_edit  boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists idx_issues_status on issues (status);
create index if not exists idx_issues_slot_id on issues (slot_id);
create index if not exists idx_issues_volume_id on issues (volume_id);
create index if not exists idx_issues_category_id on issues (category_id);
create index if not exists idx_subscriptions_user_id on subscriptions (user_id);
create index if not exists idx_subscriptions_status on subscriptions (status);
create index if not exists idx_issue_orders_user_id on issue_orders (user_id);
create index if not exists idx_issue_orders_status on issue_orders (order_status);
create index if not exists idx_submissions_user_id on article_submissions (user_id);
create index if not exists idx_submissions_status on article_submissions (status);
create index if not exists idx_coupon_usages_user_coupon on coupon_usages (user_id, coupon_id);

alter table users enable row level security;
alter table categories enable row level security;
alter table publication_years enable row level security;
alter table volumes enable row level security;
alter table issue_slots enable row level security;
alter table issues enable row level security;
alter table subscription_plans enable row level security;
alter table coupons enable row level security;
alter table subscriptions enable row level security;
alter table issue_orders enable row level security;
alter table return_requests enable row level security;
alter table cart_items enable row level security;
alter table coupon_usages enable row level security;
alter table article_submissions enable row level security;
alter table submission_versions enable row level security;
