import { describe, expect, it } from 'vitest';
import { checkoutUrlFor, OFFER, OWNER, purchaseOpen, purchaseOpenFor, REFUND_DAYS, termPublished, upgradeFor, upgradeOffered, upgradePriceDisplay } from './offer';
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

describe('upgradePriceDisplay', () => {
  it('is Pro minus Basic, in dollars the way the prices are written', () => {
    expect(upgradePriceDisplay([tier('basic', { priceDisplay: '$79' }), tier('pro', { priceDisplay: '$129' })])).toBe('$50');
    expect(upgradePriceDisplay([tier('basic', { priceDisplay: '$79.50' }), tier('pro', { priceDisplay: '$129' })])).toBe('$49.50');
  });
  it('is null while either price is unset, not a plain dollar amount, or Pro is not above Basic', () => {
    expect(upgradePriceDisplay([tier('basic', { priceDisplay: null }), tier('pro', { priceDisplay: '$129' })])).toBeNull();
    expect(upgradePriceDisplay([tier('basic', { priceDisplay: '$79' }), tier('pro', { priceDisplay: null })])).toBeNull();
    expect(upgradePriceDisplay([tier('basic', { priceDisplay: '79 dollars' }), tier('pro', { priceDisplay: '$129' })])).toBeNull();
    expect(upgradePriceDisplay([tier('basic', { priceDisplay: '$129' }), tier('pro', { priceDisplay: '$129' })])).toBeNull();
    expect(upgradePriceDisplay([])).toBeNull();
  });
  it('is null on the live tiers, which ship without prices', () => {
    expect(upgradePriceDisplay()).toBeNull();
  });
});

describe('the upgrade offer', () => {
  const basicMember = { level: 'member', tier: 'basic' } as const;
  const user = { id: 'user 1', email: 'a@b.co' };

  // lib/tiers.ts ships with no prices, so purchase is closed and no upgrade is on sale whatever the environment says
  it('is not on sale while purchase is closed, even with an upgrade link set', () => {
    const previous = process.env.BILLING_CHECKOUT_URL_UPGRADE;
    try {
      process.env.BILLING_CHECKOUT_URL_UPGRADE = 'https://pay.example/upgrade';
      expect(upgradeOffered()).toBe(false);
      expect(upgradeFor(basicMember, user)).toBeNull();
    } finally {
      if (previous === undefined) delete process.env.BILLING_CHECKOUT_URL_UPGRADE;
      else process.env.BILLING_CHECKOUT_URL_UPGRADE = previous;
    }
  });
  it('gives a Basic member a link that names them, once the upgrade is on sale', () => {
    const on = { open: true, price: '$50', base: 'https://pay.example/upgrade' };
    expect(upgradeOffered(on)).toBe(true);
    expect(upgradeFor(basicMember, user, on)).toEqual({
      href: 'https://pay.example/upgrade?checkout[email]=a%40b.co&checkout[custom][user_id]=user%201',
      price: '$50',
    });
    expect(upgradeFor(basicMember, user, { ...on, base: 'https://pay.example/upgrade?x=1' })?.href).toContain('?x=1&checkout[email]=');
  });
  it('needs purchase open, a price and a link', () => {
    const on = { open: true, price: '$50', base: 'https://pay.example/upgrade' };
    for (const off of [{ ...on, open: false }, { ...on, price: null }, { ...on, base: null }]) {
      expect(upgradeOffered(off)).toBe(false);
      expect(upgradeFor(basicMember, user, off)).toBeNull();
    }
  });
  it('is shown to no one but a Basic member', () => {
    for (const e of [{ level: 'none' }, { level: 'preview', suspended: false }, { level: 'preview', suspended: true }, { level: 'member', tier: 'pro' }] as const) {
      expect(upgradeFor(e, user)).toBeNull();
    }
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
  // the owner's 9 November 2026 inputs (OD-20, OD-23): the terms and the support address, but no price, checkout or postal address
  it('has published the two terms and the support address', () => {
    expect(OFFER.accessTerm).toBe('Lifetime access to edition 1.0 for one person, on their own devices; not transferable. Pro also covers later editions.');
    expect(OFFER.updatesByPlan.basic).toBe('Corrections and improvements to the chapters and essential tools of edition 1.0 are included; a future edition is a separate purchase at a discount for existing buyers.');
    expect(OFFER.updatesByPlan.pro).toBe('Everything in Basic, plus every new chapter, tool and script added to the handbook and every future edition, at no further charge, for as long as the handbook is published.');
    expect(OFFER.updatesTerm).toBe(`Basic: ${OFFER.updatesByPlan.basic} Pro: ${OFFER.updatesByPlan.pro}`);
    expect(OWNER.supportEmail).toBe('support@findnurturekeep.com');
    expect(termPublished('updatesTerm')).toBe(true);
    expect(termPublished('supportEmail')).toBe(true);
  });
  it('still has no postal address or business name', () => {
    expect(OWNER.postalAddress).toBeNull();
    expect(OWNER.businessName).toBeNull();
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
