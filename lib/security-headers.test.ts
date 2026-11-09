import { describe, expect, it } from 'vitest';
import config from '../next.config';
import { contentSecurityPolicy, securityHeaders } from './security-headers';

const directives = (csp: string): Record<string, string> => Object.fromEntries(csp.split('; ').map(d => { const [name, ...rest] = d.split(' '); return [name, rest.join(' ')]; }));

const STRICT = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline'",
  'style-src': "'self' 'unsafe-inline'",
  'img-src': "'self' data:",
  'font-src': "'self'",
  'connect-src': "'self'",
  'media-src': "'self'",
  'object-src': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'",
  'frame-ancestors': "'none'",
};

describe('security headers', () => {
  it('names the four headers with the plan values for production', () => {
    const headers = securityHeaders();
    expect(headers.map(h => h.key)).toEqual(['X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'Content-Security-Policy']);
    expect(headers[0]!.value).toBe('nosniff');
    expect(headers[1]!.value).toBe('strict-origin-when-cross-origin');
    expect(headers[2]!.value).toBe('camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()');
    expect(headers[3]!.value).toBe(contentSecurityPolicy());
  });
  it('locks every directive to the site, with inline scripts and styles the only allowance', () => {
    expect(directives(contentSecurityPolicy())).toEqual(STRICT);
    expect(contentSecurityPolicy()).not.toContain('unsafe-eval');
    expect(contentSecurityPolicy()).not.toContain('nonce');
    expect(contentSecurityPolicy()).not.toContain('vercel');
  });
  it('allows eval only in development, where React reconstructs server stacks with it', () => {
    expect(directives(contentSecurityPolicy({ dev: true }))).toEqual({ ...STRICT, 'script-src': "'self' 'unsafe-inline' 'unsafe-eval'" });
  });
  it('lets a preview deployment load the Vercel Toolbar, exactly the sources its documentation lists, and nothing else changes', () => {
    expect(directives(contentSecurityPolicy({ preview: true }))).toEqual({
      ...STRICT,
      'script-src': "'self' 'unsafe-inline' https://vercel.live",
      'connect-src': "'self' https://vercel.live wss://ws-us3.pusher.com",
      'img-src': "'self' data: https://vercel.live https://vercel.com blob:",
      'frame-src': "'self' https://vercel.live",
      'style-src': "'self' 'unsafe-inline' https://vercel.live",
      'font-src': "'self' https://vercel.live https://assets.vercel.com",
    });
    expect(directives(contentSecurityPolicy({ preview: true, dev: true }))['script-src']).toBe("'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live");
  });
  it('is what next.config.ts emits for every path', async () => {
    const rules = await config.headers!();
    expect(rules).toEqual([{ source: '/:path*', headers: securityHeaders({ dev: process.env.NODE_ENV === 'development', preview: process.env.VERCEL_ENV === 'preview' }) }]);
  });
});
