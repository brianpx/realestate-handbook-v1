import { describe, expect, it, vi } from 'vitest';
import { NeonLeadStore, type Sql } from './neon-store';

// A fake of the tagged-template query function: it records each statement and answers from a queue.
function fake(...answers: Record<string, unknown>[][]) {
  const calls: { text: string; values: unknown[] }[] = [];
  const sql: Sql = async (strings, ...values) => {
    calls.push({ text: strings.join('?').replace(/\s+/g, ' ').trim(), values });
    return answers.shift() ?? [];
  };
  return { sql, calls };
}
const lead = { email: 'a@b.co', source: 'gate', consentVersion: 'v1', consentText: 'text', at: new Date('2026-11-02T12:00:00Z') };

describe('NeonLeadStore', () => {
  it('inserts a new address in one statement and reports it as created', async () => {
    const { sql, calls } = fake([{ id: 'u-1' }]);
    expect(await new NeonLeadStore(sql).insert(lead)).toEqual({ created: true, id: 'u-1' });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.text).toContain('on conflict (email) do nothing');
    expect(calls[0]!.values).toEqual(['a@b.co', 'gate', 'v1', 'text', '2026-11-02T12:00:00.000Z']); // values are bound, never spliced in
  });
  it('reports a repeat as not created and returns the existing id', async () => {
    const { sql, calls } = fake([], [{ id: 'u-9' }]);
    expect(await new NeonLeadStore(sql).insert(lead)).toEqual({ created: false, id: 'u-9' });
    expect(calls[1]!.text).toBe('select id from leads where email = ?');
  });
  it('records the email outcome against the lead', async () => {
    const { sql, calls } = fake([]);
    await new NeonLeadStore(sql).setEmailStatus('u-1', 'failed');
    expect(calls[0]).toEqual({ text: 'update leads set email_status = ? where id = ?', values: ['failed', 'u-1'] });
  });
  it('records an attempt with the hash and time, and counts them within the window', async () => {
    const { sql, calls } = fake([], [{ n: 3 }]);
    const store = new NeonLeadStore(sql);
    await store.recordAttempt('hash', new Date('2026-11-02T12:00:00Z'));
    expect(await store.countAttempts('hash', new Date('2026-11-02T11:50:00Z'))).toBe(3);
    expect(calls[0]!.values).toEqual(['hash', '2026-11-02T12:00:00.000Z']);
    expect(calls.at(-1)!.values).toEqual(['hash', '2026-11-02T11:50:00.000Z']);
  });
  it('counts zero when the query returns nothing', async () => {
    expect(await new NeonLeadStore(fake([]).sql).countAttempts('h', new Date())).toBe(0);
  });
  it('inserts and counts in one statement, and still returns the count when cleanup throws', async () => {
    const { sql, calls } = fake([{ n: 4 }]);
    const cleanup = new Error('delete failed');
    cleanup.name = 'CleanupError';
    const flaky: Sql = async (strings, ...values) => {
      if (strings.join('').includes('delete')) throw cleanup;
      return sql(strings, ...values);
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const at = new Date('2026-11-02T12:00:00Z');
      const since = new Date('2026-11-02T11:50:00Z');
      await expect(new NeonLeadStore(flaky).recordAndCount('ip-hash-1', at, since)).resolves.toBe(4);
      expect(calls).toHaveLength(1);
      expect(calls[0]!.text).toContain('insert into lead_attempts');
      expect(calls[0]!.text).toContain('count(');
      expect(calls[0]!.text).not.toContain('ip-hash-1');
      expect(calls[0]!.values).toEqual(['ip-hash-1', at.toISOString(), 'ip-hash-1', since.toISOString(), since.toISOString()]);
      expect(spy).toHaveBeenCalledWith('lead: attempt cleanup failed', 'CleanupError');
    } finally {
      spy.mockRestore();
    }
  });
});
