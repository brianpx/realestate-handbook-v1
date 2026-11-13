import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { productionDatabaseRefused } from '@/lib/db/production-refusal';
import { sqlFromUrl } from '@/lib/db/sql';
import { EMPTY_BILLING, type BillingInfo, type BillingPatch } from './billing-info';
import { NeonBillingInfoStore } from './billing-info-neon-store';

/**
 * Where the invoice details live (db/migrations/010_billing_info.sql). Production uses the database; the memory
 * store is for unit tests and the file store for local development and e2e.
 */
export interface BillingInfoStore {
  /** Null is the normal case for a user who has never saved a card. */
  find(userId: string): Promise<BillingInfo | null>;
  /**
   * Writes only the fields in the patch, creating the row on the first save; every other field keeps its value.
   * Null when the user is no longer active (the database store checks in the write itself).
   */
  save(userId: string, patch: BillingPatch, at: Date): Promise<BillingInfo | null>;
  /** Account deletion: the user row is anonymised rather than removed, so the cascade never fires and this does the job. */
  deleteByUser(userId: string): Promise<void>;
}

const merge = (current: BillingInfo | null, userId: string, patch: BillingPatch, at: Date): BillingInfo => ({ ...(current ?? EMPTY_BILLING), ...patch, userId, updatedAt: at });

/** In-memory store for unit tests. */
export class MemoryBillingInfoStore implements BillingInfoStore {
  rows: BillingInfo[] = [];
  failWith: Error | null = null;
  private check() { if (this.failWith) throw this.failWith; }

  async find(userId: string) { this.check(); return this.rows.find(r => r.userId === userId) ?? null; }
  async save(userId: string, patch: BillingPatch, at: Date) {
    this.check();
    const i = this.rows.findIndex(r => r.userId === userId);
    const row = merge(i >= 0 ? this.rows[i]! : null, userId, patch, at);
    if (i >= 0) this.rows[i] = row; else this.rows.push(row);
    return row;
  }
  async deleteByUser(userId: string) { this.check(); this.rows = this.rows.filter(r => r.userId !== userId); }
}

type Disk = Record<string, BillingInfo | undefined>;

/**
 * A JSON file for local development and e2e, next to the throwaway auth file. Reads and writes go through one queue
 * per file, and each write lands by rename, so a request never reads a half-written file.
 */
export class FileBillingInfoStore implements BillingInfoStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly file: string) {}

  find(userId: string) { return this.run(async () => revive((await this.read())[userId])); }
  save(userId: string, patch: BillingPatch, at: Date) {
    return this.run(async () => {
      const disk = await this.read();
      const row = merge(revive(disk[userId]), userId, patch, at);
      disk[userId] = row;
      await this.write(disk);
      return row;
    });
  }
  deleteByUser(userId: string) {
    return this.run(async () => {
      const disk = await this.read();
      if (!(userId in disk)) return;
      delete disk[userId];
      await this.write(disk);
    });
  }

  private run<T>(job: () => Promise<T>): Promise<T> {
    const next = this.queue.then(job, job);
    this.queue = next.catch(() => undefined);
    return next;
  }
  private async read(): Promise<Disk> {
    try {
      return JSON.parse(await readFile(this.file, 'utf8')) as Disk;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw err;
    }
  }
  private async write(disk: Disk) {
    await mkdir(path.dirname(this.file), { recursive: true });
    const temp = `${this.file}.${randomUUID()}.tmp`;
    try {
      await writeFile(temp, JSON.stringify(disk), { encoding: 'utf8', mode: 0o600 });
      await rename(temp, this.file);
    } catch (err) {
      await rm(temp, { force: true });
      throw err;
    }
  }
}

// JSON has no Date: the stamp comes back as the string it was written as.
const revive = (row: BillingInfo | undefined): BillingInfo | null => (row ? { ...row, updatedAt: new Date(row.updatedAt) } : null);

// One file store per path for the life of the process, so its queue sees every request.
const fileStores = new Map<string, FileBillingInfoStore>();

/**
 * The database store when DATABASE_URL is set; the throwaway file only when AUTH_STORE=file asks for it and only
 * outside a hosted deployment (its disk is ephemeral); otherwise none (the route answers 503; the page shows a note).
 * A non-production deployment pointed at the production host is also none, and this function does not open it.
 */
export function billingInfoStoreFromEnv(env: Record<string, string | undefined>): BillingInfoStore | null {
  if (productionDatabaseRefused(env)) return null;
  const hosted = Boolean(env.VERCEL_ENV) && env.VERCEL_ENV !== 'development';
  if (env.AUTH_STORE === 'file' && !hosted) {
    const authFile = env.AUTH_STORE_PATH ?? path.join(process.cwd(), '.data', 'auth.json');
    const file = env.BILLING_INFO_STORE_PATH ?? path.join(path.dirname(authFile), 'billing-info.json');
    let store = fileStores.get(file);
    if (!store) fileStores.set(file, (store = new FileBillingInfoStore(file)));
    return store;
  }
  return env.DATABASE_URL ? new NeonBillingInfoStore(sqlFromUrl(env.DATABASE_URL)) : null;
}
