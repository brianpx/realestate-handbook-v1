import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FileBillingStore } from './file-store';
import type { MirrorInput } from './types';

const NOW = new Date('2026-11-10T12:00:00.000Z');
const LATER = new Date('2026-11-10T13:00:00.000Z');

function paid(userId: string, over: Partial<MirrorInput> = {}): MirrorInput {
  return {
    provider: 'lemonsqueezy', providerObjectId: '99', kind: 'purchase', tier: 'basic', productKey: 'handbook-v1',
    status: 'paid', providerStatus: 'paid', userId, customerId: '55', customerEmail: 'buyer@e2e.test',
    providerPaymentId: null, providerPriceId: '2357693', amountCents: 4321, currency: 'USD',
    paidAt: NOW, refundedAt: null, disputedAt: null, trialEndsAt: null, currentPeriodStart: null, currentPeriodEnd: null,
    cancelRequestedAt: null, cancelEffectiveAt: null, accessEndsAt: null, lastEventAt: NOW, notes: null,
    manageUrl: 'https://pay.example/receipt', grant: 'grant', revokeReason: null,
    actor: { kind: 'webhook', userId: null }, at: NOW, ...over,
  };
}

describe('FileBillingStore', () => {
  it('writes the grant into the auth file and keeps keys it does not own', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'reh-bill-'));
    const authFile = path.join(dir, 'auth.json');
    const billingFile = path.join(dir, 'billing.json');
    const store = new FileBillingStore(billingFile, authFile);
    const admin = await store.createReader('admin@e2e.test', NOW);
    const auth = JSON.parse(await readFile(authFile, 'utf8')) as { users: { role: string }[]; note?: string };
    auth.note = 'keep';
    auth.users[0]!.role = 'admin';
    await writeFile(authFile, JSON.stringify(auth));

    const buyer = await store.createReader('buyer@e2e.test', NOW);
    expect(buyer).toMatchObject({ role: 'reader', status: 'active', emailVerifiedAt: null });
    const mirrored = await store.commitMirror(paid(buyer.id));
    expect(mirrored.applied).toBe(true);

    const saved = JSON.parse(await readFile(authFile, 'utf8')) as {
      note?: string;
      users: { email: string; role: string; emailVerifiedAt: string | null }[];
      grants: { userId: string; tier: string; revokedAt: string | null }[];
      billing: { status: string; userId: string }[];
      audit: { action: string }[];
    };
    expect(saved.note).toBe('keep');
    expect(saved.users.find(u => u.email === 'admin@e2e.test')?.role).toBe('admin');
    expect(saved.users.find(u => u.email === 'buyer@e2e.test')).toMatchObject({ role: 'reader', emailVerifiedAt: null });
    expect(saved.grants).toHaveLength(1);
    expect(saved.billing[0]).toMatchObject({ status: 'paid', userId: buyer.id });
    expect(saved.audit.map(a => a.action)).toEqual(['billing.event']);

    await store.commitMirror(paid(buyer.id, {
      status: 'refunded', providerStatus: 'refunded', grant: 'revoke', revokeReason: 'refund',
      accessEndsAt: LATER, refundedAt: LATER, lastEventAt: LATER, at: LATER,
    }));
    const after = JSON.parse(await readFile(authFile, 'utf8')) as { note?: string; grants: { revokedAt: string | null; revokeReason: string }[]; users: { email: string; role: string }[] };
    expect(after.note).toBe('keep');
    expect(after.grants[0]?.revokeReason).toBe('refund');
    expect(after.grants[0]?.revokedAt).toBe(LATER.toISOString());
    expect(after.users.find(u => u.email === 'buyer@e2e.test')?.role).toBe('reader');
    expect(after.grants).toHaveLength(1);
  });
});
