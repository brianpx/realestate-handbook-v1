import { describe, expect, it } from 'vitest';
import config from '../next.config';
import { contentSecurityPolicy, securityHeaders } from './security-headers';

const directives = (csp: string): Record<string, string> => Object.fromEntries(csp.split('; ').map(d => { const [name, ...rest] = d.split(' '); return [name, rest.join(' ')]; }));

describe('security headers', () => {
  it('names the four headers with the plan values for production', () => {
    const headers = securityHeaders(false);
    expect(headers.map(h => h.key)).toEqual(['X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'Content-Security-Policy']);
    expect(headers[0]!.value).toBe('nosniff');
    expect(headers[1]!.value).toBe('strict-origin-when-cross-origin');
    expect(headers[2]!.value).toBe('camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=(), browsing-topics=()');
    expect(headers[3]!.value).toBe(contentSecurityPolicy(false));
  });
  it('locks every directive to the site, with inline scripts and styles the only allowance', () => {
    expect(directives(contentSecurityPolicy(false))).toEqual({
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
    });
    expect(contentSecurityPolicy(false)).not.toContain('unsafe-eval');
    expect(contentSecurityPolicy(false)).not.toContain('nonce');
  });
  it('allows eval only in development, where React reconstructs server stacks with it', () => {
    expect(directives(contentSecurityPolicy(true))['script-src']).toBe("'self' 'unsafe-inline' 'unsafe-eval'");
    const { 'script-src': _dev, ...devRest } = directives(contentSecurityPolicy(true));
    const { 'script-src': _prod, ...prodRest } = directives(contentSecurityPolicy(false));
    expect(devRest).toEqual(prodRest);
  });
  it('is what next.config.ts emits for every path', async () => {
    const rules = await config.headers!();
    expect(rules).toEqual([{ source: '/:path*', headers: securityHeaders(process.env.NODE_ENV === 'development') }]);
  });
});
