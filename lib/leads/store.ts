import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NeonLeadStore } from './neon-store';

export type NewLead = { email: string; source: string; consentVersion: string; consentText: string; at: Date };
export type EmailStatus = 'sent' | 'failed' | 'skipped';
/** One stored lead as the admin pages read it; the consent text stays in the store. */
export type LeadRow = { id: string; email: string; source: string; createdAt: Date; consentVersion: string; emailStatus: EmailStatus | null };
/** The most a listing returns, newest first; the admin table filters client-side, so it stays in memory. */
export const LEAD_LIST_CAP = 5000;

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
  /** Insert and in-window count in one step, including the new row, so two requests cannot both slip under the limit. */
  recordAndCount(ipHash: string, at: Date, since: Date): Promise<number>;
  /** Newest first, at most LEAD_LIST_CAP rows. */
  list(): Promise<LeadRow[]>;
}

type Row = NewLead & { id: string; emailStatus: EmailStatus | null };
type Shape = { leads: Row[]; attempts: { ipHash: string; at: string }[] };

// `at` is a Date in memory but a string once it has been through JSON, so both are accepted here.
const toLeadRow = (r: Row): LeadRow => ({ id: r.id, email: r.email, source: r.source, createdAt: new Date(r.at), consentVersion: r.consentVersion, emailStatus: r.emailStatus });
const newestFirst = (rows: Row[]): LeadRow[] => rows.map(toLeadRow).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, LEAD_LIST_CAP);

export class FileLeadStore implements LeadStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly file: string) {}

  private async read(): Promise<Shape> {
    let data: Partial<Shape> | null;
    try {
      data = JSON.parse(await readFile(this.file, 'utf8')) as Partial<Shape> | null;
    } catch {
      return { leads: [], attempts: [] };
    }
    // a hand-edited or truncated file must not break every later request: a missing or non-array field starts empty
    return { leads: Array.isArray(data?.leads) ? data.leads : [], attempts: Array.isArray(data?.attempts) ? data.attempts : [] };
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

  recordAndCount(ipHash: string, at: Date, since: Date) {
    return this.change(data => {
      const cutoff = at.getTime() - 24 * 3600 * 1000;
      data.attempts = data.attempts.filter(a => Date.parse(a.at) >= cutoff); // keep the file small
      data.attempts.push({ ipHash, at: at.toISOString() });
      return data.attempts.filter(a => a.ipHash === ipHash && Date.parse(a.at) >= since.getTime()).length;
    });
  }

  async list() {
    await this.queue;
    return newestFirst((await this.read()).leads);
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
  async recordAndCount(ipHash: string, at: Date, since: Date) {
    this.check();
    this.attempts.push({ ipHash, at });
    return this.attempts.filter(a => a.ipHash === ipHash && a.at >= since).length;
  }
  async list() { this.check(); return newestFirst(this.leads); }
}

/**
 * Picks the store from the environment: a database when DATABASE_URL is set, the throwaway file store only when
 * asked for by name, otherwise none (the route then refuses with 503). A hosted Vercel deployment (VERCEL_ENV is
 * production or preview) never gets the file store, whatever LEAD_STORE says: its disk is ephemeral and the leads
 * would vanish with the instance. `vercel dev` (VERCEL_ENV=development) and a local production build (the e2e
 * suite) may still use it.
 */
export function storeFromEnv(env: Record<string, string | undefined>): LeadStore | null {
  const hosted = Boolean(env.VERCEL_ENV) && env.VERCEL_ENV !== 'development';
  if (env.LEAD_STORE === 'file' && !hosted) return new FileLeadStore(env.LEAD_STORE_PATH ?? path.join(process.cwd(), '.data', 'leads.json'));
  if (env.DATABASE_URL) return NeonLeadStore.fromUrl(env.DATABASE_URL);
  return null;
}
