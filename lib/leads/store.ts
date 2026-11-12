import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { productionDatabaseRefused } from '@/lib/db/production-refusal';
import { NeonLeadStore } from './neon-store';

/** `confirmTokenHash` is the SHA-256 hex of the token in the confirmation link; the raw token is never stored. */
export type NewLead = { email: string; source: string; consentVersion: string; consentText: string; confirmTokenHash: string; confirmExpiresAt: Date; at: Date };
/** What insert() reports: for a repeat, the state of the row already there, so the handler can resend a failed confirmation. */
export type Inserted = { created: boolean; id: string; emailStatus: EmailStatus | null; confirmedAt: Date | null };
export type EmailStatus = 'sent' | 'failed' | 'skipped';
/** One stored lead as the admin pages read it; the consent text and the token hash stay in the store. */
export type LeadRow = { id: string; email: string; source: string; createdAt: Date; consentVersion: string; emailStatus: EmailStatus | null; confirmedAt: Date | null; unsubscribedAt: Date | null };
/** The most a listing returns, newest first; the admin table filters client-side, so it stays in memory. */
export const LEAD_LIST_CAP = 5000;

/**
 * Where leads and the rate-limit counters live. Production uses a database so the counters are shared by every
 * server instance; the file store below is for local development and tests only.
 */
export interface LeadStore {
  /** `created` is false when the address is already on file (case-insensitive); nothing is changed then. */
  insert(lead: NewLead): Promise<Inserted>;
  setEmailStatus(id: string, status: EmailStatus): Promise<void>;
  /** Atomically elects one sender for a pending/failed/expired unconfirmed row; retries replace its old token. */
  claimConfirmation(id: string, tokenHash: string, expiresAt: Date, at: Date, retryBefore: Date): Promise<boolean>;
  /** Only the current claim may record its result; late completion cannot overwrite a successor. */
  completeConfirmation(id: string, tokenHash: string, status: EmailStatus): Promise<void>;
  /** A fresh confirmation token for a lead whose first email failed; the old link stops working. */
  resetConfirmation(id: string, tokenHash: string, expiresAt: Date): Promise<void>;
  /** Marks the lead with this token confirmed (a second click changes nothing); false when no lead has it or the link expired. */
  confirm(tokenHash: string, now: Date): Promise<boolean>;
  /** Marks the lead unsubscribed (a second click keeps the first time); false when no lead has this id. */
  unsubscribe(id: string, now: Date): Promise<boolean>;
  recordAttempt(ipHash: string, at: Date): Promise<void>;
  countAttempts(ipHash: string, since: Date): Promise<number>;
  /** Insert and in-window count in one step, including the new row, so two requests cannot both slip under the limit. */
  recordAndCount(ipHash: string, at: Date, since: Date): Promise<number>;
  /** Counts one send for the window starting then, over all callers, and answers the new total (lib/send-ceiling.ts). */
  countSend(windowStart: Date): Promise<number>;
  /** Newest first, at most LEAD_LIST_CAP rows. */
  list(): Promise<LeadRow[]>;
  /** Account deletion removes the marketing row for the same address (user-database plan, section 12.4). */
  deleteByEmail(email: string): Promise<void>;
}

// Rows written before confirmation existed have no `confirmedAt`; they read as unconfirmed, like the database's null.
type Row = Omit<NewLead, 'confirmExpiresAt'> & { id: string; emailStatus: EmailStatus | null; confirmExpiresAt?: Date | string; confirmDeliveryStartedAt?: Date | string | null; confirmedAt?: Date | string | null; unsubscribedAt?: Date | string | null };
type Shape = { leads: Row[]; attempts: { ipHash: string; at: string }[]; sends: { windowStart: string; n: number }[] };

