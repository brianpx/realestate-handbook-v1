-- The realtor profile (lib/users/profile-neon-store.ts; M7 step 9, user-database plan 6.10 and 11): at most one row
-- per user, every column optional. The account page's form writes it today; the survey, when it exists, writes the
-- same columns. Needs 002.
-- Not yet applied anywhere. Apply to a branch of the Neon resource on the `meded` team first, run the integration
-- tests against that branch (TEST_DATABASE_URL), and only then, with permission, to the default branch; a production
-- deployment applies it through db/migrate.ts (docs/plans/MASTER-PROMPT.md, M3 and M5 step 20).
--
-- Rules the code relies on:
--   * a user with no row is the normal case: the read answers no row and the account page shows an empty form
--   * the form writes the editable columns whole in one upsert (below), null for a cleared field, with
--     profile_source = 'user'; the survey later sets 'survey' with survey_version and profile_completed_at, and an
--     admin edit sets 'admin' and writes an audit row (user-database plan 11)
--   * the upsert never touches license_verified_at / license_verified_by (an administrator's, process deferred),
--     survey_version, profile_completed_at or the survey-only columns
--   * licensure (license_*) and REALTOR® association membership (nar_member*) are separate facts; neither is
--     inferred from the other, nor from the brokerage or title
--   * sign-up, preview, checkout, the webhook and entitlement() never read this table
--   * the row goes with the user: on delete cascade, and account deletion (which anonymises the user row rather than
--     removing it) deletes the profile as its own step (lib/account/handler.ts)

create table if not exists realtor_profiles (
  user_id               uuid primary key references users (id) on delete cascade,
  professional_role     text check (professional_role is null or professional_role in ('agent', 'broker', 'team_lead', 'assistant', 'student', 'other')),
  brokerage_name        text check (brokerage_name is null or length(brokerage_name) <= 200),
  team_name             text check (team_name is null or length(team_name) <= 200),
  license_jurisdiction  text,                                      -- a US state or territory code, or 'other' (lib/users/profile.ts)
  license_number        text check (license_number is null or length(license_number) <= 50),  -- stored as entered
  license_status        text check (license_status is null or license_status in ('pending', 'active', 'inactive', 'expired', 'unknown')),
  license_verified_at   timestamptz,                               -- the pair below is an administrator's; nothing writes it yet
  license_verified_by   uuid references users (id),
  year_first_licensed   smallint check (year_first_licensed is null or year_first_licensed between 1950 and extract(year from now()) + 1),
  primary_market_city   text check (primary_market_city is null or length(primary_market_city) <= 100),
  primary_market_state  text,
  phone                 text check (phone is null or length(phone) <= 20),  -- E.164, checked by the app
  website               text check (website is null or length(website) <= 300),  -- deferred: no form field yet
  nar_member            boolean,
  nar_member_since      date,
  service_areas         text[],                                    -- survey only, deferred
  specialties           text[],                                    -- survey only, deferred
  learning_goals        text check (learning_goals is null or length(learning_goals) <= 2000),  -- survey only, deferred
  profile_source        text not null check (profile_source in ('survey', 'user', 'admin')),  -- record-level provenance
  survey_version        text,
  profile_completed_at  timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint realtor_profiles_verified_pair check ((license_verified_at is null) = (license_verified_by is null))
);

-- The form's save, first and later ones alike; every editable column is written, so a cleared field becomes null:
--   insert into realtor_profiles (user_id, professional_role, brokerage_name, team_name, license_jurisdiction, license_number,
--     license_status, year_first_licensed, primary_market_city, primary_market_state, phone, nar_member, nar_member_since,
--     profile_source, created_at, updated_at)
--   values ($1, ..., 'user', $14, $14)
--   on conflict (user_id) do update set professional_role = excluded.professional_role, ..., nar_member_since = excluded.nar_member_since,
--     profile_source = excluded.profile_source, updated_at = excluded.updated_at
--   returning ...;

-- down
--   drop table if exists realtor_profiles;
