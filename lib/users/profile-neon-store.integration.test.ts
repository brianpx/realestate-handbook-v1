import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { sqlFromUrl, toDate } from '@/lib/db/sql';
import { NeonUserStore } from '@/lib/users/neon-store';
import { EMPTY_PROFILE } from './profile';
import { NeonProfileStore } from './profile-neon-store';

// Runs against a real Neon database with db/migrations/002 and 006 applied, so it only runs when TEST_DATABASE_URL
// is set (a branch, never production). It writes rows with random names and removes them afterwards.
const url = process.env.TEST_DATABASE_URL;
const run = url ? describe : describe.skip;

run('the profile store against a real database', () => {
  const sql = sqlFromUrl(url!);
  const users = new NeonUserStore(sql);
  const profiles = new NeonProfileStore(sql);
  const tag = randomUUID().slice(0, 8);
  const NOW = new Date();
  const created: string[] = [];
  const createUser = async (address: string) => {
    const { user } = await users.upsertVerified({ email: address, termsVersion: 'v1', at: NOW });
    created.push(user.id);
    return user;
  };

  afterAll(async () => {
    if (created.length === 0) return;
    await sql`delete from realtor_profiles where user_id = any(${created}::uuid[])`;
    await sql`delete from users where id = any(${created}::uuid[])`;
  });

  it('has no row for a new user, creates one on the first save, rewrites it whole on the next, and keeps the date as given', async () => {
    const user = await createUser(`it-${tag}@integration.test`);
    expect(await profiles.find(user.id)).toBeNull();
    const first = await profiles.save(user.id, { ...EMPTY_PROFILE, brokerageName: 'Example Realty', yearFirstLicensed: 2025, narMember: true, narMemberSince: '2025-03-01', phone: '+15125550123' }, 'user', NOW);
    expect(first).toMatchObject({ userId: user.id, brokerageName: 'Example Realty', yearFirstLicensed: 2025, narMember: true, narMemberSince: '2025-03-01', profileSource: 'user' });
    expect(first.updatedAt.getTime()).toBe(NOW.getTime()); // timestamptz keeps the millisecond
    const later = new Date(NOW.getTime() + 60_000);
    const second = await profiles.save(user.id, { ...EMPTY_PROFILE, teamName: 'The A Team' }, 'user', later);
    expect(second).toMatchObject({ brokerageName: null, yearFirstLicensed: null, narMember: null, narMemberSince: null, teamName: 'The A Team' });
    expect(second.updatedAt.getTime()).toBe(later.getTime());
    expect(await sql`select count(*)::int as n from realtor_profiles where user_id = ${user.id}`).toEqual([{ n: 1 }]);
    const [stamps] = await sql`select created_at, updated_at from realtor_profiles where user_id = ${user.id}`;
    expect(toDate(stamps!.created_at).getTime()).toBe(NOW.getTime()); // the first save's; the second did not move it
  });

  it('enforces the checks the code relies on', async () => {
    const user = await createUser(`it-${tag}-c@integration.test`);
    await expect(sql`insert into realtor_profiles (user_id, profile_source, professional_role) values (${user.id}, 'user', 'ceo')`).rejects.toThrow();
    await expect(sql`insert into realtor_profiles (user_id, profile_source, license_status) values (${user.id}, 'user', 'revoked')`).rejects.toThrow();
    await expect(sql`insert into realtor_profiles (user_id, profile_source, year_first_licensed) values (${user.id}, 'user', 1949)`).rejects.toThrow();
    await expect(sql`insert into realtor_profiles (user_id, profile_source, brokerage_name) values (${user.id}, 'user', ${'x'.repeat(201)})`).rejects.toThrow();
    await expect(sql`insert into realtor_profiles (user_id, profile_source) values (${user.id}, 'guess')`).rejects.toThrow();
    await expect(sql`insert into realtor_profiles (user_id, profile_source, license_verified_at) values (${user.id}, 'admin', now())`).rejects.toThrow();
    await expect(sql`insert into realtor_profiles (user_id, profile_source) values (${randomUUID()}, 'user')`).rejects.toThrow(); // no such user
    expect(await profiles.find(user.id)).toBeNull();
  });

  it('goes with the user: deleteByUser removes the row, and so does removing the user row', async () => {
    const user = await createUser(`it-${tag}-d@integration.test`);
    await profiles.save(user.id, { ...EMPTY_PROFILE, licenseNumber: 'TX-1' }, 'user', NOW);
    await profiles.deleteByUser(user.id);
    expect(await profiles.find(user.id)).toBeNull();
    await profiles.save(user.id, { ...EMPTY_PROFILE, licenseNumber: 'TX-2' }, 'user', NOW);
    await sql`delete from users where id = ${user.id}`;
    created.splice(created.indexOf(user.id), 1);
    expect(await sql`select 1 from realtor_profiles where user_id = ${user.id}`).toHaveLength(0);
  });
});
