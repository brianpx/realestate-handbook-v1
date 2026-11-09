// The response headers next.config.ts puts on every route (M8 step 1, CR-L1), as a function of the build so the
// unit test can check what each kind of deployment emits without a build. Vercel adds Strict-Transport-Security itself.

export type HeaderOptions = {
  /** `next dev`: React rebuilds server stack traces with eval. */
  dev?: boolean;
  /** A Vercel preview deployment: the Vercel Toolbar (comments, feedback) loads from vercel.live and must be allowed. */
  preview?: boolean;
};

// Nothing on the site asks for a device or a location, and the ad-targeting signal is opted out explicitly.
export const PERMISSIONS_POLICY = ['camera', 'microphone', 'geolocation', 'payment', 'browsing-topics'].map(f => `${f}=()`).join(', ');

// What the Vercel Toolbar needs, directive by directive, as listed under "Using a Content Security Policy" at
// https://vercel.com/docs/vercel-toolbar/managing-toolbar (read 9 November 2026). Previews only; production and
// local builds keep the strict policy.
const TOOLBAR: Record<string, string> = {
  'script-src': 'https://vercel.live',
  'connect-src': 'https://vercel.live wss://ws-us3.pusher.com',
  'img-src': 'https://vercel.live https://vercel.com data: blob:',
  'frame-src': 'https://vercel.live',
  'style-src': "https://vercel.live 'unsafe-inline'",
  'font-src': 'https://vercel.live https://assets.vercel.com',
};

/**
 * Scripts stay allowed inline. Next.js streams every page's React payload in inline `<script>` elements whose text
 * differs per page, so a static header cannot allow them by hash, and a nonce needs every page rendered per
 * request (content-security-policy.md), which the public pages were just made static to avoid. 'unsafe-inline'
 * is the guide's setting for a static site; the other directives carry the enforcement: no other origin can be
 * loaded, posted to or framed. Styles: React renders `style` props as attributes.
 */
export function contentSecurityPolicy({ dev = false, preview = false }: HeaderOptions = {}): string {
  const strict: [string, string][] = [
    ['default-src', "'self'"],
    ['script-src', `'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`],
    ['style-src', "'self' 'unsafe-inline'"],
    ['img-src', "'self' data:"],
    ['font-src', "'self'"],
    ['connect-src', "'self'"],
    ['media-src', "'self'"],
    ['object-src', "'none'"],
    ['base-uri', "'self'"],
    ['form-action', "'self'"],
    ['frame-ancestors', "'none'"],
  ];
  if (!preview) return strict.map(([name, sources]) => `${name} ${sources}`).join('; ');
  // frame-src is not in the strict list (default-src covers it), so the toolbar's frame directive starts from 'self'
  const directives = new Map(strict);
  for (const [name, extra] of Object.entries(TOOLBAR)) {
    const sources = new Set(`${directives.get(name) ?? "'self'"} ${extra}`.split(' '));
    directives.set(name, [...sources].join(' '));
  }
  return [...directives].map(([name, sources]) => `${name} ${sources}`).join('; ');
}

export function securityHeaders(options: HeaderOptions = {}): { key: string; value: string }[] {
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(options) },
  ];
}
