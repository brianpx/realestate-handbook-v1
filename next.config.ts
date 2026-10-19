import type { NextConfig } from 'next';

const config: NextConfig = {
  // Old shared links look like /#ch5; hashes never reach the server, so app/layout.tsx redirects those on the client.
  outputFileTracingIncludes: { '/**': ['./content/pages/**'] },
};

export default config;
