import { lemonSqueezyFromEnv, type LemonSqueezyAdapter } from './adapters/lemonsqueezy';
import { FileBillingStore } from './file-store';
import { NeonBillingStore } from './neon-store';
import type { BillingStore } from './store';

type Env = Record<string, string | undefined>;

/** File storage is local and e2e only. A hosted deploy uses the database and ignores BILLING_STORE. */
export function billingStoreFromEnv(env: Env): BillingStore | null {
  const hosted = env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'production';
  if (!hosted && env.BILLING_STORE === 'file') {
    return new FileBillingStore(env.BILLING_STORE_PATH || '.data/billing.json', env.AUTH_STORE_PATH || '.data/auth.json');
  }
  if (env.DATABASE_URL) return NeonBillingStore.fromUrl(env.DATABASE_URL);
  return null;
}

export function billingAdapterFromEnv(env: Env): LemonSqueezyAdapter | null {
  return lemonSqueezyFromEnv(env);
}
