import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { afterAll, describe, expect, it } from 'vitest';
import { NeonLeadStore, type Sql } from './neon-store';

// Runs against a real Neon database, so it only runs when TEST_DATABASE_URL is set (use a branch, not production
// data). It writes rows with random names and removes them afterwards.
const url = process.env.TEST_DATABASE_URL;
const run = url ? describe : describe.skip;

run('NeonLeadStore against a real database', () => {
  const sql = neon(url!) as unknown as Sql;
  const store = new NeonLeadStore(sql);
  const tag = randomUUID().slice(0, 8);
  const email = `it-${tag}@integration.test`;
  const ip = `it-${tag}`;
  const lead = { email, source: 'gate', consentVersion: 'v1', consentText: 'text', at: new Date() };

  afterAll(async () => {
    await sql`delete from leads where email = ${email}`;
    await sql`delete from lead_attempts where ip_hash = ${ip}`;
  });

  it('stores an address once and reports a repeat as not created, with the same id', async () => {
    const first = await store.insert(lead);
    const again = await store.insert(lead);
    expect(first.created).toBe(true);
    expect(again).toEqual({ created: false, id: first.id });
    const rows = await sql`select email, source, consent_version, email_status from leads where email = ${email}`;
    expect(rows).toEqual([{ email, source: 'gate', consent_version: 'v1', email_status: null }]);
  });

  it('records the email outcome, and the table refuses a value it does not know', async () => {
    const { id } = await store.insert(lead);
    await store.setEmailStatus(id, 'sent');
    expect((await sql`select email_status from leads where id = ${id}`)[0]).toEqual({ email_status: 'sent' });
    await expect(sql`update leads set email_status = 'bogus' where id = ${id}`).rejects.toThrow();
  });

  it('refuses an upper-case address, so the route must lower-case first', async () => {
    await expect(sql`insert into leads (email, source, consent_version, consent_text) values (${email.toUpperCase()}, 'gate', 'v1', 't')`).rejects.toThrow();
  });

  it('counts attempts per address inside a window', async () => {
    const t = Date.now();
    await store.recordAttempt(ip, new Date(t - 20 * 60_000));
    await store.recordAttempt(ip, new Date(t - 2 * 60_000));
    await store.recordAttempt(ip, new Date(t));
    expect(await store.countAttempts(ip, new Date(t - 10 * 60_000))).toBe(2);
    expect(await store.countAttempts(ip, new Date(t - 60 * 60_000))).toBe(3);
    expect(await store.countAttempts(`${ip}-other`, new Date(t - 60 * 60_000))).toBe(0);
  });
});
