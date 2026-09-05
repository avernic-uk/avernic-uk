-- ============================================================================
-- Hero image setting + an image store the admin panel can upload into.
--
-- WHY A BUCKET AND NOT JUST A URL FIELD
-- A bare "paste an image URL" field means hosting every product photo on some
-- third-party service, and every one of those URLs is a future broken image on
-- the shop: free image hosts expire links, rewrite them, or disappear. Uploads
-- land in this project's own Supabase Storage instead, so the images live
-- beside the data that references them and the URLs are as durable as the shop.
-- The URL field still exists and still works, for anything already hosted
-- elsewhere.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Hero image
--
-- Empty means "fall back to the brand mark", which is what the homepage did
-- before this existed — so an empty value is a valid, good-looking state and
-- not a broken one.
-- ----------------------------------------------------------------------------
alter table site_settings add column if not exists hero_image_url text not null default '';
alter table site_settings add column if not exists hero_image_alt text not null default '';

comment on column site_settings.hero_image_url is
  'Image shown in the homepage hero. Empty falls back to the brand logo mark.';
comment on column site_settings.hero_image_alt is
  'Alt text for the hero image. A hero photograph is content, not decoration, so it needs describing for screen readers and for when the image fails to load.';

-- ----------------------------------------------------------------------------
-- Public image bucket
--
-- Anyone may READ (these are shop images on a public storefront — they are
-- meant to be fetched by browsers, crawlers and link previews alike).
--
-- Nobody may WRITE through the public API. There is deliberately no insert,
-- update or delete policy below, which means an anonymous or signed-in
-- customer cannot upload anything at all. The only writer is
-- functions/api/admin/uploads.ts, which authenticates the admin first and then
-- uses the service-role key — and the service role bypasses RLS. Without that
-- asymmetry a public bucket is an open file drop for anyone who finds the
-- endpoint.
--
-- 5 MB ceiling and an explicit MIME allow-list are enforced here as well as in
-- the upload endpoint, so the limit holds even if the endpoint is ever changed
-- or bypassed.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-images',
  'site-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site_images_public_read" on storage.objects;
create policy "site_images_public_read" on storage.objects
  for select using (bucket_id = 'site-images');
