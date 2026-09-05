-- ============================================================================
-- Adds admin-editable social profile links, used as schema.org `sameAs`
-- entries on the Organization structured data (helps search engines and AI
-- answer engines connect the site to its off-site profiles/entity graph).
-- Stored as one URL per line; empty is fine (sameAs is simply omitted).
-- ============================================================================

alter table site_settings add column if not exists social_links text not null default '';
