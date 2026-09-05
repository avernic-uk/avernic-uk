-- ============================================================================
-- Product reviews + Royal Mail shipping method selection.
--
-- Adds:
--   * product_reviews — customer-submitted 1–5 star reviews with an optional
--     comment. New reviews are unapproved by default (is_approved = false)
--     and only ever become visible on the storefront once an admin approves
--     them (Admin → Reviews) — this matters here specifically because a
--     review is free-text written by a member of the public, and this site
--     sells cosmetic (not medicinal) products: an unmoderated review that
--     claims a medical/therapeutic effect ("cured my acne", "healed my
--     eczema") would put the site's own product pages in breach of cosmetic
--     product regulations even though staff never wrote it. Moderation is
--     the control for that, not a generic anti-spam measure.
--   * site_settings.delivery_express_minor — the price of the new Royal Mail
--     24hr Tracked & Signed option, alongside the existing standard-delivery
--     price (now representing Royal Mail 48hr Tracked).
--   * orders.delivery_method / delivery_method_label — which shipping option
--     a customer chose, frozen at the time the order was placed (like every
--     other order figure, so it stays accurate even if admin later changes
--     the prices or relabels the options).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- product_reviews
-- ----------------------------------------------------------------------------
create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  customer_name text not null,
  customer_email text,
  rating smallint not null check (rating between 1 and 5),
  title text not null default '',
  comment text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_reviews_product on product_reviews (product_id);
create index if not exists idx_product_reviews_approved on product_reviews (product_id, is_approved);

drop trigger if exists product_reviews_set_updated_at on product_reviews;
create trigger product_reviews_set_updated_at
  before update on product_reviews
  for each row execute function set_updated_at();

alter table product_reviews enable row level security;

-- Public can read only approved reviews (or everything, if admin). Inserts
-- and moderation both happen server-side via the service-role key (Pages
-- Functions: POST /api/reviews, PATCH/DELETE /api/admin/reviews/:id) so
-- there is no direct-insert policy for anonymous clients here — the same
-- pattern orders/order_items already use for customer-submitted data.
drop policy if exists "product_reviews_public_read" on product_reviews;
create policy "product_reviews_public_read" on product_reviews for select
  using (is_approved = true or is_admin());
drop policy if exists "product_reviews_admin_write" on product_reviews;
create policy "product_reviews_admin_write" on product_reviews for all
  using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- Shipping: Royal Mail 24hr Tracked & Signed, alongside the existing
-- standard option (now Royal Mail 48hr Tracked).
-- ----------------------------------------------------------------------------
alter table site_settings
  add column if not exists delivery_express_minor integer not null default 870 check (delivery_express_minor >= 0);

-- Bring a fresh-installed site's standard price up to the new Royal Mail
-- 48hr Tracked figure — but only if it's still sitting at the old bundled
-- default (295), never overwriting a price an admin has already customised.
update site_settings set delivery_standard_minor = 525 where id = 1 and delivery_standard_minor = 295;

alter table orders
  add column if not exists delivery_method text not null default 'standard' check (delivery_method in ('standard', 'express')),
  add column if not exists delivery_method_label text not null default 'Royal Mail 48hr Tracked';
