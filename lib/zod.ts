import { z } from 'zod';

// Every schema imports `z` from here, not from 'zod'. Zod probes `new Function` once to decide whether it may
// compile parsers; the site's Content-Security-Policy (lib/security-headers.ts) has no 'unsafe-eval', so the probe
// is caught but still reported as a violation in the browser. `jitless` skips it (zod/v4/core/util.js, allowsEval).
z.config({ jitless: true });

export { z };
