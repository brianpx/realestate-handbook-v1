import type { NextConfig } from 'next';
import { HANDBOOK, LEGACY_PAGE_SLUGS } from './lib/routes';

const config: NextConfig = {
  // Old shared links look like /#ch5; hashes never reach the server, so app/layout.tsx redirects those on the client.
  // The media route serves files from media/ (outside public/, see lib/media.ts), so a deployment must carry them.
  outputFileTracingIncludes: { '/**': ['./content/pages/**'], '/api/media/[...path]': ['./media/**'] },
  // The handbook moved from the site root into /handbook. Permanent, and a #heading on the old address survives
  // the redirect because browsers carry the fragment over.
  async redirects() {
    return LEGACY_PAGE_SLUGS.map(slug => ({ source: `/${slug}`, destination: `${HANDBOOK}/${slug}`, permanent: true }));
  },
};

export default config;
