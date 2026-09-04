-- ============================================================================
-- Avernic UK — sample catalogue data
--
-- Run this AFTER 0001_init.sql against your Supabase project (SQL editor,
-- or `psql` / `supabase db execute`) to populate a working catalogue so the
-- site has real products to browse in development. Replace with your real
-- catalogue before launch — these are placeholder products only.
-- ============================================================================

insert into product_categories (slug, name, description, sort_order) values
  ('pain-relief', 'Pain relief', 'Everyday pain relief and anti-inflammatory essentials.', 1),
  ('vitamins-supplements', 'Vitamins & supplements', 'Everyday vitamins, minerals and supplements.', 2),
  ('skincare', 'Skincare', 'Gentle, everyday skincare essentials.', 3),
  ('first-aid', 'First aid', 'First aid and wound care essentials.', 4),
  ('wellbeing', 'Wellbeing', 'Sleep, digestion and everyday wellbeing.', 5)
on conflict (slug) do nothing;

-- Helper: this block inserts sample products referencing the categories
-- above by slug lookup, so it can run safely regardless of generated UUIDs.
do $$
declare
  cat_pain uuid; cat_vits uuid; cat_skin uuid; cat_first uuid; cat_well uuid;
begin
  select id into cat_pain from product_categories where slug = 'pain-relief';
  select id into cat_vits from product_categories where slug = 'vitamins-supplements';
  select id into cat_skin from product_categories where slug = 'skincare';
  select id into cat_first from product_categories where slug = 'first-aid';
  select id into cat_well from product_categories where slug = 'wellbeing';

  insert into products (slug, sku, name, short_description, full_description, price_minor, compare_at_price_minor, category_id, stock_quantity, image_url, is_active, is_featured)
  values
    ('everyday-ibuprofen-200mg-16', 'AV-PR-001', 'Everyday Ibuprofen 200mg, 16 tablets',
     'Fast-acting relief for everyday aches and pains.',
     'Placeholder full product description — replace with the real, approved product copy, dosage information and patient information leaflet reference before launch.',
     349, 399, cat_pain, 120, 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&q=80', true, true),

    ('paracetamol-500mg-32', 'AV-PR-002', 'Paracetamol 500mg, 32 caplets',
     'Everyday relief for mild to moderate pain and fever.',
     'Placeholder full product description — replace with the real, approved product copy, dosage information and patient information leaflet reference before launch.',
     299, null, cat_pain, 200, 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&q=80', true, true),

    ('vitamin-d3-1000iu-90', 'AV-VS-001', 'Vitamin D3 1000IU, 90 tablets',
     'A daily supplement to support normal bone and immune function.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     899, 1099, cat_vits, 80, 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800&q=80', true, true),

    ('vitamin-c-1000mg-60', 'AV-VS-002', 'Vitamin C 1000mg, 60 tablets',
     'A daily supplement to support normal immune function.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     749, null, cat_vits, 150, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80', true, false),

    ('gentle-daily-moisturiser-50ml', 'AV-SK-001', 'Gentle Daily Moisturiser, 50ml',
     'A fragrance-free daily moisturiser for sensitive skin.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     1199, 1399, cat_skin, 60, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80', true, true),

    ('advanced-first-aid-kit', 'AV-FA-001', 'Advanced First Aid Kit',
     'A comprehensive kit for everyday first aid needs at home.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     1899, null, cat_first, 40, 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800&q=80', true, false),

    ('adhesive-plasters-assorted-100', 'AV-FA-002', 'Adhesive Plasters, assorted sizes, 100 pack',
     'A generous assortment of plasters for everyday cuts and grazes.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     499, null, cat_first, 300, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&q=80', true, false),

    ('sleep-support-tablets-30', 'AV-WB-001', 'Sleep Support Tablets, 30 tablets',
     'A herbal supplement traditionally used to support restful sleep.',
     'Placeholder full product description — replace with the real, approved product copy before launch.',
     999, 1149, cat_well, 70, 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80', true, true)
  on conflict (slug) do nothing;
end $$;
