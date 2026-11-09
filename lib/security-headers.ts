// The response headers next.config.ts puts on every route (M8 step 1, CR-L1), as a function of the environment so
// the unit test can check what production emits without a build. Vercel adds Strict-Transport-Security itself.

// Nothing on the site asks for a device or a location, and the two ad-targeting signals are opted out explicitly.
export const PERMISSIONS_POLICY = ['camera', 'microphone', 'geolocation', 'payment', 'interest-cohort', 'browsing-topics'].map(f => `${f}=()`).join(', ');

/**
 * Scripts stay allowed inline. Next.js streams every page's React payload in inline `<script>` elements whose text
 * differs per page, so a static header cannot allow them by hash, and a nonce needs every page rendered per
 * request (content-security-policy.md), which the public pages were just made static to avoid. 'unsafe-inline'
 * is the guide's setting for a static site; the other directives carry the enforcement: no other origin can be
 * loaded, posted to or framed. Styles: React renders `style` props as attributes. Development: React rebuilds
 * server stack traces with eval.
 */
export function contentSecurityPolicy(dev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function securityHeaders(dev: boolean): { key: string; value: string }[] {
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(dev) },
  ];
}
