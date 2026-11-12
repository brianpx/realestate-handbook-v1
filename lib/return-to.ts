import { crumbsFor } from './breadcrumbs';
import { HANDBOOK } from './routes';

// Footer links open public pages that have no link back into the handbook. They carry the page the reader came from
// in this query parameter, and the public layout turns it into a "Back to ..." link.
export const RETURN_PARAM = 'from';

// A path on this site only: no scheme, no host, no query. Anything else is ignored rather than linked to.
const LOCAL_PATH = /^\/(?!\/)[A-Za-z0-9\-._~/%]*$/;

export const withReturn = (href: string, from: string | null): string =>
  from && LOCAL_PATH.test(from) ? `${href}?${RETURN_PARAM}=${encodeURIComponent(from)}` : href;

export type ReturnTarget = { href: string; label: string };

export function returnTarget(raw: string | null): ReturnTarget | null {
  if (!raw || !LOCAL_PATH.test(raw)) return null;
  const path = raw.replace(/\/+$/, '') || '/';
  if (path === '/') return null;
  if (path === HANDBOOK) return { href: path, label: 'the handbook' };
  const label = crumbsFor(path).at(-1)?.label;
  return label ? { href: path, label } : null;
}
