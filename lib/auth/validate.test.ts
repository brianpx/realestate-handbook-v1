import { describe, expect, it } from 'vitest';
import { requestLinkSchema, safeNextPath } from './validate';

describe('safeNextPath', () => {
  it.each(['/handbook/ch2', '/account?tab=sessions', '/handbook/ch2#goal-calculator', '/a:b'])('keeps the same-site path %s', p => {
    expect(safeNextPath(p)).toBe(p);
  });
  it.each([undefined, null, '', 'handbook', '//evil.example', '/\\evil.example', 'https://evil.example/x', 'javascript:alert(1)', '/has space', '/ctrl\u0000', `/${'x'.repeat(2000)}`])(
    'replaces %j with the handbook home',
    p => {
      expect(safeNextPath(p)).toBe('/handbook');
    },
  );
});

describe('requestLinkSchema', () => {
  it('accepts the fields the form sends, normalising the address', () => {
    const parsed = requestLinkSchema.parse({ email: ' Reader@Example.COM ', termsVersion: 'v1', source: 'hero', next: '/handbook/ch2' });
    expect(parsed).toEqual({ email: 'reader@example.com', termsVersion: 'v1', source: 'hero', next: '/handbook/ch2', _gotcha: '' });
  });
  it.each([
    ['an unknown terms version', { email: 'a@b.co', termsVersion: 'v9', source: 'hero' }],
    ['an unknown source', { email: 'a@b.co', termsVersion: 'v1', source: 'popup' }],
    ['a bad address', { email: 'nope', termsVersion: 'v1', source: 'hero' }],
    ['a missing source', { email: 'a@b.co', termsVersion: 'v1' }],
  ])('refuses %s', (_, body) => {
    expect(requestLinkSchema.safeParse(body).success).toBe(false);
  });
});
