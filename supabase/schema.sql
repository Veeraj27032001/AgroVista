-- AgriOxen — full schema. Run once in the Supabase SQL editor.
-- All application access goes through this app's server code using the
-- service_role key, which bypasses RLS — so RLS is enabled with NO policies,
-- meaning the anon/publishable key can never read or write these tables.

create extension if not exists pgcrypto;

-- Lightweight CMS: editable copy for the Home page (and anywhere else),
-- keyed by a stable string id. Missing keys fall back to hardcoded defaults
-- in the page itself, so nothing breaks before an admin edits anything.
create table if not exists site_content (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
alter table site_content enable row level security;

create table if not exists countries (
  id   uuid primary key default gen_random_uuid(),
  name text unique not null
);
insert into countries (name) values ('India') on conflict (name) do nothing;

create table if not exists states (
  id         uuid primary key default gen_random_uuid(),
  country_id uuid references countries(id) on delete cascade,
  name       text unique not null
);
alter table states add column if not exists country_id uuid references countries(id) on delete cascade;
update states set country_id = (select id from countries where name = 'India') where country_id is null;

create table if not exists districts (
  id       uuid primary key default gen_random_uuid(),
  state_id uuid not null references states(id) on delete cascade,
  name     text not null,
  unique (state_id, name)
);

create table if not exists taluks (
  id          uuid primary key default gen_random_uuid(),
  district_id uuid not null references districts(id) on delete cascade,
  name        text not null,
  unique (district_id, name)
);

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text unique not null,
  password_hash text,
  phone         text,
  address       text,
  state_id      uuid references states(id) on delete set null,
  district_id   uuid references districts(id) on delete set null,
  taluk_id      uuid references taluks(id) on delete set null,
  city          text,
  pincode       text,
  role          text not null default 'user' check (role in ('user', 'admin')),
  created_at    timestamptz not null default now()
);

-- Safe to re-run against a users table that already existed with the old
-- free-text state column, or without these columns at all.
alter table users add column if not exists state_id uuid references states(id) on delete set null;
alter table users add column if not exists district_id uuid references districts(id) on delete set null;
alter table users add column if not exists taluk_id uuid references taluks(id) on delete set null;
alter table users alter column password_hash drop not null;

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
  is_active  boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);
alter table categories add column if not exists is_active boolean not null default true;
alter table categories add column if not exists is_deleted boolean not null default false;

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
  is_active          boolean not null default true,
  published_at       timestamptz,
  created_at         timestamptz not null default now()
);

-- Safe to re-run: adds category_id to an `issues` table that already existed
-- before this column was introduced (the CREATE TABLE above is a no-op then).
alter table issues add column if not exists category_id uuid references categories(id) on delete set null;
alter table issues add column if not exists is_active boolean not null default true;

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
    'draft', 'submitted', 'under_review',
    'revision_required', 'resubmitted',
    'accepted', 'rejected',
    'payment_pending', 'partially_paid', 'payment_completed',
    'scheduled', 'published'
  )),
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- AgriOxen author/article/publication-charge spec — additive columns on the
-- existing submissions table (kept as one row per article, not a new table,
-- since every field here still belongs to exactly one submission).
alter table article_submissions add column if not exists article_code text unique;
alter table article_submissions add column if not exists theme text;
alter table article_submissions add column if not exists theme_other text;
alter table article_submissions add column if not exists word_count integer;
alter table article_submissions add column if not exists author_salutation text;
alter table article_submissions add column if not exists author_first_name text;
alter table article_submissions add column if not exists author_last_name text;
alter table article_submissions add column if not exists author_email text;
alter table article_submissions add column if not exists author_phone text;
alter table article_submissions add column if not exists author_affiliation text;
alter table article_submissions add column if not exists author_designation text;
alter table article_submissions add column if not exists author_city text;
alter table article_submissions add column if not exists author_state text;
alter table article_submissions add column if not exists author_country text default 'India';
alter table article_submissions add column if not exists publication_charge numeric(10,2);
alter table article_submissions add column if not exists amount_paid numeric(10,2) not null default 0;
alter table article_submissions add column if not exists contribution_token text unique;
alter table article_submissions add column if not exists volume_number integer;
alter table article_submissions add column if not exists issue_number integer;
alter table article_submissions add column if not exists publication_month integer check (publication_month between 1 and 12);
alter table article_submissions add column if not exists publication_year integer;
alter table article_submissions add column if not exists page_range text;
alter table article_submissions add column if not exists published_date date;
alter table article_submissions add column if not exists article_url text;
alter table article_submissions add column if not exists reject_reason text;

-- Widen the status check to the full AgriOxen lifecycle (replaces the
-- original 5-value constraint) and rename revision_requested -> revision_required.
update article_submissions set status = 'revision_required' where status = 'revision_requested';
alter table article_submissions drop constraint if exists article_submissions_status_check;
alter table article_submissions add constraint article_submissions_status_check check (status in (
  'draft', 'submitted', 'under_review',
  'revision_required', 'resubmitted',
  'accepted', 'rejected',
  'payment_pending', 'partially_paid', 'payment_completed',
  'scheduled', 'published'
));

create table if not exists submission_versions (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references article_submissions(id) on delete cascade,
  version_number integer not null,
  word_path      text not null,
  pdf_path       text,
  submitted_by   text not null check (submitted_by in ('user', 'admin')),
  is_admin_edit  boolean not null default false,
  created_at     timestamptz not null default now()
);
alter table submission_versions alter column pdf_path drop not null;

-- One row per co-author on a submission (the primary author's own details
-- live on article_submissions itself; this table is additional co-authors only).
create table if not exists article_co_authors (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references article_submissions(id) on delete cascade,
  position      integer not null default 1,
  salutation    text,
  first_name    text not null,
  last_name     text not null,
  email         text not null,
  phone         text,
  affiliation   text,
  designation   text,
  city          text,
  state         text,
  country       text default 'India',
  created_at    timestamptz not null default now()
);

-- One row per contribution toward an article's publication charge. Multiple
-- authors/co-authors can each pay part of the same submission_id.
create table if not exists article_payments (
  id                  uuid primary key default gen_random_uuid(),
  submission_id       uuid not null references article_submissions(id) on delete cascade,
  contributor_name    text not null,
  contributor_email   text not null,
  amount              numeric(10,2) not null,
  razorpay_order_id   text,
  razorpay_payment_id text,
  status              text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  created_at          timestamptz not null default now()
);

-- Author <-> editorial communication thread, scoped to one article.
create table if not exists article_messages (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references article_submissions(id) on delete cascade,
  sender        text not null check (sender in ('admin', 'author')),
  message       text not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_article_co_authors_submission on article_co_authors (submission_id);
create index if not exists idx_article_payments_submission on article_payments (submission_id);
create index if not exists idx_article_messages_submission on article_messages (submission_id);
alter table article_co_authors enable row level security;
alter table article_payments enable row level security;
alter table article_messages enable row level security;

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
