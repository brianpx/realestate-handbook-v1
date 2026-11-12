import { describe, expect, it } from 'vitest';
import { isUnsubscribeShape, signUnsubscribe, verifyUnsubscribe } from './unsubscribe';

const ID = '3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b';

describe('unsubscribe tokens', () => {
  it('round-trip to the lead id, whatever the case the id was written in', () => {
    expect(verifyUnsubscribe(signUnsubscribe(ID, 'secret'), 'secret')).toBe(ID);
    expect(verifyUnsubscribe(signUnsubscribe(ID.toUpperCase(), 'secret'), 'secret')).toBe(ID);
  });
  it('are not valid under another secret, another id, or a changed tag', () => {
    const token = signUnsubscribe(ID, 'secret');
    expect(verifyUnsubscribe(token, 'other')).toBeNull();
    expect(verifyUnsubscribe(token.replace(ID, '3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6c'), 'secret')).toBeNull();
    expect(verifyUnsubscribe(`${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`, 'secret')).toBeNull();
  });
  it('are told apart from junk by shape before any check', () => {
    expect(isUnsubscribeShape(signUnsubscribe(ID, 'secret'))).toBe(true);
    for (const v of [undefined, null, 42, '', 'junk', `${ID}.short`, `${ID}.${'A'.repeat(44)}`, `not-a-uuid.${'A'.repeat(43)}`]) expect(isUnsubscribeShape(v)).toBe(false);
    expect(verifyUnsubscribe('junk', 'secret')).toBeNull();
  });
  it('do not carry over between secrets used for another purpose', () => {
    expect(signUnsubscribe(ID, 'a')).not.toBe(signUnsubscribe(ID, 'b'));
  });
});
