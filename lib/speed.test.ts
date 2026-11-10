import { describe, expect, it } from 'vitest';
import { LIVE_CALL_MINUTES } from '@/content/data/rules';
import { formatElapsed, RESPONSE_TOUCHES, SPEED_BANDS, speedBand, stampResult } from './speed';

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

describe('SPEED_BANDS', () => {
  it('names the live-call limit from rules.ts in the top and strong band details', () => {
    for (const band of ['top', 'strong'] as const) expect(SPEED_BANDS[band].detail, band).toContain(`${WORDS[LIVE_CALL_MINUTES]} minutes`);
  });
});

describe('speedBand', () => {
  it.each([[1, 'top'], [4.99, 'top'], [5, 'strong'], [30, 'strong'], [30.01, 'drop'], [1440, 'drop']] as const)('%s min -> %s', (m, band) => {
    expect(speedBand(m)).toBe(band);
  });
});

describe('formatElapsed', () => {
  it.each([[0, '0:00'], [999, '0:00'], [5000, '0:05'], [65000, '1:05'], [600000, '10:00']])('%s ms -> %s', (ms, out) => {
    expect(formatElapsed(ms)).toBe(out);
  });
});

describe('stampResult', () => {
  const [text, , call] = RESPONSE_TOUCHES;
  it('meets the one-minute standard for a text at exactly 60 seconds', () => {
    expect(stampResult(text, 60000)).toEqual({ meets: true, text: 'Text: 1:00. Meets the standard (automated first touch within 1 minute).' });
  });
  it('names the band for a slow reply', () => {
    expect(stampResult(call, 6 * 60000).text).toBe('Call: 6:00. Slower than the standard (live call within 5 minutes). Strong conversion.');
    expect(stampResult(call, 45 * 60000).text).toContain('Sharp drop-off.');
  });
});
