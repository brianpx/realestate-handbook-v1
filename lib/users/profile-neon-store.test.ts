import { describe, expect, it } from 'vitest';
import { fakeSql } from '@/lib/db/fake-sql';
import { EMPTY_PROFILE } from './profile';
import { NeonProfileStore, rowToProfile } from './profile-neon-store';

const AT = new Date('2026-11-08T12:00:00Z');
const ISO = AT.toISOString();
const row = {
  user_id: 'u-1', professional_role: 'agent', brokerage_name: 'Example Realty', team_name: null, license_jurisdiction: 'TX', license_number: 'TX-1',
  license_status: 'active', year_first_licensed: 2025, primary_market_city: 'Austin', primary_market_state: 'TX', phone: '+15125550123',
  nar_member: true, nar_member_since: '2025-03-01', profile_source: 'user', updated_at: ISO,
};
const fields = { ...EMPTY_PROFILE, professionalRole: 'agent' as const, brokerageName: 'Example Realty', licenseJurisdiction: 'TX' as const, licenseNumber: 'TX-1', licenseStatus: 'active' as const, yearFirstLicensed: 2025, primaryMarketCity: 'Austin', primaryMarketState: 'TX' as const, phone: '+15125550123', narMember: true, narMemberSince: '2025-03-01' };

describe('NeonProfileStore', () => {
  it('maps a row, with the date as the text the statement selected and the stamp as a Date', () => {
    expect(rowToProfile(row)).toEqual({ ...fields, userId: 'u-1', profileSource: 'user', updatedAt: AT });
    expect(rowToProfile({ ...row, year_first_licensed: null, nar_member: null, nar_member_since: null })).toMatchObject({ yearFirstLicensed: null, narMember: null, narMemberSince: null });
    expect(rowToProfile({ ...row, nar_member: false })).toMatchObject({ narMember: false });
  });
  it('finds by user id, reading the date column as text, and answers null for no row', async () => {
    const { sql, calls } = fakeSql([row], []);
    const store = new NeonProfileStore(sql);
    expect((await store.find('u-1'))?.brokerageName).toBe('Example Realty');
    expect(await store.find('nope')).toBeNull();
    expect(calls[0]!.text).toContain('nar_member_since::text as nar_member_since');
    expect(calls[0]!.text).toContain('from realtor_profiles where user_id = ?');
    expect(calls[1]!.values).toEqual(['nope']);
  });
  it('saves in one upsert with every editable column bound, the source and the stamp, and leaves the other columns unnamed', async () => {
    const { sql, calls } = fakeSql([row]);
    const saved = await new NeonProfileStore(sql).save('u-1', fields, 'user', AT);
    expect(saved).toEqual({ ...fields, userId: 'u-1', profileSource: 'user', updatedAt: AT });
    expect(calls).toHaveLength(1);
    const { text, values } = calls[0]!;
    expect(text).toContain("select id from users where id = ? and status = 'active' for update");
    expect(text).toContain('insert into realtor_profiles');
    expect(text).toContain('from active_user where true');
    expect(text).toContain('on conflict (user_id) do update set');
    expect(text).toContain('profile_source = excluded.profile_source');
    expect(text).toContain('updated_at = excluded.updated_at');
    expect(text).not.toContain('license_verified');
    expect(text).not.toContain('survey_version');
    expect(text).not.toContain('profile_completed_at');
    expect(text).not.toContain('created_at = excluded');
    expect(values).toEqual(['u-1', 'agent', 'Example Realty', null, 'TX', 'TX-1', 'active', 2025, 'Austin', 'TX', '+15125550123', true, '2025-03-01', 'user', ISO, ISO]);
  });
  it('writes null for every cleared field rather than skipping it', async () => {
    const { sql, calls } = fakeSql([{ ...row, brokerage_name: null }]);
    await new NeonProfileStore(sql).save('u-1', EMPTY_PROFILE, 'user', AT);
    expect(calls[0]!.values.slice(1, 13)).toEqual(Array(12).fill(null));
  });
  it('throws rather than answer nothing when the upsert returns no row', async () => {
    const { sql } = fakeSql([]);
    await expect(new NeonProfileStore(sql).save('u-1', EMPTY_PROFILE, 'user', AT)).rejects.toThrow('no row');
  });
  it('deletes by user id', async () => {
    const { sql, calls } = fakeSql([]);
    await new NeonProfileStore(sql).deleteByUser('u-1');
    expect(calls[0]).toEqual({ text: 'delete from realtor_profiles where user_id = ?', values: ['u-1'] });
  });
});
