import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileLeadStore, MemoryLeadStore, storeFromEnv } from './store';

let dir: string;
let file: string;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'leads-')); file = path.join(dir, 'nested', 'leads.json'); });
afterEach(() => rm(dir, { recursive: true, force: true }));

const lead = (email: string) => ({ email, source: 'sample', consentVersion: 'v1', consentText: 'text', confirmTokenHash: `h-${email}`, confirmExpiresAt: new Date('2026-11-09T12:00:00Z'), at: new Date('2026-11-02T12:00:00Z') });

describe('FileLeadStore', () => {
  it('creates its folder, stores a lead once and keeps the first record for a repeat', async () => {
    const store = new FileLeadStore(file);
    const first = await store.insert(lead('a@b.co'));
    const again = await store.insert(lead('a@b.co'));
    expect(first.created).toBe(true);
    expect(again).toEqual({ created: false, id: first.id, emailStatus: null, confirmedAt: null });
    const saved = JSON.parse(await readFile(file, 'utf8'));
    expect(saved.leads).toHaveLength(1);
  });
  it('starts empty when the file holds something other than the two arrays', async () => {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify({ leads: 'nope', attempts: null }));
    const store = new FileLeadStore(file);
    expect(await store.countAttempts('ip1', new Date(0))).toBe(0);
    expect((await store.insert(lead('a@b.co'))).created).toBe(true);
    expect(JSON.parse(await readFile(file, 'utf8')).leads).toHaveLength(1);
  });
  it('records the email outcome against the lead', async () => {
    const store = new FileLeadStore(file);
    const { id } = await store.insert(lead('a@b.co'));
    await store.setEmailStatus(id, 'failed');
    expect(JSON.parse(await readFile(file, 'utf8')).leads[0].emailStatus).toBe('failed');
  });
  it('confirms the lead that holds the token, keeps the first time on a second click, and knows no other token', async () => {
    const store = new FileLeadStore(file);
    await store.insert(lead('a@b.co'));
    const first = new Date('2026-11-02T13:00:00Z');
    expect(await store.confirm('h-a@b.co', first)).toBe(true);
    expect(await store.confirm('h-a@b.co', new Date('2026-11-02T14:00:00Z'))).toBe(true);
    expect(await store.confirm('h-nobody', first)).toBe(false);
    expect((await store.list())[0]!.confirmedAt).toEqual(first);
    // a confirmed row still answers its link after the expiry; an unconfirmed one does not
    expect(await store.confirm('h-a@b.co', new Date('2026-11-20T12:00:00Z'))).toBe(true);
    await store.insert(lead('b@b.co'));
    expect(await store.confirm('h-b@b.co', new Date('2026-11-20T12:00:00Z'))).toBe(false);
    expect((await store.list()).find(r => r.email === 'b@b.co')!.confirmedAt).toBeNull();
  });
  it('resets the confirmation token, so the old link stops working and the new one works, and reports the state of a repeat', async () => {
    const store = new FileLeadStore(file);
    const { id } = await store.insert(lead('a@b.co'));
    await store.setEmailStatus(id, 'failed');
    expect(await store.insert(lead('a@b.co'))).toEqual({ created: false, id, emailStatus: 'failed', confirmedAt: null });
    await store.resetConfirmation(id, 'h-new', new Date('2026-11-16T12:00:00Z'));
    expect(await store.confirm('h-a@b.co', new Date('2026-11-03T12:00:00Z'))).toBe(false);
    expect(await store.confirm('h-new', new Date('2026-11-10T12:00:00Z'))).toBe(true);
  });
  it('keeps concurrent writes from losing any', async () => {
    const store = new FileLeadStore(file);
    await Promise.all(Array.from({ length: 20 }, (_, i) => store.insert(lead(`u${i}@b.co`))));
    expect(JSON.parse(await readFile(file, 'utf8')).leads).toHaveLength(20);
  });
  it('counts attempts per address inside the window and forgets old ones', async () => {
    const store = new FileLeadStore(file);
    const t = (m: number) => new Date(Date.UTC(2026, 10, 2, 12, m));
    await store.recordAttempt('ip1', t(0));
    await store.recordAttempt('ip1', t(5));
    await store.recordAttempt('ip2', t(5));
    expect(await store.countAttempts('ip1', t(1))).toBe(1);
    expect(await store.countAttempts('ip1', t(-1))).toBe(2);
    await store.recordAttempt('ip1', new Date(Date.UTC(2026, 10, 4, 12, 0))); // two days later: the earlier ones are dropped
    expect(JSON.parse(await readFile(file, 'utf8')).attempts).toHaveLength(1);
  });
  it('counts two overlapping attempts for one address as 1 then 2', async () => {
    const store = new FileLeadStore(file);
    const at = new Date('2026-11-02T12:00:00Z');
    const since = new Date('2026-11-02T11:50:00Z');
    const counts = await Promise.all([store.recordAndCount('ip1', at, since), store.recordAndCount('ip1', at, since)]);
    expect(counts).toEqual([1, 2]);
  });
  it('counts sends per window, overlapping calls included, and forgets windows a day old', async () => {
    const store = new FileLeadStore(file);
    const w1 = new Date('2026-11-02T12:00:00Z');
    const w2 = new Date('2026-11-02T12:10:00Z');
    const counts = await Promise.all([store.countSend(w1), store.countSend(w1), store.countSend(w1)]);
    expect(counts.sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(await store.countSend(w2)).toBe(1);
    expect(await store.countSend(w1)).toBe(4);
    expect(await store.countSend(new Date('2026-11-04T12:00:00Z'))).toBe(1); // two days later: the earlier windows are dropped
    expect(JSON.parse(await readFile(file, 'utf8')).sends).toEqual([{ windowStart: '2026-11-04T12:00:00.000Z', n: 1 }]);
  });
  it('lists leads newest first with the stored time as a Date, the consent text left out', async () => {
    const store = new FileLeadStore(file);
    const { id: older } = await store.insert({ ...lead('a@b.co'), at: new Date('2026-11-01T08:00:00Z') });
    const { id: newer } = await store.insert({ ...lead('b@b.co'), at: new Date('2026-11-03T08:00:00Z') });
    await store.setEmailStatus(newer, 'sent');
    const rows = await store.list();
    expect(rows.map(r => r.id)).toEqual([newer, older]);
    expect(rows[0]).toEqual({ id: newer, email: 'b@b.co', source: 'sample', createdAt: new Date('2026-11-03T08:00:00Z'), consentVersion: 'v1', emailStatus: 'sent', confirmedAt: null });
    expect(rows[1]!.emailStatus).toBeNull();
    expect(rows[1]).not.toHaveProperty('consentText');
    expect(rows[1]).not.toHaveProperty('confirmTokenHash');
  });
  it('lists nothing when there is no file yet', async () => {
    expect(await new FileLeadStore(file).list()).toEqual([]);
  });
});

