import { describe, expect, it } from 'vitest';
import { checkoutUrlFor, purchaseOpenFor, termPublished } from './offer';
import type { Tier } from './tiers';

const tier = (id: Tier['id'], over: Partial<Tier> = {}): Tier => ({ id, name: id, tagline: '', priceDisplay: '$49', checkoutUrl: 'https://pay.example/x', ...over });
const terms = { accessTerm: 'This edition.', updatesTerm: 'Its updates.' };
const approved = { terms: 'approved', refunds: 'approved', updates: 'approved' } as const;

describe('purchaseOpenFor', () => {
  it('opens only when every paid tier is priced and linked, the terms exist and the policies are approved', () => {
    expect(purchaseOpenFor([tier('basic'), tier('pro')], terms, approved)).toBe(true);
  });
  it('stays closed while any paid tier lacks a price or an https checkout link', () => {
    expect(purchaseOpenFor([tier('basic'), tier('pro', { priceDisplay: null })], terms, approved)).toBe(false);
    expect(purchaseOpenFor([tier('basic', { checkoutUrl: null }), tier('pro')], terms, approved)).toBe(false);
    expect(purchaseOpenFor([tier('basic', { checkoutUrl: 'http://pay.example/x' }), tier('pro')], terms, approved)).toBe(false);
    expect(purchaseOpenFor([], terms, approved)).toBe(false);
  });
  it('stays closed while a term is missing or a policy is a draft', () => {
    expect(purchaseOpenFor([tier('basic')], { ...terms, updatesTerm: null }, approved)).toBe(false);
    expect(purchaseOpenFor([tier('basic')], terms, { ...approved, refunds: 'draft' })).toBe(false);
  });
});

describe('the live offer', () => {
  // lib/tiers.ts ships with no prices and lib/offer.ts with no terms, so these hold until the owner fills them in
  it('links no checkout, for any tier', () => {
    expect(checkoutUrlFor('free')).toBeNull();
    expect(checkoutUrlFor('basic')).toBeNull();
    expect(checkoutUrlFor('pro')).toBeNull();
  });
  it('has published neither the updates term nor a support address', () => {
    expect(termPublished('updatesTerm')).toBe(false);
    expect(termPublished('supportEmail')).toBe(false);
  });
});
