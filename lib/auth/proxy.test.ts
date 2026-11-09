import { getRedirectUrl, unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { config, PATH_HEADER, proxy } from '@/proxy';
import { newSecret } from './token';

const run = (url: string, cookie?: string) => proxy(new NextRequest(url, cookie ? { headers: { cookie } } : undefined));

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
  it('lets a well-formed cookie through, re-emits it with a fresh lifetime and passes the path on', () => {
    const raw = newSecret();
    const res = run('http://localhost:3187/handbook/ch3?x=1', `hb_session=${raw}`);
    expect(getRedirectUrl(res)).toBeNull();
    const cookie = res.headers.get('set-cookie')!;
    expect(cookie.startsWith(`hb_session=${raw}; Path=/;`)).toBe(true);
    expect(cookie).toContain('Max-Age=7776000');
    expect(cookie).toContain('HttpOnly');
    expect(cookie.toLowerCase()).toContain('samesite=lax');
    expect(cookie).not.toContain('Secure');
    expect(res.headers.get(`x-middleware-request-${PATH_HEADER}`)).toBe('/handbook/ch3?x=1');
  });
  it('keeps the __Host- name and adds Secure over https', () => {
    const raw = newSecret();
    const res = run('https://handbook.example/handbook', `__Host-hb_session=${raw}`);
    expect(getRedirectUrl(res)).toBeNull();
    const cookie = res.headers.get('set-cookie')!;
    expect(cookie.startsWith(`__Host-hb_session=${raw}; Path=/;`)).toBe(true);
    expect(cookie).toContain('Max-Age=7776000');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('HttpOnly');
  });
});
