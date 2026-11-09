import { describe, expect, it } from 'vitest';
import { emailSchema } from './email';

describe('emailSchema', () => {
  it('trims and lower-cases, and keeps dots and plus tags as written', () => {
    expect(emailSchema.parse('  First.Last+tag@Example.COM ')).toBe('first.last+tag@example.com');
  });
  it.each(['', 'x', 'a@', '@b.co', 'a b@c.co', `${'x'.repeat(250)}@b.co`])('rejects %j', value => {
    expect(emailSchema.safeParse(value).success).toBe(false);
  });
});
