import { NextResponse, type NextRequest } from 'next/server';
import { PATH_HEADER, SIGN_IN_PATH, VERIFY_PATH } from '@/lib/auth/config';
import { COOKIE_NAMES, cookieOptions, flagOptions, isSecureRequest, SIGNED_IN_COOKIE } from '@/lib/auth/cookie';
import { isSecretShape } from '@/lib/auth/token';
import { isComingSoon } from '@/lib/site';

// The gate's first layer. It only checks that a session cookie of the right shape is present: no database, no
// decision about preview versus member. Anything without one goes to the sign-in page with the path to come back
// to; everything else continues, and the real check happens in lib/auth/dal.ts before any content renders.
// /preview and the public site pass straight through, except while COMING_SOON is on (below).
//
// A page load also gets the cookie re-emitted so its lifetime slides with the reader's visits. The router's
// prefetches and RSC fetches do not: they leave the page without waiting for a sign-out or delete to answer, and
// one that answers afterwards would put the cookie the sign-out had just cleared straight back. The server-side
// session slides on its own schedule in the DAL (at most once a day), so a page load is all the cookie needs.
// Every page, because the coming-soon switch covers the public site too; API routes, framework files, public
// assets and the metadata routes never come through here.
export const config = {
  matcher: ['/((?!api/|_next/|images/|robots\\.txt|sitemap\\.xml|coming-soon).*)'],
};

const GATED = /^\/(handbook|account|admin)(\/|$)|^\/search-index\.json$/;

// While the site is closed, a visitor with no session sees the coming-soon page at whatever URL they asked for. The
// owner signs in through /signin and the emailed link, and from then on the session cookie lets them see the whole
// site. A forged cookie of the right shape gets past this too, which only reveals the public pages: the product
// pages still check the session itself in lib/auth/dal.ts.
const COMING_SOON_PATH = '/coming-soon';
const OPEN_WHILE_CLOSED = new Set(['/signin', VERIFY_PATH]);

// Next strips its own `rsc` and `next-router-prefetch` headers before the proxy runs, so a prefetch is told apart
// by the browser's fetch metadata, and by Accept where a browser sends none (a fetch asks for */*, a page load for
// text/html). Getting this wrong costs nothing but a slide: the gate above does not depend on it.
const isPageLoad = (headers: Headers): boolean =>
  headers.has('sec-fetch-dest') ? headers.get('sec-fetch-dest') === 'document' : (headers.get('accept') ?? '').includes('text/html');

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const present = COOKIE_NAMES.map(name => request.cookies.get(name)).find(c => c && isSecretShape(c.value));
  if (!present && isComingSoon(process.env) && !OPEN_WHILE_CLOSED.has(pathname)) {
    const closed = NextResponse.rewrite(new URL(COMING_SOON_PATH, request.url));
    closed.headers.set('X-Robots-Tag', 'noindex');
    return closed;
  }
  if (!GATED.test(pathname)) return NextResponse.next();
  if (!present) {
    const signIn = new URL(SIGN_IN_PATH, request.url);
    signIn.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(signIn);
  }
  const headers = new Headers(request.headers);
  headers.set(PATH_HEADER, `${pathname}${search}`);
  const response = NextResponse.next({ request: { headers } });
  if (isPageLoad(request.headers)) {
    const secure = isSecureRequest(request.url);
    response.cookies.set(present.name, present.value, cookieOptions(secure));
    response.cookies.set(SIGNED_IN_COOKIE, '1', flagOptions(secure)); // the readable flag slides with the session
  }
  return response;
}
