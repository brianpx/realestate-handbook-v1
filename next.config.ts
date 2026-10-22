import type { NextConfig } from 'next';
import { HANDBOOK, LEGACY_PAGE_SLUGS } from './lib/routes';

const config: NextConfig = {
  // Old shared links look like /#ch5; hashes never reach the server, so app/layout.tsx redirects those on the client.
  outputFileTracingIncludes: { '/**': ['./content/pages/**'] },
  // The handbook moved from the site root into /handbook. Permanent, and a #heading on the old address survives
  // the redirect because browsers carry the fragment over.
  async redirects() {
    return LEGACY_PAGE_SLUGS.map(slug => ({ source: `/${slug}`, destination: `${HANDBOOK}/${slug}`, permanent: true }));
  },
};

export default config;
