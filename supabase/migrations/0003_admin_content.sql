-- ============================================================================
-- Admin panel expansion: category management catch-all, site settings, FAQs.
--
-- Adds:
--   * An "Uncategorised" catch-all product category — when an admin deletes
--     a category from the admin panel, any products still in it are moved
--     here rather than the delete being blocked.
--   * site_settings — a single-row table of admin-editable business/legal
--     details, delivery pricing and homepage/notice copy, so these no
--     longer require a code change + redeploy to update.
--   * faqs — an admin-editable, ordered list of Q&A entries shown on the
--     homepage and the FAQ page (in addition to the FAQ page's existing
--     hardcoded grouped sections, which remain code-edited).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Uncategorised catch-all category
-- ----------------------------------------------------------------------------
insert into product_categories (slug, name, description, sort_order)
values ('uncategorised', 'Uncategorised', 'Products not currently assigned to a category.', 9999)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- site_settings — single row (id fixed to 1), admin-editable site content
-- ----------------------------------------------------------------------------
create table if not exists site_settings (
  id smallint primary key default 1 check (id = 1),
  company_name text not null default '',
  company_number text not null default '',
  registered_address text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  delivery_standard_minor integer not null default 295 check (delivery_standard_minor >= 0),
  delivery_free_threshold_minor integer not null default 4000 check (delivery_free_threshold_minor >= 0),
  hero_heading text not null default 'Peptide skincare, made simpler.',
  hero_subheading text not null default 'Cosmetic peptide serums, moisturisers and treatments, chosen with care and delivered across the United Kingdom — with a straightforward checkout and secure Open Banking payment.',
  age_notice_text text not null default 'Our products are cosmetic skincare intended for adults aged 18 and over.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into site_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists site_settings_set_updated_at on site_settings;
create trigger site_settings_set_updated_at
  before update on site_settings
  for each row execute function set_updated_at();

alter table site_settings enable row level security;

drop policy if exists "site_settings_public_read" on site_settings;
create policy "site_settings_public_read" on site_settings for select using (true);
drop policy if exists "site_settings_admin_write" on site_settings;
create policy "site_settings_admin_write" on site_settings for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- faqs — admin-editable, ordered Q&A list
-- ----------------------------------------------------------------------------
create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists faqs_set_updated_at on faqs;
create trigger faqs_set_updated_at
  before update on faqs
  for each row execute function set_updated_at();

alter table faqs enable row level security;

drop policy if exists "faqs_public_read" on faqs;
create policy "faqs_public_read" on faqs for select using (is_active = true or is_admin());
drop policy if exists "faqs_admin_write" on faqs;
create policy "faqs_admin_write" on faqs for all using (is_admin()) with check (is_admin());

-- Seed with the FAQ copy that was previously hardcoded on the homepage, so
-- nothing regresses for sites that already had that copy live.
insert into faqs (question, answer, sort_order)
select * from (values
  ('Are these medical products?', 'No — everything we sell is a cosmetic skincare product applied topically. Nothing on Avernic UK is a medicine and nothing is intended for injection or internal use.', 0),
  ('Where do you deliver?', 'Avernic UK delivers to addresses within the United Kingdom only. We do not currently offer international shipping.', 1),
  ('How do I pay?', 'Checkout is completed securely via Open Banking, powered by Fena. You authorise payment directly from your own bank — we never see or store your banking details.', 2),
  ('How long does delivery take?', 'See our Delivery information page for current delivery options and estimated timescales.', 3),
  ('Can I return an item?', 'Yes — see our Returns & refunds page for eligibility and how to start a return.', 4)
) as seed(question, answer, sort_order)
where not exists (select 1 from faqs);
