type Env = Record<string, string | undefined>;

// The public origin, with no trailing slash. An explicit NEXT_PUBLIC_SITE_URL wins (set it for Production). Otherwise
// a Vercel build uses its own address, so canonicals, the sitemap, JSON-LD and the lead form's same-origin check are
// right on every preview without per-deploy edits. Read at build time and only from server code.
export function resolveSiteUrl(env: Env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  const host = env.VERCEL_ENV === 'production' ? env.VERCEL_PROJECT_PRODUCTION_URL : (env.VERCEL_BRANCH_URL ?? env.VERCEL_URL);
  return (explicit || (host ? `https://${host}` : 'http://localhost:3000')).replace(/\/+$/, '');
}

export const SITE_URL = resolveSiteUrl(process.env);

// Crawlers are kept out until this is "true", which is set for Production at cutover. Previews also get Vercel's
// own noindex header; this covers the production alias before the real domain exists.
export const isIndexable = (env: Env): boolean => env.SITE_INDEXABLE === 'true';
