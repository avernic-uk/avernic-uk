-- ============================================================================
-- Avernic UK — sample catalogue data
--
-- Run this AFTER 0001_init.sql against your Supabase project (SQL editor,
-- or `psql` / `supabase db execute`) to populate a working catalogue so the
-- site has real products to browse in development. Replace with your real
-- catalogue before launch — these are placeholder products only.
--
-- Range: peptide skincare (cosmetic, topical products only — serums,
-- moisturisers, eye care, cleansers, treatments). Deliberately does NOT
-- include injectable/"research" peptides (BPC-157, TB-500, Melanotan,
-- GLP-1 analogues, etc.) — those are unlicensed medicinal products in the
-- UK and selling them to consumers is a Human Medicines Regulations 2012
-- issue regardless of age-gating or "research use only" labelling. See the
-- README "UK-only enforcement" section before adding any new product line.
--
-- Placeholder images are intentionally omitted (image_url = '') rather than
-- linking to stock photos that may not resolve — the storefront shows a
-- quiet brand-icon placeholder for products with no photo (see
-- src/components/product/ProductCard.tsx). Add real product photography
-- before launch.
-- ============================================================================

insert into product_categories (slug, name, description, sort_order) values
  ('serums', 'Serums', 'Concentrated peptide serums for daily use.', 1),
  ('moisturisers', 'Moisturisers & creams', 'Peptide day and night creams.', 2),
  ('eye-care', 'Eye care', 'Targeted peptide treatments for the eye area.', 3),
  ('cleansers', 'Cleansers', 'Gentle daily cleansing for peptide skincare routines.', 4),
  ('treatments', 'Treatments & boosters', 'Concentrated ampoules and masks.', 5)
on conflict (slug) do nothing;

do $$
declare
  cat_serums uuid; cat_moist uuid; cat_eye uuid; cat_cleanse uuid; cat_treat uuid;
begin
  select id into cat_serums from product_categories where slug = 'serums';
  select id into cat_moist from product_categories where slug = 'moisturisers';
  select id into cat_eye from product_categories where slug = 'eye-care';
  select id into cat_cleanse from product_categories where slug = 'cleansers';
  select id into cat_treat from product_categories where slug = 'treatments';

  insert into products (slug, sku, name, short_description, full_description, price_minor, compare_at_price_minor, category_id, stock_quantity, image_url, is_active, is_featured)
  values
    ('triple-peptide-renewal-serum-30ml', 'AV-SR-001', 'Triple Peptide Renewal Serum, 30ml',
     'A daily serum with Matrixyl 3000 and Argireline to visibly firm and smooth skin texture.',
     'Placeholder full product description — replace with the real, approved product copy (full INCI ingredient list, usage instructions, patch-test advice) before launch.',
     3499, null, cat_serums, 60, '', true, true),

    ('copper-peptide-repair-serum-30ml', 'AV-SR-002', 'Copper Peptide Repair Serum, 30ml',
     'A copper peptide (GHK-Cu) serum that supports skin''s natural repair process and evens tone over time.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     3899, 4499, cat_serums, 45, '', true, true),

    ('peptide-firming-day-cream-50ml', 'AV-MC-001', 'Peptide Firming Day Cream, 50ml',
     'A lightweight daily moisturiser with palmitoyl pentapeptide-4 for firmer-looking skin under makeup or SPF.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     2999, null, cat_moist, 70, '', true, false),

    ('overnight-peptide-recovery-cream-50ml', 'AV-MC-002', 'Overnight Peptide Recovery Cream, 50ml',
     'A richer night cream combining a peptide complex with hyaluronic acid for overnight hydration and recovery.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     3299, 3699, cat_moist, 55, '', true, true),

    ('peptide-eye-contour-cream-15ml', 'AV-EC-001', 'Peptide Eye Contour Cream, 15ml',
     'A caffeine and peptide eye cream to help reduce the look of puffiness and fine lines around the eyes.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     2499, null, cat_eye, 65, '', true, false),

    ('snap8-smoothing-eye-serum-15ml', 'AV-EC-002', 'Snap-8 Smoothing Eye Serum, 15ml',
     'A targeted Snap-8 peptide serum for the appearance of expression lines around the eye area.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     2799, null, cat_eye, 50, '', true, false),

    ('gentle-peptide-cleansing-gel-150ml', 'AV-CL-001', 'Gentle Peptide Cleansing Gel, 150ml',
     'A soap-free daily cleansing gel with an amino peptide complex that won''t strip the skin barrier.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     1899, null, cat_cleanse, 90, '', true, true),

    ('peptide-micellar-water-200ml', 'AV-CL-002', 'Peptide Micellar Water, 200ml',
     'A no-rinse micellar water with peptides to cleanse and remove makeup without harsh rubbing.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     1499, 1699, cat_cleanse, 100, '', true, false),

    ('peptide-ampoule-booster-7x2ml', 'AV-TR-001', 'Peptide Ampoule Booster, 7x2ml',
     'A seven-night concentrated peptide ampoule course to boost an existing skincare routine.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     4299, null, cat_treat, 35, '', true, true),

    ('collagen-peptide-sheet-masks-5pk', 'AV-TR-002', 'Collagen Peptide Sheet Masks, box of 5',
     'Hydrolysed collagen peptide sheet masks for a weekly hydration and plumping treatment.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     1999, 2299, cat_treat, 80, '', true, false)
  on conflict (slug) do nothing;
end $$;
