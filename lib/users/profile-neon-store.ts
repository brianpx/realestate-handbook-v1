import { toDate, toText, type Sql } from '@/lib/db/sql';
import type { Jurisdiction, LicenseStatus, ProfessionalRole, Profile, ProfileFields, ProfileSource } from './profile';
import type { ProfileStore } from './profile-store';

export function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    userId: String(row.user_id),
    professionalRole: toText(row.professional_role) as ProfessionalRole | null,
    brokerageName: toText(row.brokerage_name),
    teamName: toText(row.team_name),
    licenseJurisdiction: toText(row.license_jurisdiction) as Jurisdiction | null,
    licenseNumber: toText(row.license_number),
    licenseStatus: toText(row.license_status) as LicenseStatus | null,
    yearFirstLicensed: row.year_first_licensed === null || row.year_first_licensed === undefined ? null : Number(row.year_first_licensed),
    primaryMarketCity: toText(row.primary_market_city),
    primaryMarketState: toText(row.primary_market_state) as Jurisdiction | null,
    phone: toText(row.phone),
    narMember: row.nar_member === null || row.nar_member === undefined ? null : Boolean(row.nar_member),
    narMemberSince: toText(row.nar_member_since),
    profileSource: String(row.profile_source) as ProfileSource,
    updatedAt: toDate(row.updated_at),
  };
}

// The production store. The table is defined in db/migrations/006_realtor_profiles.sql, which also lists the upsert
// the code relies on. `nar_member_since` is a date column, selected as text so no time zone touches it on the way out.
export class NeonProfileStore implements ProfileStore {
  constructor(private readonly sql: Sql) {}

  async find(userId: string) {
    const rows = await this.sql`
      select user_id, professional_role, brokerage_name, team_name, license_jurisdiction, license_number, license_status,
        year_first_licensed, primary_market_city, primary_market_state, phone, nar_member, nar_member_since::text as nar_member_since,
        profile_source, updated_at
      from realtor_profiles where user_id = ${userId}`;
    return rows[0] ? rowToProfile(rows[0]) : null;
  }

  async save(userId: string, f: ProfileFields, source: ProfileSource, at: Date) {
    const atIso = at.toISOString();
    // every editable column is written, so a cleared field becomes null; the administrator's and the survey's columns are not named
    const rows = await this.sql`
      insert into realtor_profiles (user_id, professional_role, brokerage_name, team_name, license_jurisdiction, license_number,
        license_status, year_first_licensed, primary_market_city, primary_market_state, phone, nar_member, nar_member_since,
        profile_source, created_at, updated_at)
      values (${userId}, ${f.professionalRole}, ${f.brokerageName}, ${f.teamName}, ${f.licenseJurisdiction}, ${f.licenseNumber},
        ${f.licenseStatus}, ${f.yearFirstLicensed}, ${f.primaryMarketCity}, ${f.primaryMarketState}, ${f.phone}, ${f.narMember}, ${f.narMemberSince},
        ${source}, ${atIso}, ${atIso})
      on conflict (user_id) do update set
        professional_role = excluded.professional_role,
        brokerage_name = excluded.brokerage_name,
        team_name = excluded.team_name,
        license_jurisdiction = excluded.license_jurisdiction,
        license_number = excluded.license_number,
        license_status = excluded.license_status,
        year_first_licensed = excluded.year_first_licensed,
        primary_market_city = excluded.primary_market_city,
        primary_market_state = excluded.primary_market_state,
        phone = excluded.phone,
        nar_member = excluded.nar_member,
        nar_member_since = excluded.nar_member_since,
        profile_source = excluded.profile_source,
        updated_at = excluded.updated_at
      returning user_id, professional_role, brokerage_name, team_name, license_jurisdiction, license_number, license_status,
        year_first_licensed, primary_market_city, primary_market_state, phone, nar_member, nar_member_since::text as nar_member_since,
        profile_source, updated_at`;
    const row = rows[0];
    if (!row) throw new Error('realtor_profiles upsert returned no row');
    return rowToProfile(row);
  }

  async deleteByUser(userId: string) {
    await this.sql`delete from realtor_profiles where user_id = ${userId}`;
  }
}
