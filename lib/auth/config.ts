// Sign-in's shared constants. The terms sentence is what the reader was shown under the button; the server stores
// the version they name (never text the browser sends) on the user at their first sign-in, like CONSENT_TEXTS does
// for the lead form.
export const TERMS_VERSION = 'v1';
export const TERMS_TEXT =
  'We email you a link that signs you in; there is no password. By continuing you agree to the Terms of Use and the Privacy Policy. Signing in does not subscribe you to anything.';
export const TERMS_TEXTS: Record<typeof TERMS_VERSION, string> = { [TERMS_VERSION]: TERMS_TEXT };

// Which placement produced a sign-in request, stored on the token so placements can be compared without a tracker.
export const SOURCES = ['hero', 'calculator', 'final', 'signup-page', 'signin', 'account'] as const;
export type Source = (typeof SOURCES)[number];

export const TOKEN_TTL_SECONDS = 15 * 60;
export const SESSION_MAX_AGE_SECONDS = 90 * 24 * 3600; // sliding
export const SESSION_CAP_SECONDS = 365 * 24 * 3600; // absolute, from creation
export const SESSION_RENEW_AFTER_SECONDS = 24 * 3600; // a session is extended at most this often

// Attempts count whether or not they succeed. Request-link is limited per connection and per address; verify per
// connection only, so the failure card cannot be used to probe token hashes by volume. Local `next dev` shares one
// IP (`local`) and one mailbox, so production numbers block the owner; development uses a high ceiling instead.
export const REQUEST_LINK_LIMITS = {
  ip: { attempts: 5, windowSeconds: 600 },
  email: { attempts: 3, windowSeconds: 3600 },
} as const;
export const VERIFY_LIMIT = { attempts: 10, windowSeconds: 600 } as const;
export const DEV_ATTEMPT_CEILING = 10_000;

export type AttemptWindow = { attempts: number; windowSeconds: number };
export type AuthRateLimits = {
  requestLink: { ip: AttemptWindow; email: AttemptWindow };
  verify: AttemptWindow;
};

/** Production keeps the tight windows; every other NODE_ENV (including `next dev`) uses the high ceiling. */
export function authRateLimits(env: { NODE_ENV?: string }): AuthRateLimits {
  if (env.NODE_ENV === 'production') return { requestLink: REQUEST_LINK_LIMITS, verify: VERIFY_LIMIT };
  return {
    requestLink: {
      ip: { attempts: DEV_ATTEMPT_CEILING, windowSeconds: REQUEST_LINK_LIMITS.ip.windowSeconds },
      email: { attempts: DEV_ATTEMPT_CEILING, windowSeconds: REQUEST_LINK_LIMITS.email.windowSeconds },
    },
    verify: { attempts: DEV_ATTEMPT_CEILING, windowSeconds: VERIFY_LIMIT.windowSeconds },
  };
}
export const MAX_BODY_BYTES = 4096;

export const DEFAULT_NEXT_PATH = '/handbook';
export const SIGN_IN_PATH = '/signup';
export const VERIFY_PATH = '/auth/verify';
/** Set by proxy.ts on every gated request: the path and query asked for, so sign-in can come back to it. */
export const PATH_HEADER = 'x-hb-path';
