import { OWNER } from '@/lib/offer';

// Links and legal copy shared by the public site footer and the handbook footer, so the two cannot drift apart.
export const POLICY_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms of use' },
  { href: '/refunds', label: 'Refunds' },
] as const;

export const HELP_LINKS = [
  { href: '/support', label: 'Support' },
  { href: '/updates', label: 'Access and updates' },
] as const;

export const LEGAL_NOTE =
  'Training material, not legal advice. Confirm forms, compensation and prospecting rules with your broker. Worked examples use Keller Williams Command screens and terms, and each is labeled; that is an example, not an endorsement.';

export const copyright = (): string => (OWNER.businessName ? `© ${new Date().getFullYear()} ${OWNER.businessName}.` : '');
