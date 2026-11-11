import { OFFER, OWNER, POLICY_STATUS, purchaseOpen, REFUND_DAYS } from '@/lib/offer';
import { paidTiers } from '@/lib/tiers';

export type Faq = { q: string; a: string };

// Answers describe what the product does today. The one that depends on the owner's decisions (support, updates) says
// what is published, otherwise points to the pages that will carry the terms, and keeps the price caveat while purchase is closed.
export function faqs(): Faq[] {
  const updates = OFFER.updatesTerm
    ? `${OFFER.updatesTerm} The full policy is on the Access and updates page.`
    : 'The update terms are not published yet; they will be on the pricing and access pages before purchase opens.';
  const support = OWNER.supportEmail ? `Both paid plans include email support at ${OWNER.supportEmail}.` : 'The support address is not published yet.';
  const price = purchaseOpen() ? '' : ' Purchase is not open yet and no price is published, so nothing can be bought until it is.';
  const terms = `${updates} ${support}${price}`;
  return [
    {
      q: 'Does this replace my brokerage’s training?',
      a: 'No. Your broker and your state licensing course teach contracts, forms, compliance and how to run a closing, and the handbook does not. It covers the other half of the job: finding people who may buy or sell, staying in touch until they are ready, and earning referrals after they close. It is not legal advice and it does not replace brokerage supervision.',
    },
    {
      q: 'Does it work if I am not at Keller Williams?',
      a: 'Yes. The method is CRM-neutral: set up your profile, import and tag contacts, run follow-up plans, keep honest pipeline stages and use the mobile app. The worked examples use Keller Williams Command screens and terms, and each is labeled as an example. In another CRM, use the equivalent: your website, client search app, pipeline stages and branding settings. Using Keller Williams Command as the example is not an endorsement.',
    },
    {
      q: 'What experience level is it for?',
      a: 'It is written for the agent in their first year: licensed, affiliated with a brokerage, and unsure what to do on a Tuesday morning when no one is calling. If you have been in the business for years, much of the groundwork will be familiar. The free sample lesson shows the level before you decide.',
    },
    {
      q: 'Does it work on a phone?',
      a: 'Yes. The chapters and tools are laid out for phone screens and run in the phone’s browser; there is nothing to install. Calendar files and printing depend on what your phone’s browser allows, and some of the longer tables are easier to read on a larger screen.',
    },
    {
      q: 'How is my progress saved?',
      a: 'In your own browser, on the device you are using. Checked-off items, calculator entries, script practice and quiz answers are stored there and are not sent to a server; your account signs you in and keeps no copy of them. If you clear site data or use a private window you can lose them, so download a backup file from the Account page now and then.',
    },
    {
      q: 'Does it work across my devices?',
      a: 'Your purchase does: sign in with the same email on any phone, tablet or computer. Your progress does not follow you, because it is saved in each browser separately with no automatic sync. To move to another device or browser, download your progress file on the first and restore it on the second. That takes a minute and is explained on the Account and Support pages.',
    },
    { q: 'What support and updates are included?', a: terms },
    {
      q: 'Does it include coaching or continuing education credit?',
      a: 'No to both. It is self-paced training material with tools, not a coaching program, and it does not carry continuing education or pre-licensing credit. The milestones in it are planning targets, not predictions or promises about your income or closings.',
    },
  ];
}

// Buying questions for /pricing. Each answer states only what is published in lib/offer.ts and lib/tiers.ts and otherwise says it is not.
export function pricingFaqs(): Faq[] {
  const open = purchaseOpen();
  return [
    {
      q: 'How much does it cost?',
      a: open
        ? `Two plans, each a one-time purchase: ${paidTiers().map(t => `${t.name} ${t.priceDisplay}`).join(', ')}. The free set stays free. ${OFFER.accessTerm}`
        : 'No price has been published, so nothing can be bought yet. There will be two plans, Basic and Pro, each a one-time purchase; the free set stays free. The prices and every term will be on this page before you are asked to pay.',
    },
    {
      q: 'What happens when I pay?',
      a: open
        ? 'Checkout opens on the payment provider’s own page, not on this site, which never sees your card details. The Access and updates page explains how you get in afterwards.'
        : 'Nothing, today. This site has no checkout. When purchase opens, checkout will be on a payment provider’s own page, and the Access and updates page will explain how you get in afterwards.',
    },
    {
      q: 'Can I get a refund?',
      a: POLICY_STATUS.refunds === 'approved'
        ? `Yes. Each purchase can be refunded in full within ${REFUND_DAYS} days, for any reason, under the terms on the refund policy page. Read it before you buy.`
        : `The refund policy has not been approved yet. It is being drafted as ${REFUND_DAYS} days from each purchase, for any reason, and will be published, and linked from here, before purchase opens.`,
    },
    {
      q: 'Can I try it first?',
      a: 'Yes. The sample lesson is free and needs no sign-up. It is Chapter 1 and Chapter 7 in full, with every tool, checkpoint and quiz working, plus a script to practice and the weekly planner.',
    },
    {
      q: 'Will I lose my progress if I buy later or change devices?',
      a: 'Progress is saved in your browser on the device you use, and your account does not sync it between devices. To move to another phone or computer, download a progress file on the old one and restore it on the new one. The Support page walks through it.',
    },
  ];
}
