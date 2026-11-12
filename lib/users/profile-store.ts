import { productionDatabaseRefused } from '@/lib/db/production-refusal';
import { sqlFromUrl } from '@/lib/db/sql';
import type { Profile, ProfileFields, ProfileSource } from './profile';
import { NeonProfileStore } from './profile-neon-store';

/**
 * Where realtor profiles live (db/migrations/006_realtor_profiles.sql). Production uses the database; the memory
 * store is for unit tests. There is no file store: the profile is the one account feature the throwaway file setup
 * (AUTH_STORE=file) does not offer, and the account page says so instead of showing the form.
 */
export interface ProfileStore {
  /** Null is the normal case for a user who has never filled the form. */
  find(userId: string): Promise<Profile | null>;
  /** Writes every editable field, creating the row on the first save; the survey's and the verification columns are left alone. */
  save(userId: string, fields: ProfileFields, source: ProfileSource, at: Date): Promise<Profile>;
  /** Account deletion: the user row is anonymised rather than removed, so the cascade never fires and this does the job. */
  deleteByUser(userId: string): Promise<void>;
}

/** In-memory store for unit tests. */
export class MemoryProfileStore implements ProfileStore {
  profiles: Profile[] = [];
  failWith: Error | null = null;
  private check() { if (this.failWith) throw this.failWith; }

  async find(userId: string) { this.check(); return this.profiles.find(p => p.userId === userId) ?? null; }
  async save(userId: string, fields: ProfileFields, source: ProfileSource, at: Date) {
    this.check();
    const profile: Profile = { ...fields, userId, profileSource: source, updatedAt: at };
    const i = this.profiles.findIndex(p => p.userId === userId);
    if (i >= 0) this.profiles[i] = profile; else this.profiles.push(profile);
    return profile;
  }
  async deleteByUser(userId: string) { this.check(); this.profiles = this.profiles.filter(p => p.userId !== userId); }
}

/**
 * The database store when DATABASE_URL is set, otherwise none (the route answers 503; the page shows a note).
 * A non-production deployment pointed at the production host is also none, and this function does not open it.
 */
export function profileStoreFromEnv(env: Record<string, string | undefined>): ProfileStore | null {
  if (productionDatabaseRefused(env)) return null;
  return env.DATABASE_URL ? new NeonProfileStore(sqlFromUrl(env.DATABASE_URL)) : null;
}
