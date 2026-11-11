import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FileAuthStore } from '@/lib/auth/file-store';
import { entitlement } from './entitlement';
import { grantAccess } from './grants';
import { recomputeMembership } from './membership';
import { MemoryAccessStore } from './memory-store';
import type { AccessStore } from './store';

const NOW = new Date('2026-11-10T00:00:00Z');
const ACTOR = { kind: 'admin' as const, userId: 'admin' };
const STUB = { at: NOW, actorUserId: 'admin', actorKind: 'admin' as const, action: 'membership.suspend' as const, reason: 'hold', ipHash: null };
const dirs: string[] = [];
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });

async function makeStore(kind: 'memory' | 'file'): Promise<AccessStore> {
  if (kind === 'memory') return new MemoryAccessStore();
  const dir = await mkdtemp(path.join(tmpdir(), 'reh-suspension-race-'));
  dirs.push(dir);
  return new FileAuthStore(path.join(dir, 'auth.json'));
}

for (const kind of ['memory', 'file'] as const) describe(`${kind} membership projection races`, () => {
  it('keeps a suspension completed between the grant read and projection write, including its returned viewer state', async () => {
    const store = await makeStore(kind);
    await grantAccess(store, { userId: 'u', kind: 'complimentary', tier: 'pro', grantedBy: 'admin' }, ACTOR, NOW);
    const save = store.saveMembership.bind(store);
    vi.spyOn(store, 'saveMembership').mockImplementationOnce(async projection => {
      await store.suspend('u', { at: NOW, by: 'admin', reason: 'hold' }, STUB);
      return save(projection);
    });
    const refreshed = await recomputeMembership(store, 'u', NOW);
    expect(refreshed).toMatchObject({ status: 'suspended', suspendedAt: NOW, suspendedBy: 'admin', suspendReason: 'hold' });
    expect(entitlement({ status: 'active', snapshot: await store.loadAccess('u'), now: NOW })).toEqual({ level: 'preview', suspended: true });
  });

  it('does not restore a suspension lifted between the grant read and projection write', async () => {
    const store = await makeStore(kind);
    await grantAccess(store, { userId: 'u', kind: 'complimentary', tier: 'pro', grantedBy: 'admin' }, ACTOR, NOW);
    await store.suspend('u', { at: NOW, by: 'admin', reason: 'hold' }, STUB);
    const save = store.saveMembership.bind(store);
    vi.spyOn(store, 'saveMembership').mockImplementationOnce(async projection => {
      await store.unsuspend('u', NOW, { ...STUB, action: 'membership.unsuspend' });
      return save(projection);
    });
    const refreshed = await recomputeMembership(store, 'u', NOW);
    expect(refreshed).toMatchObject({ status: 'active', suspendedAt: null, suspendedBy: null, suspendReason: null });
    expect(entitlement({ status: 'active', snapshot: await store.loadAccess('u'), now: NOW })).toEqual({ level: 'member', tier: 'pro' });
  });
});
