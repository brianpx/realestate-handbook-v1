import { describe, expect, it } from 'vitest';
import { checkoutUrlFor, OFFER, OWNER, purchaseOpen, purchaseOpenFor, REFUND_DAYS, termPublished } from './offer';
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
  // owner decision of 11 November 2026: 14 days, any reason, counted per purchase
  it('refunds within 14 days', () => {
    expect(REFUND_DAYS).toBe(14);
  });
  // lib/tiers.ts ships with no prices or checkout links, so purchase stays closed whatever else the owner has entered
  it('stays closed and links no checkout, for any tier', () => {
    expect(purchaseOpen()).toBe(false);
    expect(checkoutUrlFor('free')).toBeNull();
    expect(checkoutUrlFor('basic')).toBeNull();
    expect(checkoutUrlFor('pro')).toBeNull();
  });
  // OD-20 and OD-23: the terms, the support address, and a temporary seller name and postal address. No price or checkout.
  it('has published the two terms and the support address', () => {
    expect(OFFER.accessTerm).toBe('Lifetime access to edition 1.0 for one person, on their own devices; not transferable. Pro also covers later editions.');
    expect(OFFER.updatesByPlan.basic).toBe('Corrections and improvements to the chapters and essential tools of edition 1.0 are included; a future edition is a separate purchase at a discount for existing buyers.');
    expect(OFFER.updatesByPlan.pro).toBe('Everything in Basic, plus every new chapter, tool and script added to the handbook and every future edition, at no further charge, for as long as the handbook is published.');
    expect(OFFER.updatesTerm).toBe(`Basic: ${OFFER.updatesByPlan.basic} Pro: ${OFFER.updatesByPlan.pro}`);
    expect(OWNER.supportEmail).toBe('support@findnurturekeep.com');
    expect(termPublished('updatesTerm')).toBe(true);
    expect(termPublished('supportEmail')).toBe(true);
  });
  it('names the seller and shows the temporary postal address', () => {
    expect(OWNER.businessName).toBe('Brian Pitts');
    expect(OWNER.postalAddress).toBe('synthetic temp address');
  });

  it('builds a signed-in checkout link from the env url and stays null while that url is unset', () => {
    const previous = {
      basic: process.env.BILLING_CHECKOUT_URL_BASIC,
      pro: process.env.BILLING_CHECKOUT_URL_PRO,
    };
    try {
      delete process.env.BILLING_CHECKOUT_URL_BASIC;
      delete process.env.BILLING_CHECKOUT_URL_PRO;
      expect(checkoutUrlFor({ tierId: 'basic', userId: 'user 1', email: 'a@b.co' })).toBeNull();
      expect(checkoutUrlFor('basic')).toBeNull();
      process.env.BILLING_CHECKOUT_URL_BASIC = 'http://pay.example/basic';
      expect(checkoutUrlFor({ tierId: 'basic', userId: 'user 1', email: 'a@b.co' })).toBeNull();
      process.env.BILLING_CHECKOUT_URL_BASIC = 'https://pay.example/basic';
      expect(checkoutUrlFor({ tierId: 'basic', userId: 'user 1', email: 'a@b.co' })).toBe(
        'https://pay.example/basic?checkout[email]=a%40b.co&checkout[custom][user_id]=user%201',
      );
      process.env.BILLING_CHECKOUT_URL_PRO = 'https://pay.example/pro?x=1';
      expect(checkoutUrlFor({ tierId: 'pro', userId: 'u', email: 'a@b.co' })).toBe(
        'https://pay.example/pro?x=1&checkout[email]=a%40b.co&checkout[custom][user_id]=u',
      );
      expect(checkoutUrlFor({ tierId: 'free', userId: 'u', email: 'a@b.co' })).toBeNull();
      expect(checkoutUrlFor('pro')).toBeNull();
    } finally {
      restore('BILLING_CHECKOUT_URL_BASIC', previous.basic);
      restore('BILLING_CHECKOUT_URL_PRO', previous.pro);
    }
  });
});

function restore(name: 'BILLING_CHECKOUT_URL_BASIC' | 'BILLING_CHECKOUT_URL_PRO', value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