// `at` is a Date in memory but a string once it has been through JSON, so both are accepted here.
const toLeadRow = (r: Row): LeadRow => ({ id: r.id, email: r.email, source: r.source, createdAt: new Date(r.at), consentVersion: r.consentVersion, emailStatus: r.emailStatus, confirmedAt: r.confirmedAt ? new Date(r.confirmedAt) : null, unsubscribedAt: r.unsubscribedAt ? new Date(r.unsubscribedAt) : null });
// A confirmed row answers its link whatever the expiry; an unconfirmed one only while the link is live. A row with no
// expiry (written before the column existed) never confirms.
const confirmable = (r: Row, now: Date): boolean => r.confirmedAt != null || (r.confirmExpiresAt !== undefined && new Date(r.confirmExpiresAt) > now);
const canClaimConfirmation = (r: Row, at: Date, retryBefore: Date): boolean => r.confirmedAt == null && (
  r.emailStatus === 'failed' || r.emailStatus === 'skipped' ||
  (r.confirmExpiresAt !== undefined && new Date(r.confirmExpiresAt) <= at) ||
  (r.emailStatus === null && (r.confirmDeliveryStartedAt == null || new Date(r.confirmDeliveryStartedAt) <= retryBefore))
);
const claimConfirmation = (r: Row, tokenHash: string, expiresAt: Date, at: Date): void => {
  r.confirmTokenHash = tokenHash;
  r.confirmExpiresAt = expiresAt.toISOString();
  r.emailStatus = null;
  r.confirmDeliveryStartedAt = at.toISOString();
};
const newestFirst = (rows: Row[]): LeadRow[] => rows.map(toLeadRow).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, LEAD_LIST_CAP);

export class FileLeadStore implements LeadStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly file: string) {}

  private async read(): Promise<Shape> {
    let data: Partial<Shape> | null;
    try {
      data = JSON.parse(await readFile(this.file, 'utf8')) as Partial<Shape> | null;
    } catch {
      return { leads: [], attempts: [], sends: [] };
    }
    // a hand-edited or truncated file must not break every later request: a missing or non-array field starts empty
    return { leads: Array.isArray(data?.leads) ? data.leads : [], attempts: Array.isArray(data?.attempts) ? data.attempts : [], sends: Array.isArray(data?.sends) ? data.sends : [] };
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
      if (existing) return { created: false, id: existing.id, emailStatus: existing.emailStatus, confirmedAt: existing.confirmedAt ? new Date(existing.confirmedAt) : null };
      const id = randomUUID();
      data.leads.push({ ...lead, confirmExpiresAt: lead.confirmExpiresAt.toISOString(), id, emailStatus: null, confirmedAt: null });
      return { created: true, id, emailStatus: null, confirmedAt: null };
    });
  }

  setEmailStatus(id: string, status: EmailStatus) {
    return this.change(data => { const row = data.leads.find(l => l.id === id); if (row) row.emailStatus = status; });
  }

  claimConfirmation(id: string, tokenHash: string, expiresAt: Date, at: Date, retryBefore: Date) {
    return this.change(data => {
      const row = data.leads.find(l => l.id === id);
      if (!row || !canClaimConfirmation(row, at, retryBefore)) return false;
      claimConfirmation(row, tokenHash, expiresAt, at);
      return true;
    });
  }

  completeConfirmation(id: string, tokenHash: string, status: EmailStatus) {
    return this.change(data => {
      const row = data.leads.find(l => l.id === id && l.confirmTokenHash === tokenHash);
      if (row) row.emailStatus = status;
    });
  }

  resetConfirmation(id: string, tokenHash: string, expiresAt: Date) {
    return this.change(data => { const row = data.leads.find(l => l.id === id); if (row) { row.confirmTokenHash = tokenHash; row.confirmExpiresAt = expiresAt.toISOString(); } });
  }

  confirm(tokenHash: string, now: Date) {
    return this.change(data => {
      const row = data.leads.find(l => l.confirmTokenHash === tokenHash);
      if (!row || !confirmable(row, now)) return false;
      row.confirmedAt ??= now.toISOString();
      return true;
    });
  }

  unsubscribe(id: string, now: Date) {
    return this.change(data => {
      const row = data.leads.find(l => l.id === id);
      if (!row) return false;
      row.unsubscribedAt ??= now.toISOString();
      return true;
    });
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

  countSend(windowStart: Date) {
    return this.change(data => {
      const cutoff = windowStart.getTime() - 24 * 3600 * 1000;
      data.sends = data.sends.filter(s => Date.parse(s.windowStart) >= cutoff); // keep the file small
      const key = windowStart.toISOString();
      let row = data.sends.find(s => s.windowStart === key);
      if (!row) data.sends.push((row = { windowStart: key, n: 0 }));
      return ++row.n;
    });
  }

  async list() {
    await this.queue;
    return newestFirst((await this.read()).leads);
  }

  deleteByEmail(email: string) {
    return this.change(data => { data.leads = data.leads.filter(l => l.email !== email); });
  }
}

