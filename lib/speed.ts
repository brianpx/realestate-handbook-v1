// Speed-to-lead bands and the stopwatch format. Ported from legacy/js/widgets.js (Ch. 4).
// y is a relative height for drawing only. The handbook gives three bands, not percentages.
export const SPEED_STOPS = [
  { label: '1 min', minutes: 1, y: 100 },
  { label: '3 min', minutes: 3, y: 94 },
  { label: '10 min', minutes: 10, y: 74 },
  { label: '20 min', minutes: 20, y: 62 },
  { label: '30 min', minutes: 30, y: 52 },
  { label: '1 hr', minutes: 60, y: 28 },
  { label: '3 hr', minutes: 180, y: 14 },
  { label: '8 hr', minutes: 480, y: 7 },
  { label: '24 hr', minutes: 1440, y: 4 },
] as const;

export type SpeedBand = 'top' | 'strong' | 'drop';

export const SPEED_BANDS: Record<SpeedBand, { name: string; detail: string }> = {
  top: {
    name: 'Highest conversion window',
    detail: 'You are inside five minutes. An automated first touch plus an immediate live call is what keeps you here, even when you are with a client.',
  },
  strong: {
    name: 'Strong conversion',
    detail: 'Still a good window, but you are racing agents who answered first. The handbook standard is a live call within five minutes.',
  },
  drop: {
    name: 'Sharp drop-off',
    detail: 'The person has probably sent the same inquiry to two or three other agents, and someone has likely answered. Most agents respond in hours; top producers respond in minutes.',
  },
};

export function speedBand(minutes: number): SpeedBand {
  if (minutes < 5) return 'top';
  if (minutes <= 30) return 'strong';
  return 'drop';
}

export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export const RESPONSE_TOUCHES = [
  { key: 'text', label: 'Text arrived', name: 'Text', limitMin: 1, standard: 'automated first touch within 1 minute' },
  { key: 'email', label: 'Email arrived', name: 'Email', limitMin: 1, standard: 'automated first touch within 1 minute' },
  { key: 'call', label: 'Call arrived', name: 'Call', limitMin: 5, standard: 'live call within 5 minutes' },
] as const;

/** The line shown under the stopwatch when a reply is stamped at `ms` elapsed. */
export function stampResult(touch: (typeof RESPONSE_TOUCHES)[number], ms: number): { meets: boolean; text: string } {
  const minutes = ms / 60000;
  const meets = minutes <= touch.limitMin;
  const text = `${touch.name}: ${formatElapsed(ms)}. ` +
    (meets ? `Meets the standard (${touch.standard}).` : `Slower than the standard (${touch.standard}). ${SPEED_BANDS[speedBand(minutes)].name}.`);
  return { meets, text };
}
