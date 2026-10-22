import { OFFER, POLICY_STATUS, purchaseOpen } from '@/lib/offer';

export type Faq = { q: string; a: string };

// Answers describe what the product does today. The two that depend on the owner's decisions (support, updates)
// say what is published and otherwise point to the pages that will carry the approved terms.
export function faqs(): Faq[] {
  const terms = purchaseOpen() && OFFER.updatesTerm
    ? `${OFFER.updatesTerm} The full policy is on the Access and updates page.`
    : 'The support and update terms are not published yet. They will be on the pricing and access pages before purchase opens, and nothing is promised until then.';
  return [
    {
      q: 'Does this replace my brokerage’s training?',
      a: 'No. Your broker and your state licensing course teach contracts, forms, compliance and how to run a closing, and the handbook does not. It covers the other half of the job: finding people who may buy or sell, staying in touch until they are ready, and earning referrals after they close. It is not legal advice and it does not replace brokerage supervision.',
    },
    {
      q: 'Does it work if I am not at Keller Williams?',
      a: 'Yes. The method is CRM-neutral: set up your profile, import and tag contacts, run follow-up plans, keep honest pipeline stages and use the mobile app. The worked examples use Keller Williams Command screens and terms, and each is labeled as an example. In another CRM, use the equivalent: your website, client search app, pipeline stages and drip campaigns. Using Keller Williams Command as the example is not an endorsement.',
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
      a: 'In your own browser, on the device you are using. Checked-off items, calculator entries, script practice and quiz answers are stored there and are not sent to a server. There is no account. If you clear site data or use a private window you can lose them, so download a backup file from the Account page now and then.',
    },
    {
      q: 'Does it work across my devices?',
      a: 'There is no automatic sync. To move to a new phone or computer, download your progress file on the old one and restore it on the new one. That takes a minute and is explained on the Account and Support pages.',
    },
    { q: 'What support and updates are included?', a: terms },
    {
      q: 'Does it include coaching or continuing education credit?',
      a: 'No to both. It is self-paced training material with tools, not a coaching program, and it does not carry continuing education or pre-licensing credit. The milestones in it are planning targets, not predictions or promises about your income or closings.',
    },
  ];
}

// Buying questions for /pricing. Each answer states only what is published in lib/offer.ts and otherwise says it is not.
export function pricingFaqs(): Faq[] {
  const open = purchaseOpen();
  return [
    {
      q: 'How much does it cost?',
      a: open
        ? `${OFFER.priceDisplay}. ${OFFER.accessTerm} There are no tiers or add-ons.`
        : 'No price has been published, so nothing can be bought yet. The price and every term will be on this page before you are asked to pay.',
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
        ? 'Yes, under the terms on the refund policy page. Read it before you buy.'
        : 'The refund policy has not been approved yet. It will be published, and linked from here, before purchase opens.',
    },
    {
      q: 'Can I try it first?',
      a: 'Yes. The sample lesson is free and needs no sign-up. It includes a real section of Chapter 1 with its working calculator, a script to practice and the weekly planner.',
    },
    {
      q: 'Will I lose my progress if I buy later or change devices?',
      a: 'Progress is saved in your browser on the device you use, and the handbook has no accounts or sync. To move to another phone or computer, download a progress file on the old one and restore it on the new one. The Support page walks through it.',
    },
  ];
}
