import { SESSION_MAX_AGE_SECONDS } from './config';

// The session cookie carries the raw session id. Over https it takes the __Host- prefix, which browsers only
// accept with Secure, Path=/ and no Domain, so it cannot be set by a subdomain or over plain http; a local
// production build on http gets the plain name. Lax is required: the emailed link is a top-level navigation and
// the sign-in POST that follows must carry the cookie.
const BASE = 'hb_session';
export const COOKIE_NAMES = [`__Host-${BASE}`, BASE] as const;
export const cookieName = (secure: boolean): string => (secure ? `__Host-${BASE}` : BASE);
export const isSecureRequest = (url: string): boolean => new URL(url).protocol === 'https:';

// Beside the session cookie goes a readable flag with no value of interest: the public site's client components
// read it after mount to show "Welcome back" and "Open the handbook", so the public pages stay static and the
// session id stays HttpOnly. It is set, slid and cleared wherever the session cookie is.
export const SIGNED_IN_COOKIE = 'hb_signed_in';

export type CookieOptions = { httpOnly: boolean; secure: boolean; sameSite: 'lax'; path: '/'; maxAge: number };
export const cookieOptions = (secure: boolean, maxAge = SESSION_MAX_AGE_SECONDS): CookieOptions => ({ httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge });
export const flagOptions = (secure: boolean, maxAge = SESSION_MAX_AGE_SECONDS): CookieOptions => ({ ...cookieOptions(secure, maxAge), httpOnly: false });

/** A Set-Cookie header value, for handlers that answer with a plain Response. */
export function serializeCookie(name: string, value: string, options: CookieOptions): string {
  const parts = [`${name}=${value}`, `Path=${options.path}`, `Max-Age=${options.maxAge}`];
  if (options.httpOnly) parts.push('HttpOnly');
  parts.push('SameSite=Lax');
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

export const sessionCookieHeader = (secure: boolean, rawId: string): string => serializeCookie(cookieName(secure), rawId, cookieOptions(secure));
/** Max-Age=0 with the same name and attributes removes it; a __Host- cookie is only removable with Secure and Path=/. */
export const clearedCookieHeader = (secure: boolean): string => serializeCookie(cookieName(secure), '', cookieOptions(secure, 0));

/** The two Set-Cookie values that sign a browser in: the session, then the readable flag. */
export const sessionCookieHeaders = (secure: boolean, rawId: string): string[] => [sessionCookieHeader(secure, rawId), serializeCookie(SIGNED_IN_COOKIE, '1', flagOptions(secure))];
/** The two that sign it out. */
export const clearedCookieHeaders = (secure: boolean): string[] => [clearedCookieHeader(secure), serializeCookie(SIGNED_IN_COOKIE, '', flagOptions(secure, 0))];

/** The raw id from a Cookie header or a cookie store, whichever name is present; undefined when neither is. */
export const sessionIdFrom = (get: (name: string) => string | undefined): string | undefined => get(COOKIE_NAMES[0]) ?? get(COOKIE_NAMES[1]);
