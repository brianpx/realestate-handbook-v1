import { describe, expect, it } from 'vitest';
import { DEFAULT_SEND_CEILING, SEND_CEILING_WINDOW_SECONDS, sendCeilingFromEnv, sendWindowStart } from './send-ceiling';

describe('sendCeilingFromEnv', () => {
  it('reads a positive whole number and falls back to the default for anything else', () => {
    expect(sendCeilingFromEnv({})).toBe(DEFAULT_SEND_CEILING);
    expect(sendCeilingFromEnv({ EMAIL_SEND_CEILING: ' 120 ' })).toBe(120);
    expect(sendCeilingFromEnv({ EMAIL_SEND_CEILING: '1' })).toBe(1);
    for (const bad of ['', '0', '-5', '1.5', 'many', '1e3', '0x10']) expect(sendCeilingFromEnv({ EMAIL_SEND_CEILING: bad }), bad).toBe(DEFAULT_SEND_CEILING);
  });
});

describe('sendWindowStart', () => {
  it('aligns to the clock so every instance names the same window', () => {
    expect(SEND_CEILING_WINDOW_SECONDS).toBe(600);
    expect(sendWindowStart(new Date('2026-11-09T12:00:00Z'))).toEqual(new Date('2026-11-09T12:00:00Z'));
    expect(sendWindowStart(new Date('2026-11-09T12:09:59.999Z'))).toEqual(new Date('2026-11-09T12:00:00Z'));
    expect(sendWindowStart(new Date('2026-11-09T12:10:00Z'))).toEqual(new Date('2026-11-09T12:10:00Z'));
  });
});
