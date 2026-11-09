import { getRedirectUrl, unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { config, proxy } from '@/proxy';
import { PATH_HEADER } from './config';
import { newSecret } from './token';

const run = (url: string, cookie?: string, headers: Record<string, string> = {}) => proxy(new NextRequest(url, { headers: { ...(cookie ? { cookie } : {}), ...headers } }));
// what a browser sends with a top-level page load, and with the router's prefetch or RSC fetch
const PAGE = { 'sec-fetch-dest': 'document', accept: 'text/html,application/xhtml+xml,*/*;q=0.8' };
const FETCH = { 'sec-fetch-dest': 'empty', accept: '*/*' };

describe('the proxy gate', () => {
  it.each(['/handbook', '/handbook/ch3', '/handbook/plan', '/account', '/admin/users', '/search-index.json'])('matches %s', path => {
    expect(unstable_doesMiddlewareMatch({ config, url: path })).toBe(true);
  });
  it.each(['/', '/preview', '/signup', '/auth/verify', '/api/auth/request-link', '/pricing', '/_next/static/chunk.js', '/images/logo.png', '/sitemap.xml'])('leaves %s alone', path => {
    expect(unstable_doesMiddlewareMatch({ config, url: path })).toBe(false);
  });
  it('sends a visitor with no cookie to sign in, keeping the path and query to come back to', () => {
    expect(getRedirectUrl(run('http://localhost:3187/handbook/ch3'))).toBe('http://localhost:3187/signup?next=%2Fhandbook%2Fch3');
    expect(getRedirectUrl(run('https://handbook.example/account?tab=sessions'))).toBe('https://handbook.example/signup?next=%2Faccount%3Ftab%3Dsessions');
  });
  it.each(['hb_session=short', 'hb_session=', `hb_session=${'x'.repeat(42)}=`, 'other=value'])('treats the cookie %s as absent', cookie => {
    expect(getRedirectUrl(run('http://localhost:3187/handbook/ch3', cookie))).toContain('/signup?next=');
  });
  it('lets a page load with a well-formed cookie through, re-emits it and the flag with a fresh lifetime and passes the path on', () => {
    const raw = newSecret();
    const res = run('http://localhost:3187/handbook/ch3?x=1', `hb_session=${raw}`, PAGE);
    expect(getRedirectUrl(res)).toBeNull();
    const [cookie, flag] = res.headers.getSetCookie();
    expect(cookie!.startsWith(`hb_session=${raw}; Path=/;`)).toBe(true);
    expect(cookie).toContain('Max-Age=7776000');
    expect(cookie).toContain('HttpOnly');
    expect(cookie!.toLowerCase()).toContain('samesite=lax');
    expect(cookie).not.toContain('Secure');
    expect(flag!.startsWith('hb_signed_in=1; Path=/;')).toBe(true);
    expect(flag).toContain('Max-Age=7776000');
    expect(flag).not.toContain('HttpOnly');
    expect(res.headers.get(`x-middleware-request-${PATH_HEADER}`)).toBe('/handbook/ch3?x=1');
  });
  it('keeps the __Host- name and adds Secure over https', () => {
    const raw = newSecret();
    const res = run('https://handbook.example/handbook', `__Host-hb_session=${raw}`, PAGE);
    expect(getRedirectUrl(res)).toBeNull();
    const cookie = res.headers.getSetCookie()[0]!;
    expect(cookie.startsWith(`__Host-hb_session=${raw}; Path=/;`)).toBe(true);
    expect(cookie).toContain('Max-Age=7776000');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('HttpOnly');
  });
  // A prefetch that leaves /account before a sign-out and answers after it must not put the cleared cookie back.
  it('lets a prefetch or RSC fetch through without touching either cookie', () => {
    const res = run('http://localhost:3187/handbook/ch3?x=1', `hb_session=${newSecret()}`, FETCH);
    expect(getRedirectUrl(res)).toBeNull();
    expect(res.headers.getSetCookie()).toEqual([]);
    expect(res.headers.get(`x-middleware-request-${PATH_HEADER}`)).toBe('/handbook/ch3?x=1');
  });
  it('falls back to Accept for a browser that sends no fetch metadata', () => {
    const cookie = `hb_session=${newSecret()}`;
    expect(run('http://localhost:3187/handbook', cookie, { accept: 'text/html,*/*;q=0.8' }).headers.getSetCookie()).toHaveLength(2);
    expect(run('http://localhost:3187/handbook', cookie, { accept: '*/*' }).headers.getSetCookie()).toEqual([]);
    expect(run('http://localhost:3187/handbook', cookie).headers.getSetCookie()).toEqual([]);
  });
  it('still sends a prefetch with no cookie to sign in', () => {
    expect(getRedirectUrl(run('http://localhost:3187/handbook/ch3', undefined, FETCH))).toBe('http://localhost:3187/signup?next=%2Fhandbook%2Fch3');
  });
});
