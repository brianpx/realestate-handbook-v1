import { describe, expect, it } from 'vitest';
import { displayNameInputSchema, resolveDisplayName } from './display-name';

const base = { email: 'pat.realtor@example.com', firstName: null, lastName: null, displayName: null };

describe('resolveDisplayName', () => {
  it('prefers the chosen name, then first and last name, then the address before the @', () => {
    expect(resolveDisplayName({ ...base, displayName: ' Pat R ', firstName: 'Patricia', lastName: 'Realtor' })).toBe('Pat R');
    expect(resolveDisplayName({ ...base, firstName: 'Patricia', lastName: 'Realtor' })).toBe('Patricia Realtor');
    expect(resolveDisplayName({ ...base, lastName: 'Realtor' })).toBe('Realtor');
    expect(resolveDisplayName(base)).toBe('pat.realtor');
  });
  it('treats blank stored names as absent', () => {
    expect(resolveDisplayName({ ...base, displayName: '  ', firstName: ' ', lastName: '' })).toBe('pat.realtor');
  });
});

describe('displayNameInputSchema', () => {
  it('trims and accepts 1 to 32 characters', () => {
    expect(displayNameInputSchema.parse({ displayName: '  Pat ' })).toEqual({ displayName: 'Pat' });
    expect(displayNameInputSchema.safeParse({ displayName: 'x'.repeat(32) }).success).toBe(true);
  });
  it('refuses empty, over-long, non-string and extra keys', () => {
    for (const body of [{ displayName: '   ' }, { displayName: 'x'.repeat(33) }, { displayName: null }, { displayName: 'a', id: 'b' }]) {
      expect(displayNameInputSchema.safeParse(body).success).toBe(false);
    }
  });
});
