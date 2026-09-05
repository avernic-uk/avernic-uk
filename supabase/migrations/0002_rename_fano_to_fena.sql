-- ============================================================================
-- Correction: the Open Banking payment provider is "Fena" (fena.co), not
-- "Fano" — an early naming error in this codebase. This migration renames
-- the affected column/index and updates existing rows/defaults to match.
-- Idempotent: safe to re-run (guards every statement).
-- ============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'orders' and column_name = 'fano_payment_reference'
  ) then
    alter table orders rename column fano_payment_reference to fena_payment_reference;
  end if;
end $$;

alter index if exists idx_orders_fano_reference rename to idx_orders_fena_reference;

alter table payments alter column provider set default 'fena';
update payments set provider = 'fena' where provider = 'fano';

-- Needed for status polling: the opaque id (extracted from the payment
-- link Fena returns) used to fetch live status from Fena's public status
-- endpoint. See functions/_lib/fena.ts.
alter table payments add column if not exists fena_hashed_id text;
