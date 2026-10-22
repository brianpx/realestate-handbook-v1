import { z } from 'zod';

// Shapes match what the static site wrote under `handbookState` and `handbookSettings`, so a reader's
// existing progress carries over. Widget payloads stay loosely typed here; each widget validates its own slice.
//
// `version` is the stored-schema version. The static site wrote none, which we call version 0; its shape is
// identical to version 1, so that step only stamps the number. Add a step to MIGRATIONS (never edit an old one)
// whenever a stored shape changes.
export const SCHEMA_VERSION = 1;
const version = z.number().int().nonnegative().catch(SCHEMA_VERSION).default(SCHEMA_VERSION);

type Migration = (stored: Record<string, unknown>) => Record<string, unknown>;
const MIGRATIONS: Migration[] = [
  // 0 -> 1: the static site's payload is already the v1 shape, except that two Checkpoint boxes gained a question
  // after it shipped (Chapter 4 at the front, Chapter 5 second), so answers saved under the old numbers move down.
  stored => {
    const widgets = stored.widgets;
    if (typeof widgets !== 'object' || widgets === null) return stored;
    const checkpoints = (widgets as Record<string, unknown>).checkpoints;
    if (typeof checkpoints !== 'object' || checkpoints === null) return stored;
    const insertedAt: Record<string, number> = { ch4: 0, ch5: 1 };
    const shifted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(checkpoints)) {
      const m = /^(ch\d+):(\d+)$/.exec(key);
      const at = m ? insertedAt[m[1]!] : undefined;
      shifted[m && at !== undefined && Number(m[2]) >= at ? `${m[1]}:${Number(m[2]) + 1}` : key] = value;
    }
    return { ...stored, widgets: { ...(widgets as Record<string, unknown>), checkpoints: shifted } };
  },
];

/** Brings a stored payload up to SCHEMA_VERSION. Non-objects and payloads from a newer build pass through untouched. */
export function migrate(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return raw;
  let stored = raw as Record<string, unknown>;
  const from = typeof stored.version === 'number' && stored.version >= 0 ? Math.floor(stored.version) : 0;
  for (let v = from; v < SCHEMA_VERSION; v++) stored = { ...MIGRATIONS[v]!(stored), version: v + 1 };
  return stored;
}

const record = z.record(z.string(), z.unknown());
const flags = z.record(z.string(), z.boolean());

export const handbookStateSchema = z.looseObject({
  version,
  read: flags.catch({}),
  checks: record.catch({}),
  scorecard: record.catch({}),
  scripts: record.catch({}),
  objections: record.catch({}),
  calc: record.catch({}),
  widgets: z.record(z.string(), record).catch({}),
});
export type HandbookState = z.infer<typeof handbookStateSchema>;

export const TEXT_SIZES = ['small', 'medium', 'large'] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const settingsSchema = z.looseObject({
  version,
  dark: z.boolean().optional().catch(undefined),
  fullWidth: z.boolean().optional().catch(undefined),
  essentialOnly: z.boolean().optional().catch(undefined),
  hideQuizzes: z.boolean().optional().catch(undefined),
  trackProgress: z.boolean().optional().catch(undefined),
  // absent means medium; an unknown value is dropped rather than rejecting the whole settings object
  textSize: z.enum(TEXT_SIZES).optional().catch(undefined),
});
export type Settings = z.infer<typeof settingsSchema>;

export const STATE_KEY = 'handbookState';
export const SETTINGS_KEY = 'handbookSettings';

export const defaultState = (): HandbookState => handbookStateSchema.parse({});
export const defaultSettings = (): Settings => settingsSchema.parse({});
