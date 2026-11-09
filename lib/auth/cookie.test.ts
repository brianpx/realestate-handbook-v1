import { describe, expect, it } from 'vitest';
import { clearedCookieHeader, clearedCookieHeaders, cookieName, isSecureRequest, sessionCookieHeader, sessionCookieHeaders, sessionIdFrom } from './cookie';

describe('the session cookie', () => {
  it('takes the __Host- prefix and Secure over https, the plain name over http', () => {
    expect(isSecureRequest('https://handbook.example/handbook')).toBe(true);
    expect(isSecureRequest('http://localhost:3187/handbook')).toBe(false);
    expect(cookieName(true)).toBe('__Host-hb_session');
    expect(cookieName(false)).toBe('hb_session');
  });
  it('is HttpOnly, Lax, Path=/ and 90 days, with Secure only over https', () => {
    expect(sessionCookieHeader(true, 'raw')).toBe('__Host-hb_session=raw; Path=/; Max-Age=7776000; HttpOnly; SameSite=Lax; Secure');
    expect(sessionCookieHeader(false, 'raw')).toBe('hb_session=raw; Path=/; Max-Age=7776000; HttpOnly; SameSite=Lax');
  });
  it('is cleared with the same attributes and Max-Age=0, so a __Host- cookie actually goes', () => {
    expect(clearedCookieHeader(true)).toBe('__Host-hb_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure');
    expect(clearedCookieHeader(false)).toBe('hb_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
  });
  it('is read under either name, the prefixed one first', () => {
    const jar: Record<string, string> = { hb_session: 'plain', '__Host-hb_session': 'host' };
    expect(sessionIdFrom(n => jar[n])).toBe('host');
    expect(sessionIdFrom(n => ({ hb_session: 'plain' })[n])).toBe('plain');
    expect(sessionIdFrom(() => undefined)).toBeUndefined();
  });
});

describe('the signed-in flag', () => {
  it('goes beside the session cookie, readable by scripts, with the same lifetime, path and Secure', () => {
    expect(sessionCookieHeaders(true, 'raw')).toEqual([sessionCookieHeader(true, 'raw'), 'hb_signed_in=1; Path=/; Max-Age=7776000; SameSite=Lax; Secure']);
    expect(sessionCookieHeaders(false, 'raw')).toEqual([sessionCookieHeader(false, 'raw'), 'hb_signed_in=1; Path=/; Max-Age=7776000; SameSite=Lax']);
  });
  it('is cleared with the session cookie', () => {
    expect(clearedCookieHeaders(true)).toEqual([clearedCookieHeader(true), 'hb_signed_in=; Path=/; Max-Age=0; SameSite=Lax; Secure']);
    expect(clearedCookieHeaders(false)).toEqual([clearedCookieHeader(false), 'hb_signed_in=; Path=/; Max-Age=0; SameSite=Lax']);
  });
});
