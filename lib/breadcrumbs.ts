import { isPageId, NAV, pageById, type PageId } from './pages';
import { HANDBOOK, pageIdFromPath } from './routes';

export type Crumb = { label: string; href?: string };

// Handbook pages that are not chapters, by their /handbook/<slug>.
const HANDBOOK_SECTIONS: Record<string, string> = { start: 'Start here', plan: 'My plan', review: 'Review' };
// Public pages and the account page, by path. Labels match each page's title.
const SITE_PAGES: Record<string, string> = {
  '/about': 'About the handbook',
  '/pricing': 'Pricing and availability',
  '/preview': 'Free sample',
  '/support': 'Support',
  '/privacy': 'Privacy policy',
  '/refunds': 'Refund policy',
  '/terms': 'Terms of use',
  '/updates': 'Access and updates',
  '/account': 'Account and saved progress',
  '/signup': 'Sign in',
  '/signin': 'Sign in',
  '/subscribe/confirm': 'Handbook notes',
};

/** The part a chapter sits in, shortened for a breadcrumb: "PART IV: Nurture" -> "Nurture", "APPENDICES" -> "Appendices". */
export function partLabel(id: PageId): string | null {
  const part = NAV.find(group => group.pages.some(p => p.id === id))?.part ?? null;
  if (!part) return null;
  const colon = part.indexOf(':');
  if (colon >= 0) return part.slice(colon + 1).trim();
  return part.charAt(0) + part.slice(1).toLowerCase();
}

const humanize = (segment: string) => decodeURIComponent(segment).replace(/[-_]+/g, ' ').replace(/^\w/, c => c.toUpperCase());

/** The trail after Home for `pathname`, last entry being the current page. Empty on the front page, which has no parent. */
export function crumbsFor(pathname: string): Crumb[] {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return [];
  if (path === HANDBOOK) return [{ label: 'Handbook' }];
  const handbook: Crumb = { label: 'Handbook', href: HANDBOOK };
  const slug = pageIdFromPath(path);
  if (slug !== null) {
    if (isPageId(slug)) {
      const part = partLabel(slug);
      return [handbook, ...(part ? [{ label: part }] : []), { label: pageById(slug).label }];
    }
    const section = HANDBOOK_SECTIONS[slug];
    if (section) return [handbook, { label: section }];
  }
  const known = SITE_PAGES[path];
  if (known) return [{ label: known }];
  // Anything else (a 404, a page added later): one readable crumb per segment, the ones above it linked.
  const segments = path.split('/').filter(Boolean);
  return segments.map((segment, i) => ({
    label: humanize(segment),
    ...(i < segments.length - 1 ? { href: `/${segments.slice(0, i + 1).join('/')}` } : {}),
  }));
}
