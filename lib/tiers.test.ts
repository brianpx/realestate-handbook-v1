import { describe, expect, it } from 'vitest';
import { FEATURES, paidTiers, TIERS, tierById } from './tiers';

describe('tiers', () => {
  it('gives every feature a value for every tier', () => {
    for (const f of FEATURES) for (const t of TIERS) expect(f.values[t.id], `${f.label} / ${t.id}`).toBeDefined();
  });
  it('highlights exactly one tier', () => {
    expect(TIERS.filter(t => t.highlighted)).toHaveLength(1);
  });
  it('keeps the free tier free: no price and no checkout', () => {
    expect(tierById('free')).toMatchObject({ priceDisplay: null, checkoutUrl: null });
  });
  it('lists the paid tiers as Basic then Pro', () => {
    expect(paidTiers().map(t => t.id)).toEqual(['basic', 'pro']);
  });
  it('ships the paid tiers without a price or a checkout link', () => {
    for (const t of paidTiers()) expect(t, t.id).toMatchObject({ priceDisplay: null, checkoutUrl: null });
  });
  it('gives both paid tiers the same plain email-support cell: no priority tier was decided', () => {
    const support = FEATURES.find(f => f.label === 'Email support');
    expect(support).toBeDefined();
    expect(support?.values).toEqual({ free: false, basic: true, pro: true });
  });
  // 11 November 2026: corrections reach both paid plans; new chapters, tools and editions are Pro's, and Basic gets a discount on an edition
  it('gives both paid plans corrections and only Pro the additions and later editions', () => {
    const corrections = FEATURES.find(f => f.label === 'Corrections and improvements to edition 1.0');
    expect(corrections?.values).toEqual({ free: false, basic: true, pro: true });
    const additions = FEATURES.find(f => f.label === 'New chapters, tools and editions');
    expect(additions?.values).toEqual({ free: false, basic: 'Discount on a new edition', pro: 'Included' });
    expect(corrections?.publishedWhen).toBe('updatesTerm');
    expect(additions?.publishedWhen).toBe('updatesTerm');
  });
});
