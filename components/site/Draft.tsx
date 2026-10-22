import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { POLICY_STATUS } from '@/lib/offer';

type PolicyKey = keyof typeof POLICY_STATUS;

/** Metadata for a policy page: a draft is kept out of search results until the owner approves it. */
export const policyMetadata = (key: PolicyKey, title: string, description: string, path: string): Metadata => ({
  title,
  description,
  alternates: { canonical: path },
  robots: POLICY_STATUS[key] === 'draft' ? { index: false, follow: true } : undefined,
});

/** Shown at the top of a policy until its status in lib/offer.ts is 'approved'. */
export function DraftNotice({ policy }: { policy: PolicyKey }) {
  if (POLICY_STATUS[policy] === 'approved') return null;
  return (
    <div className="pub-draft" role="note">
      <p><strong>Draft for owner review.</strong> This text has not been approved, is not yet in effect, and is not legal advice.</p>
      <p>It describes how the site works today. Items marked “Decision needed” are choices only the owner can make.</p>
    </div>
  );
}

export function Decision({ children }: { children: ReactNode }) {
  return <p className="pub-decision"><strong>Decision needed:</strong> {children}</p>;
}

export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="pub-pagehead">
      <div className="pub-wrap pub-narrow">
        <p className="pub-eyebrow">{eyebrow}</p>
        <h1 className="pub-h1">{title}</h1>
        {children && <p className="pub-lede">{children}</p>}
      </div>
    </section>
  );
}
