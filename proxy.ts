import { NextResponse, type NextRequest } from 'next/server';
import { PATH_HEADER, SIGN_IN_PATH } from '@/lib/auth/config';
import { COOKIE_NAMES, cookieOptions, flagOptions, isSecureRequest, SIGNED_IN_COOKIE } from '@/lib/auth/cookie';
import { isSecretShape } from '@/lib/auth/token';

// The gate's first layer. It only checks that a session cookie of the right shape is present: no database, no
// decision about preview versus member. Anything without one goes to the sign-in page with the path to come back
// to; everything else continues, and the real check happens in lib/auth/dal.ts before any content renders.
// /preview and the public site are never matched.
//
// A page load also gets the cookie re-emitted so its lifetime slides with the reader's visits. The router's
// prefetches and RSC fetches do not: they leave the page without waiting for a sign-out or delete to answer, and
// one that answers afterwards would put the cookie the sign-out had just cleared straight back. The server-side
// session slides on its own schedule in the DAL (at most once a day), so a page load is all the cookie needs.
export const config = {
  matcher: ['/handbook/:path*', '/account/:path*', '/admin/:path*', '/search-index.json'],
};

// Next strips its own `rsc` and `next-router-prefetch` headers before the proxy runs, so a prefetch is told apart
// by the browser's fetch metadata, and by Accept where a browser sends none (a fetch asks for */*, a page load for
// text/html). Getting this wrong costs nothing but a slide: the gate above does not depend on it.
const isPageLoad = (headers: Headers): boolean =>
  headers.has('sec-fetch-dest') ? headers.get('sec-fetch-dest') === 'document' : (headers.get('accept') ?? '').includes('text/html');

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const present = COOKIE_NAMES.map(name => request.cookies.get(name)).find(c => c && isSecretShape(c.value));
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
