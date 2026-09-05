-- ============================================================================
-- Adds an admin-editable logo image URL to site_settings, so the header,
-- footer and homepage logo can be swapped (e.g. for a transparent-background
-- version) from Admin → Settings without a code change or redeploy.
-- Empty string means "use the site's default bundled logo".
-- ============================================================================

alter table site_settings add column if not exists logo_url text not null default '';
