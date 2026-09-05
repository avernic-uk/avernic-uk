-- ============================================================================
-- First-party, cookieless site analytics.
--
-- WHY FIRST-PARTY AND COOKIELESS
-- Under PECR, consent is required to *store or access information on a
-- visitor's device* — cookies, localStorage, and similar. This system stores
-- nothing on the device at all, so that requirement doesn't apply and
-- measurement covers every visitor rather than only the minority who accept a
-- consent banner. Nothing is shared with a third party, because the data never
-- leaves this Supabase project.
--
-- HOW A VISITOR IS COUNTED WITHOUT A COOKIE
-- functions/api/track.ts derives `visitor_hash` as a salted SHA-256 of
-- (daily rotating salt + IP + user agent). The raw IP and user agent are used
-- for that hash and then discarded — neither is ever written here. The salt
-- rotates every 24 hours and the previous day's salt is not retained, so the
-- same person browsing on two different days produces two unrelated hashes and
-- cannot be followed across days, and no hash can be worked backwards to an IP.
-- This is the same approach Plausible and Fathom use. It is what makes
-- "visitors today" possible while keeping the data effectively anonymous.
--
-- RETENTION
-- Raw events are kept for 90 days for detailed analysis, then rolled up into
-- `analytics_daily` (counts only, no visitor hashes) and deleted. That keeps
-- storage flat and is a clean data-minimisation position under UK GDPR:
-- individual-level records exist only as long as they are actually useful.
-- `rollup_analytics()` performs both steps and is idempotent, so it is safe to
-- re-run and safe to call manually if the scheduled job is ever missed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Raw events (90-day window)
-- ----------------------------------------------------------------------------
create table if not exists analytics_events (
  id bigserial primary key,
  occurred_at timestamptz not null default now(),
  -- 'page_view' | 'search'
  event_type text not null check (event_type in ('page_view', 'search')),
  -- Site-relative path, query string already stripped by the collector.
  path text not null default '',
  -- Pseudonymous, salt-rotated daily. NOT reversible to an IP. See header.
  visitor_hash text not null,
  -- Coarse acquisition channel: direct | organic_search | ai_assistant |
  -- social | referral | email | internal. Derived from the referrer at the
  -- edge; the full referring URL is never stored, only its hostname.
  channel text not null default 'direct',
  referrer_host text not null default '',
  -- Populated for event_type = 'search' only.
  search_term text not null default '',
  search_result_count integer,
  -- Coarse device class only: mobile | tablet | desktop. Never the raw UA.
  device text not null default 'desktop',
  -- Two-letter country from Cloudflare's CF-IPCountry header.
  country text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_occurred_at_idx on analytics_events (occurred_at desc);
create index if not exists analytics_events_type_occurred_idx on analytics_events (event_type, occurred_at desc);
create index if not exists analytics_events_search_idx on analytics_events (search_term) where event_type = 'search';

comment on column analytics_events.visitor_hash is
  'Salted daily-rotating hash of IP + user agent. Not reversible, not stable across days. Raw IP/UA are never stored.';

-- ----------------------------------------------------------------------------
-- Daily rollup (kept permanently — counts only, no visitor-level data)
-- ----------------------------------------------------------------------------
create table if not exists analytics_daily (
  day date not null,
  -- 'channel' | 'path' | 'search_term' | 'country' | 'device' | 'referrer_host' | 'total'
  dimension text not null,
  dimension_value text not null default '',
  views integer not null default 0,
  visitors integer not null default 0,
  primary key (day, dimension, dimension_value)
);

create index if not exists analytics_daily_day_idx on analytics_daily (day desc);

comment on table analytics_daily is
  'Permanent aggregate history. Contains counts only — no visitor hashes — so it stays useful indefinitely without holding individual-level records.';

-- ----------------------------------------------------------------------------
-- Row Level Security: nobody reads this but an admin.
--
-- The collector writes with the service-role key (functions/_lib/
-- supabaseAdmin.ts), which bypasses RLS, so there is deliberately no public
-- insert policy — a visitor's browser cannot write to these tables directly and
-- cannot read anything back out of them.
-- ----------------------------------------------------------------------------
alter table analytics_events enable row level security;
alter table analytics_daily enable row level security;

drop policy if exists "analytics_events_admin_read" on analytics_events;
create policy "analytics_events_admin_read" on analytics_events for select using (is_admin());

drop policy if exists "analytics_daily_admin_read" on analytics_daily;
create policy "analytics_daily_admin_read" on analytics_daily for select using (is_admin());

-- ----------------------------------------------------------------------------
-- Rollup + prune
--
-- Aggregates every day that is now older than the 90-day detail window into
-- analytics_daily, then deletes those raw rows. Idempotent: re-running simply
-- recomputes the same totals for the same days (on conflict do update), and
-- days whose raw rows have already been deleted are skipped because there is
-- nothing left to aggregate.
-- ----------------------------------------------------------------------------
create or replace function rollup_analytics(retain_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff date := (now() at time zone 'utc')::date - retain_days;
  deleted integer;
begin
  -- Overall daily totals
  insert into analytics_daily (day, dimension, dimension_value, views, visitors)
  select (occurred_at at time zone 'utc')::date, 'total', '',
         count(*)::int, count(distinct visitor_hash)::int
  from analytics_events
  where (occurred_at at time zone 'utc')::date < cutoff
  group by 1
  on conflict (day, dimension, dimension_value)
  do update set views = excluded.views, visitors = excluded.visitors;

  -- One row per dimension value per day
  insert into analytics_daily (day, dimension, dimension_value, views, visitors)
  select (occurred_at at time zone 'utc')::date, d.dimension, d.value,
         count(*)::int, count(distinct visitor_hash)::int
  from analytics_events
  cross join lateral (values
    ('channel', channel),
    ('path', path),
    ('country', country),
    ('device', device),
    ('referrer_host', referrer_host),
    ('search_term', case when event_type = 'search' then search_term else '' end)
  ) as d(dimension, value)
  where (occurred_at at time zone 'utc')::date < cutoff
    and d.value <> ''
  group by 1, 2, 3
  on conflict (day, dimension, dimension_value)
  do update set views = excluded.views, visitors = excluded.visitors;

  delete from analytics_events where (occurred_at at time zone 'utc')::date < cutoff;
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

comment on function rollup_analytics is
  'Aggregates raw events older than retain_days into analytics_daily, then deletes them. Idempotent; safe to run manually.';

revoke all on function rollup_analytics(integer) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Nightly schedule.
--
-- pg_cron runs inside Postgres, so retention keeps working even if the site
-- gets no traffic and nothing else ever calls the function. If the extension
-- cannot be created on this plan the DO block below simply reports it and the
-- rest of the migration still applies — in that case run
-- `select rollup_analytics();` periodically instead (the admin analytics API
-- also calls it opportunistically, at most once a day).
-- ----------------------------------------------------------------------------
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule('avernic-analytics-rollup')
  where exists (select 1 from cron.job where jobname = 'avernic-analytics-rollup');
  perform cron.schedule('avernic-analytics-rollup', '30 3 * * *', 'select rollup_analytics(90);');
  raise notice 'pg_cron scheduled: avernic-analytics-rollup nightly at 03:30 UTC';
exception when others then
  raise notice 'pg_cron unavailable (%). Retention will fall back to the opportunistic rollup in the admin analytics API.', sqlerrm;
end;
$$;

-- ----------------------------------------------------------------------------
-- Dashboard aggregation.
--
-- Returned as a single JSON document from one round trip rather than a dozen
-- separate queries, because the admin dashboard renders all of these panels
-- together and PostgREST cannot express GROUP BY on its own.
--
-- Reads the raw 90-day window only. Anything older has already been rolled up
-- into analytics_daily by rollup_analytics(), which is the intended trade: full
-- detail recently, permanent totals forever, individual records neither.
-- ----------------------------------------------------------------------------
create or replace function analytics_summary(range_days integer default 30)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with bounded as (
    select least(greatest(coalesce(range_days, 30), 1), 90) as d
  ),
  scoped as (
    select * from analytics_events, bounded
    where occurred_at >= now() - (bounded.d || ' days')::interval
  ),
  views as (select * from scoped where event_type = 'page_view'),
  searches as (select * from scoped where event_type = 'search')
  select jsonb_build_object(
    'rangeDays', (select d from bounded),
    'totals', jsonb_build_object(
      'views', (select count(*) from views),
      'visitors', (select count(distinct visitor_hash) from views),
      'searches', (select count(*) from searches),
      'zeroResultSearches', (select count(*) from searches where search_result_count = 0)
    ),
    'daily', coalesce((
      select jsonb_agg(r order by r->>'day')
      from (
        select jsonb_build_object(
          'day', (occurred_at at time zone 'utc')::date,
          'views', count(*),
          'visitors', count(distinct visitor_hash)
        ) as r
        from views group by (occurred_at at time zone 'utc')::date
      ) t), '[]'::jsonb),
    'channels', coalesce((
      select jsonb_agg(r order by (r->>'visitors')::int desc)
      from (
        select jsonb_build_object('value', channel, 'views', count(*), 'visitors', count(distinct visitor_hash)) as r
        from views where channel <> 'internal' group by channel
      ) t), '[]'::jsonb),
    'referrers', coalesce((
      select jsonb_agg(r order by (r->>'visitors')::int desc)
      from (
        select jsonb_build_object('value', referrer_host, 'views', count(*), 'visitors', count(distinct visitor_hash)) as r
        from views where referrer_host <> '' group by referrer_host limit 15
      ) t), '[]'::jsonb),
    'searchTerms', coalesce((
      select jsonb_agg(r order by (r->>'count')::int desc)
      from (
        select jsonb_build_object(
          'term', search_term,
          'count', count(*),
          'results', max(search_result_count)
        ) as r
        from searches group by search_term limit 25
      ) t), '[]'::jsonb),
    'pages', coalesce((
      select jsonb_agg(r order by (r->>'views')::int desc)
      from (
        select jsonb_build_object('value', path, 'views', count(*), 'visitors', count(distinct visitor_hash)) as r
        from views group by path limit 15
      ) t), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(r order by (r->>'visitors')::int desc)
      from (
        select jsonb_build_object('value', device, 'views', count(*), 'visitors', count(distinct visitor_hash)) as r
        from views group by device
      ) t), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(r order by (r->>'visitors')::int desc)
      from (
        select jsonb_build_object('value', country, 'views', count(*), 'visitors', count(distinct visitor_hash)) as r
        from views where country <> '' group by country limit 10
      ) t), '[]'::jsonb)
  );
$$;

comment on function analytics_summary is
  'Whole analytics dashboard as one JSON document, over the last N days (capped at the 90-day detail window).';

-- Only the service role may call these. The edge functions authenticate the
-- admin themselves (functions/_lib/auth.ts) before using the service-role key;
-- a signed-in customer must never be able to invoke either directly over
-- PostgREST and read the site's traffic.
revoke all on function analytics_summary(integer) from public, anon, authenticated;
grant execute on function analytics_summary(integer) to service_role;
grant execute on function rollup_analytics(integer) to service_role;
