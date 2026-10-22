import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileLeadStore, storeFromEnv } from './store';

let dir: string;
let file: string;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'leads-')); file = path.join(dir, 'nested', 'leads.json'); });
afterEach(() => rm(dir, { recursive: true, force: true }));

const lead = (email: string) => ({ email, source: 'gate', consentVersion: 'v1', consentText: 'text', at: new Date('2026-11-02T12:00:00Z') });

describe('FileLeadStore', () => {
  it('creates its folder, stores a lead once and keeps the first record for a repeat', async () => {
    const store = new FileLeadStore(file);
    const first = await store.insert(lead('a@b.co'));
    const again = await store.insert(lead('a@b.co'));
    expect(first.created).toBe(true);
    expect(again).toEqual({ created: false, id: first.id });
    const saved = JSON.parse(await readFile(file, 'utf8'));
    expect(saved.leads).toHaveLength(1);
  });
  it('records the email outcome against the lead', async () => {
    const store = new FileLeadStore(file);
    const { id } = await store.insert(lead('a@b.co'));
    await store.setEmailStatus(id, 'failed');
    expect(JSON.parse(await readFile(file, 'utf8')).leads[0].emailStatus).toBe('failed');
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
});

describe('storeFromEnv', () => {
  it('is on only by explicit choice, and otherwise there is no store', () => {
    expect(storeFromEnv({})).toBeNull();
    expect(storeFromEnv({ NODE_ENV: 'production' })).toBeNull();
    expect(storeFromEnv({ LEAD_STORE: 'file', LEAD_STORE_PATH: file })).toBeInstanceOf(FileLeadStore);
    expect(storeFromEnv({ DATABASE_URL: 'postgres://u:p@ep-x.us-east-1.aws.neon.tech/db' })?.constructor.name).toBe('NeonLeadStore');
  });
});
