-- The details a reader wants their invoices to show (lib/users/billing-info-neon-store.ts; the account billing page,
-- app/(product)/account/billing/page.tsx): at most one row per user, every column optional. These are stored for
-- future invoices only; no payment provider reads them yet. Needs 002.
-- Not yet applied anywhere. Apply to a branch of the Neon resource on the `meded` team first, run the integration
-- tests against that branch (TEST_DATABASE_URL), and only then, with permission, to the default branch; a production
-- deployment applies it through db/migrate.ts (docs/plans/MASTER-PROMPT.md, M3 and M5 step 20).
--
-- Rules the code relies on:
--   * a user with no row is the normal case: the read answers no row and the page shows empty cards
--   * each card of the page saves only its own columns; the upsert below overwrites a column only when the request
--     named it, so one card never clears another's values; null means "not given", never an empty string
--   * invoice_email null means "use the account address"
--   * the tax ID is a pair: type and value are both null or both set (the form offers the type list in
--     lib/users/billing-info.ts); the address country is an ISO 3166-1 alpha-2 code, the region a US state code for
--     US and free text elsewhere; the length limits below match the zod rules in the same file
--   * the row goes with the user: on delete cascade, and account deletion (which anonymises the user row rather than
--     removing it) deletes it as its own step (lib/account/handler.ts, lib/access/neon-store.ts)

create table if not exists billing_profiles (
  user_id             uuid primary key references users (id) on delete cascade,
  invoice_email       text check (invoice_email is null or length(invoice_email) <= 254),
  company_name        text check (company_name is null or length(company_name) <= 64),
  address_country     text check (address_country is null or address_country ~ '^[A-Z]{2}$'),
  address_line1       text check (address_line1 is null or length(address_line1) <= 100),
  address_line2       text check (address_line2 is null or length(address_line2) <= 100),
  address_city        text check (address_city is null or length(address_city) <= 100),
  address_region      text check (address_region is null or length(address_region) <= 100),
  address_postal_code text check (address_postal_code is null or length(address_postal_code) <= 20),
  invoice_language    text not null default 'en' check (invoice_language in ('en')),
  purchase_order      text check (purchase_order is null or length(purchase_order) <= 64),
  tax_id_type         text check (tax_id_type is null or length(tax_id_type) <= 32),
  tax_id_value        text check (tax_id_value is null or length(tax_id_value) <= 64),
  updated_at          timestamptz not null default now(),
  check ((tax_id_type is null) = (tax_id_value is null))
);

-- The save, for the session's user only; $n are bound values and `has_*` are booleans saying the request named that
-- column. No row back means the user is gone or no longer active:
--   with active_user as (select id from users where id = $1 and status = 'active' for update)
--   insert into billing_profiles (user_id, ..., updated_at) select id, ..., $at from active_user where true
--   on conflict (user_id) do update set
--     company_name = case when has_company_name then excluded.company_name else billing_profiles.company_name end,
--     ... (one line per column), updated_at = excluded.updated_at
--   returning ...;

-- down
--   drop table if exists billing_profiles;
