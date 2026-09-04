-- ============================================================================
-- Avernic UK — initial schema
--
-- Run against a Supabase Postgres project (via `supabase db push`, the SQL
-- editor, or the CLI migration workflow). This migration is idempotent-ish
-- (uses IF NOT EXISTS / CREATE OR REPLACE) but is intended to run once on a
-- fresh project.
--
-- Conventions:
--   * All money is stored as an INTEGER number of pence ("minor" units).
--     Never store currency as FLOAT/NUMERIC-with-rounding-error.
--   * All primary keys are UUIDs (gen_random_uuid()).
--   * created_at / updated_at are timestamptz, defaulted and kept current by
--     trigger.
--   * Row Level Security is enabled on every table that holds customer or
--     order data. Public catalogue data (products/categories) is readable
--     by anyone but writable only by admins.
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- profiles: one row per authenticated customer, keyed to auth.users
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  telephone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Automatically create a profile row when a new auth user signs up.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- admin_users: explicit allow-list of users with admin dashboard access.
-- Never infer admin status from anything client-controlled.
-- ----------------------------------------------------------------------------
create table if not exists admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$ language sql stable security definer set search_path = public;

-- ----------------------------------------------------------------------------
-- product_categories
-- ----------------------------------------------------------------------------
create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists product_categories_set_updated_at on product_categories;
create trigger product_categories_set_updated_at
  before update on product_categories
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  name text not null,
  short_description text not null default '',
  full_description text not null default '',
  price_minor integer not null check (price_minor >= 0),
  compare_at_price_minor integer check (compare_at_price_minor is null or compare_at_price_minor >= price_minor),
  category_id uuid not null references product_categories (id) on delete restrict,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text not null default '',
  additional_images jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on products (category_id);
create index if not exists idx_products_active_featured on products (is_active, is_featured);
create index if not exists idx_products_name_search on products using gin (to_tsvector('english', name || ' ' || short_description));

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- addresses: saved delivery addresses for a customer (optional convenience;
-- the order itself always stores a frozen copy of the address used).
-- ----------------------------------------------------------------------------
create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  full_name text not null,
  line1 text not null,
  line2 text,
  town_city text not null,
  county text,
  postcode text not null,
  country text not null default 'United Kingdom' check (country = 'United Kingdom'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_addresses_profile on addresses (profile_id);

drop trigger if exists addresses_set_updated_at on addresses;
create trigger addresses_set_updated_at
  before update on addresses
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- orders
-- ----------------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references profiles (id) on delete set null,
  email text not null,
  telephone text not null,
  delivery_address jsonb not null,
  subtotal_minor integer not null check (subtotal_minor >= 0),
  delivery_minor integer not null check (delivery_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  currency text not null default 'GBP' check (currency = 'GBP'),
  fano_payment_reference text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')),
  order_status text not null default 'pending_payment'
    check (order_status in ('pending_payment', 'paid', 'processing', 'dispatched', 'completed', 'cancelled', 'refunded')),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_customer on orders (customer_id);
create index if not exists idx_orders_created_at on orders (created_at desc);
create index if not exists idx_orders_payment_status on orders (payment_status);
create index if not exists idx_orders_order_status on orders (order_status);
create unique index if not exists idx_orders_fano_reference on orders (fano_payment_reference) where fano_payment_reference is not null;

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- order_items: the purchased line items, with price FROZEN at purchase time.
-- ----------------------------------------------------------------------------
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  sku text not null,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_minor integer not null check (unit_price_minor >= 0),
  line_total_minor integer not null check (line_total_minor >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on order_items (order_id);

-- ----------------------------------------------------------------------------
-- payments: one row per Fano payment attempt against an order (an order can
-- have more than one attempt if a customer retries after a failure).
-- ----------------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  provider text not null default 'fano',
  provider_reference text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'expired')),
  amount_minor integer not null check (amount_minor >= 0),
  currency text not null default 'GBP' check (currency = 'GBP'),
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_payments_provider_reference on payments (provider, provider_reference);
create index if not exists idx_payments_order on payments (order_id);

drop trigger if exists payments_set_updated_at on payments;
create trigger payments_set_updated_at
  before update on payments
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- email_events: idempotency ledger for transactional emails. Before sending,
-- the webhook handler inserts (order_id, email_type) and only proceeds to
-- call Resend if the insert succeeded (i.e. wasn't already there) — this is
-- what makes duplicate Fano webhooks unable to trigger duplicate emails.
-- ----------------------------------------------------------------------------
create table if not exists email_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  email_type text not null check (email_type in ('customer_confirmation', 'business_notification')),
  resend_message_id text,
  sent_at timestamptz not null default now()
);

create unique index if not exists idx_email_events_order_type on email_events (order_id, email_type);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table profiles enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table email_events enable row level security;
alter table products enable row level security;
alter table product_categories enable row level security;
alter table admin_users enable row level security;

-- profiles: a customer can read/update only their own profile. Admins can
-- read all profiles (needed for the admin order list).
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id or is_admin());
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- addresses: fully owned by the customer.
drop policy if exists "addresses_all_own" on addresses;
create policy "addresses_all_own" on addresses for all
  using (auth.uid() = profile_id or is_admin())
  with check (auth.uid() = profile_id);

-- product_categories / products: public read of active rows; admin-only writes.
drop policy if exists "categories_public_read" on product_categories;
create policy "categories_public_read" on product_categories for select using (true);
drop policy if exists "categories_admin_write" on product_categories;
create policy "categories_admin_write" on product_categories for all using (is_admin()) with check (is_admin());

drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products for select using (is_active = true or is_admin());
drop policy if exists "products_admin_write" on products;
create policy "products_admin_write" on products for all using (is_admin()) with check (is_admin());

-- orders: a customer can only ever see their own orders (matched by
-- customer_id when signed in, or not at all for guest orders via the
-- client — guest order lookups must go through a server-side function that
-- verifies email + order number, never a direct table select). Admins can
-- see everything. Nobody can INSERT/UPDATE orders directly from the browser
-- — that only ever happens via the service-role key inside Pages Functions,
-- which bypasses RLS by design (server-authoritative pricing/payment state).
drop policy if exists "orders_select_own" on orders;
create policy "orders_select_own" on orders for select
  using (auth.uid() = customer_id or is_admin());

drop policy if exists "order_items_select_own" on order_items;
create policy "order_items_select_own" on order_items for select
  using (
    is_admin() or
    exists (select 1 from orders o where o.id = order_items.order_id and o.customer_id = auth.uid())
  );

drop policy if exists "payments_select_own" on payments;
create policy "payments_select_own" on payments for select
  using (
    is_admin() or
    exists (select 1 from orders o where o.id = payments.order_id and o.customer_id = auth.uid())
  );

-- email_events / admin_users: admin-only visibility, no client writes ever.
drop policy if exists "email_events_admin_read" on email_events;
create policy "email_events_admin_read" on email_events for select using (is_admin());
drop policy if exists "admin_users_admin_read" on admin_users;
create policy "admin_users_admin_read" on admin_users for select using (is_admin());
