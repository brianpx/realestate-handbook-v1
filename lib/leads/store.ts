import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type NewLead = { email: string; source: string; consentVersion: string; consentText: string; at: Date };
export type EmailStatus = 'sent' | 'failed' | 'skipped';

/**
 * Where leads and the rate-limit counters live. Production uses a database so the counters are shared by every
 * server instance; the file store below is for local development and tests only.
 */
export interface LeadStore {
  /** `created` is false when the address is already on file (case-insensitive); nothing is changed then. */
  insert(lead: NewLead): Promise<{ created: boolean; id: string }>;
  setEmailStatus(id: string, status: EmailStatus): Promise<void>;
  recordAttempt(ipHash: string, at: Date): Promise<void>;
  countAttempts(ipHash: string, since: Date): Promise<number>;
}

type Row = NewLead & { id: string; emailStatus: EmailStatus | null };
type Shape = { leads: Row[]; attempts: { ipHash: string; at: string }[] };

export class FileLeadStore implements LeadStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly file: string) {}

  private async read(): Promise<Shape> {
    try {
      return JSON.parse(await readFile(this.file, 'utf8')) as Shape;
    } catch {
      return { leads: [], attempts: [] };
    }
  }

  // one change at a time, written to a temp file then renamed, so a crash never leaves half a file
  private change<T>(fn: (data: Shape) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const data = await this.read();
      const result = fn(data);
      await mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(data));
      await rename(tmp, this.file);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  insert(lead: NewLead) {
    return this.change(data => {
      const existing = data.leads.find(l => l.email === lead.email);
      if (existing) return { created: false, id: existing.id };
      const id = randomUUID();
      data.leads.push({ ...lead, id, emailStatus: null });
      return { created: true, id };
    });
  }

  setEmailStatus(id: string, status: EmailStatus) {
    return this.change(data => { const row = data.leads.find(l => l.id === id); if (row) row.emailStatus = status; });
  }

  recordAttempt(ipHash: string, at: Date) {
    return this.change(data => {
      const cutoff = at.getTime() - 24 * 3600 * 1000;
      data.attempts = data.attempts.filter(a => Date.parse(a.at) >= cutoff); // keep the file small
      data.attempts.push({ ipHash, at: at.toISOString() });
    });
  }

  async countAttempts(ipHash: string, since: Date) {
    await this.queue;
    return (await this.read()).attempts.filter(a => a.ipHash === ipHash && Date.parse(a.at) >= since.getTime()).length;
  }
}

/** In-memory store for unit tests. */
export class MemoryLeadStore implements LeadStore {
  leads: Row[] = [];
  attempts: { ipHash: string; at: Date }[] = [];
  failWith: Error | null = null;
  private check() { if (this.failWith) throw this.failWith; }

  async insert(lead: NewLead) {
    this.check();
    const existing = this.leads.find(l => l.email === lead.email);
    if (existing) return { created: false, id: existing.id };
    const row = { ...lead, id: randomUUID(), emailStatus: null };
    this.leads.push(row);
    return { created: true, id: row.id };
  }
  async setEmailStatus(id: string, status: EmailStatus) { const r = this.leads.find(l => l.id === id); if (r) r.emailStatus = status; }
  async recordAttempt(ipHash: string, at: Date) { this.check(); this.attempts.push({ ipHash, at }); }
  async countAttempts(ipHash: string, since: Date) { this.check(); return this.attempts.filter(a => a.ipHash === ipHash && a.at >= since).length; }
}

/** Picks the store from the environment. Returns null when none is configured, so the route can refuse cleanly. */
export function storeFromEnv(env: Record<string, string | undefined>): LeadStore | null {
  if (env.LEAD_STORE === 'file') return new FileLeadStore(env.LEAD_STORE_PATH ?? path.join(process.cwd(), '.data', 'leads.json'));
  // A database-backed store is added with the Neon setup (DATABASE_URL); until then production has no store.
  return null;
}
