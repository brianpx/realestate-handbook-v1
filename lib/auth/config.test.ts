import { describe, expect, it } from 'vitest';
import { authRateLimits, DEV_ATTEMPT_CEILING, REQUEST_LINK_LIMITS, VERIFY_LIMIT } from './config';

describe('authRateLimits', () => {
  it('keeps the tight production windows', () => {
    expect(authRateLimits({ NODE_ENV: 'production' })).toEqual({ requestLink: REQUEST_LINK_LIMITS, verify: VERIFY_LIMIT });
  });
  it('raises the attempt ceiling for local development so sign-in is not blocked after a few tries', () => {
    const limits = authRateLimits({ NODE_ENV: 'development' });
    expect(limits.requestLink.ip.attempts).toBe(DEV_ATTEMPT_CEILING);
    expect(limits.requestLink.email.attempts).toBe(DEV_ATTEMPT_CEILING);
    expect(limits.verify.attempts).toBe(DEV_ATTEMPT_CEILING);
    expect(limits.requestLink.ip.windowSeconds).toBe(REQUEST_LINK_LIMITS.ip.windowSeconds);
    expect(authRateLimits({}).requestLink.ip.attempts).toBe(DEV_ATTEMPT_CEILING);
  });
});