/** In-memory store for unit tests. */
export class MemoryLeadStore implements LeadStore {
  leads: Row[] = [];
  attempts: { ipHash: string; at: Date }[] = [];
  sends = new Map<string, number>();
  failWith: Error | null = null;
  private check() { if (this.failWith) throw this.failWith; }

  async insert(lead: NewLead) {
    this.check();
    const existing = this.leads.find(l => l.email === lead.email);
    if (existing) return { created: false, id: existing.id, emailStatus: existing.emailStatus, confirmedAt: existing.confirmedAt ? new Date(existing.confirmedAt) : null };
    const row = { ...lead, id: randomUUID(), emailStatus: null, confirmedAt: null };
    this.leads.push(row);
    return { created: true, id: row.id, emailStatus: null, confirmedAt: null };
  }
  async setEmailStatus(id: string, status: EmailStatus) { const r = this.leads.find(l => l.id === id); if (r) r.emailStatus = status; }
  async claimConfirmation(id: string, tokenHash: string, expiresAt: Date, at: Date, retryBefore: Date) {
    this.check();
    const row = this.leads.find(l => l.id === id);
    if (!row || !canClaimConfirmation(row, at, retryBefore)) return false;
    claimConfirmation(row, tokenHash, expiresAt, at);
    return true;
  }
  async completeConfirmation(id: string, tokenHash: string, status: EmailStatus) {
    this.check();
    const row = this.leads.find(l => l.id === id && l.confirmTokenHash === tokenHash);
    if (row) row.emailStatus = status;
  }
  async resetConfirmation(id: string, tokenHash: string, expiresAt: Date) { this.check(); const r = this.leads.find(l => l.id === id); if (r) { r.confirmTokenHash = tokenHash; r.confirmExpiresAt = expiresAt; } }
  async confirm(tokenHash: string, now: Date) {
    this.check();
    const r = this.leads.find(l => l.confirmTokenHash === tokenHash);
    if (!r || !confirmable(r, now)) return false;
    r.confirmedAt ??= now;
    return true;
  }
  async unsubscribe(id: string, now: Date) {
    this.check();
    const r = this.leads.find(l => l.id === id);
    if (!r) return false;
    r.unsubscribedAt ??= now;
    return true;
  }
  async recordAttempt(ipHash: string, at: Date) { this.check(); this.attempts.push({ ipHash, at }); }
  async countAttempts(ipHash: string, since: Date) { this.check(); return this.attempts.filter(a => a.ipHash === ipHash && a.at >= since).length; }
  async recordAndCount(ipHash: string, at: Date, since: Date) {
    this.check();
    this.attempts.push({ ipHash, at });
    return this.attempts.filter(a => a.ipHash === ipHash && a.at >= since).length;
  }
  async countSend(windowStart: Date) {
    this.check();
    const n = (this.sends.get(windowStart.toISOString()) ?? 0) + 1;
    this.sends.set(windowStart.toISOString(), n);
    return n;
  }
  async list() { this.check(); return newestFirst(this.leads); }
  async deleteByEmail(email: string) { this.check(); this.leads = this.leads.filter(l => l.email !== email); }
}

// One file store per path for the life of the process: its write queue only serialises writes that go through the
// same instance, and requests arrive concurrently.
const fileStores = new Map<string, FileLeadStore>();
const fileStore = (file: string): FileLeadStore => {
  let store = fileStores.get(file);
  if (!store) fileStores.set(file, (store = new FileLeadStore(file)));
  return store;
};

/**
 * Picks the store from the environment: a database when DATABASE_URL is set, the throwaway file store only when
 * asked for by name, otherwise none (the route then refuses with 503). A hosted Vercel deployment (VERCEL_ENV is
 * production or preview) never gets the file store, whatever LEAD_STORE says: its disk is ephemeral and the leads
 * would vanish with the instance. `vercel dev` (VERCEL_ENV=development) and a local production build (the e2e
 * suite) may still use it. A non-production deployment whose DATABASE_URL is the production host gets none
 * instead, and this function does not open that database.
 */
export function storeFromEnv(env: Record<string, string | undefined>): LeadStore | null {
  if (productionDatabaseRefused(env)) return null;
  const hosted = Boolean(env.VERCEL_ENV) && env.VERCEL_ENV !== 'development';
  if (env.LEAD_STORE === 'file' && !hosted) return fileStore(env.LEAD_STORE_PATH ?? path.join(process.cwd(), '.data', 'leads.json'));
  if (env.DATABASE_URL) return NeonLeadStore.fromUrl(env.DATABASE_URL);
  return null;
}