describe('MemoryLeadStore', () => {
  it('lists leads newest first', async () => {
    const store = new MemoryLeadStore();
    const { id: older } = await store.insert({ ...lead('a@b.co'), at: new Date('2026-11-01T08:00:00Z') });
    const { id: newer } = await store.insert({ ...lead('b@b.co'), at: new Date('2026-11-03T08:00:00Z') });
    expect((await store.list()).map(r => r.id)).toEqual([newer, older]);
  });
  it('counts sends per window', async () => {
    const store = new MemoryLeadStore();
    const w1 = new Date('2026-11-02T12:00:00Z');
    expect(await store.countSend(w1)).toBe(1);
    expect(await store.countSend(w1)).toBe(2);
    expect(await store.countSend(new Date('2026-11-02T12:10:00Z'))).toBe(1);
  });
});

describe('storeFromEnv', () => {
  it('is on only by explicit choice, and otherwise there is no store', () => {
    expect(storeFromEnv({})).toBeNull();
    expect(storeFromEnv({ NODE_ENV: 'production' })).toBeNull();
    expect(storeFromEnv({ LEAD_STORE: 'file', LEAD_STORE_PATH: file })).toBeInstanceOf(FileLeadStore);
    expect(storeFromEnv({ DATABASE_URL: 'postgres://u:p@ep-x.us-east-1.aws.neon.tech/db' })?.constructor.name).toBe('NeonLeadStore');
  });
  it('never picks the file store on a hosted deployment, even when LEAD_STORE asks for it', () => {
    expect(storeFromEnv({ LEAD_STORE: 'file', LEAD_STORE_PATH: file, VERCEL_ENV: 'production' })).toBeNull();
    expect(storeFromEnv({ LEAD_STORE: 'file', VERCEL_ENV: 'preview', DATABASE_URL: 'postgres://u:p@ep-x.us-east-1.aws.neon.tech/db' })?.constructor.name).toBe('NeonLeadStore');
    // vercel dev and a local production build (the e2e suite) still may
    expect(storeFromEnv({ LEAD_STORE: 'file', LEAD_STORE_PATH: file, VERCEL_ENV: 'development' })).toBeInstanceOf(FileLeadStore);
    expect(storeFromEnv({ LEAD_STORE: 'file', LEAD_STORE_PATH: file, NODE_ENV: 'production' })).toBeInstanceOf(FileLeadStore);
  });
});
