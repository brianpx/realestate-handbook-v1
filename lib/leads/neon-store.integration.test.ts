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
  const lead = { email, source: 'sample', consentVersion: 'v1', consentText: 'text', confirmTokenHash: `h-${tag}`, confirmExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), at: new Date() };
  // a window of its own, far enough ahead that the request-path cleanup (a day back) never removes it mid-test
  const sendWindow = new Date(Date.now() + 3600 * 1000 + (parseInt(tag, 16) % 3_600_000));

  afterAll(async () => {
    await sql`delete from leads where email = ${email}`;
    await sql`delete from lead_attempts where ip_hash = ${ip}`;
    await sql`delete from send_counts where channel = 'lead' and window_start >= ${sendWindow.toISOString()} and window_start <= ${new Date(sendWindow.getTime() + 600_000).toISOString()}`;
  });

  it('stores an address once and reports a repeat as not created, with the same id', async () => {
    const first = await store.insert(lead);
    const again = await store.insert(lead);
    expect(first.created).toBe(true);
    expect(again).toEqual({ created: false, id: first.id, emailStatus: null, confirmedAt: null });
    const rows = await sql`select email, source, consent_version, email_status from leads where email = ${email}`;
    expect(rows).toEqual([{ email, source: 'sample', consent_version: 'v1', email_status: null }]);
  });

  it('records the email outcome, and the table refuses a value it does not know', async () => {
    const { id } = await store.insert(lead);
    await store.setEmailStatus(id, 'sent');
    expect((await sql`select email_status from leads where id = ${id}`)[0]).toEqual({ email_status: 'sent' });
    await expect(sql`update leads set email_status = 'bogus' where id = ${id}`).rejects.toThrow();
  });

  it('confirms through the token once, refuses an unknown or expired one, and answers a confirmed link after expiry', async () => {
    const { id } = await store.insert(lead);
    const soon = new Date(Date.now() + 60_000);
    expect(await store.confirm(`h-${tag}`, soon)).toBe(true);
    const confirmedAt = (await sql`select confirmed_at from leads where id = ${id}`)[0]!.confirmed_at;
    expect(confirmedAt).not.toBeNull();
    expect(await store.confirm(`h-${tag}`, new Date(Date.now() + 30 * 24 * 3600 * 1000))).toBe(true); // confirmed: still the success page
    expect((await sql`select confirmed_at from leads where id = ${id}`)[0]!.confirmed_at).toEqual(confirmedAt);
    expect(await store.confirm('h-nobody', soon)).toBe(false);
    await store.resetConfirmation(id, `h-${tag}-2`, new Date(Date.now() - 1000));
    await sql`update leads set confirmed_at = null where id = ${id}`;
    expect(await store.confirm(`h-${tag}-2`, new Date())).toBe(false); // expired, unconfirmed
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

  it('counts sends per window in one row, two at once included, and the table refuses an unknown channel', async () => {
    const next = new Date(sendWindow.getTime() + 600_000);
    const both = await Promise.all([store.countSend(sendWindow), store.countSend(sendWindow)]);
    expect(both.sort((a, b) => a - b)).toEqual([1, 2]);
    expect(await store.countSend(sendWindow)).toBe(3);
    expect(await store.countSend(next)).toBe(1);
    expect(await sql`select n from send_counts where channel = 'lead' and window_start = ${sendWindow.toISOString()}`).toEqual([{ n: 3 }]);
    await expect(sql`insert into send_counts (channel, window_start, n) values ('bogus', ${sendWindow.toISOString()}, 1)`).rejects.toThrow();
  });
});
