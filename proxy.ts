import { NextResponse, type NextRequest } from 'next/server';
import { PATH_HEADER, SIGN_IN_PATH } from '@/lib/auth/config';
import { COOKIE_NAMES, cookieOptions, isSecureRequest } from '@/lib/auth/cookie';
import { isSecretShape } from '@/lib/auth/token';

// The gate's first layer. It only checks that a session cookie of the right shape is present: no database, no
// decision about preview versus member. Anything without one goes to the sign-in page with the path to come back
// to; everything else continues with the cookie re-emitted so its lifetime slides, and the real check happens in
// lib/auth/dal.ts before any content renders. /preview and the public site are never matched.
export const config = {
  matcher: ['/handbook/:path*', '/account/:path*', '/admin/:path*', '/search-index.json'],
};

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
  response.cookies.set(present.name, present.value, cookieOptions(isSecureRequest(request.url)));
  return response;
}
