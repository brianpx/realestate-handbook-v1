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
});
