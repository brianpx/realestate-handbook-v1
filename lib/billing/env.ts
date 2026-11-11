import { DEFAULT_NEXT_PATH, TERMS_VERSION } from '@/lib/auth/config';
import { authMailFromEnv, sendReadyLink } from '@/lib/auth/mail';
import { tokenExpiry } from '@/lib/auth/session';
import { authStoresFromEnv } from '@/lib/auth/store';
import { hashSecret, newSecret } from '@/lib/auth/token';
import { lemonSqueezyFromEnv, type LemonSqueezyAdapter } from './adapters/lemonsqueezy';
import { FileBillingStore } from './file-store';
import { NeonBillingStore } from './neon-store';
import type { ProcessDeps } from './process-event';
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

/** Store, adapter and the ready-email mailer. Null until the provider and a webhook secret are set and a store exists. */
export function billingWebhookDeps(env: Env): ProcessDeps | null {
  const store = billingStoreFromEnv(env);
  const adapter = billingAdapterFromEnv(env);
  if (!store || !adapter) return null;
  return {
    store,
    adapter,
    now: () => new Date(),
    mail: authMailFromEnv(env),
    issueSignIn: async (email, at) => {
      const auth = authStoresFromEnv(env);
      if (!auth) {
        const error = new Error('auth');
        error.name = 'AuthStoreMissing';
        throw error;
      }
      const raw = newSecret();
      await auth.auth.createToken({
        tokenHash: hashSecret(raw),
        email,
        nextPath: DEFAULT_NEXT_PATH,
        termsVersion: TERMS_VERSION,
        source: null,
        expiresAt: tokenExpiry(at),
        createdIpHash: null,
        createdAt: at,
      });
      return raw;
    },
    sendReady: sendReadyLink,
  };
}
