import { z } from 'zod';
import { coachSchema, type CoachState } from '../coach/schema';
import { handbookStateSchema, migrate, settingsSchema, type HandbookState, type Settings } from './schema';

// Moving progress between devices or origins as a file. localStorage does not cross origins, so readers of the
// static site (on github.io) would lose everything at cutover without this. The file holds the stored objects as
// they are, so the static site writes the same format with no knowledge of this app's schema. handbookCoach is
// optional: the static site's files omit it, and importing one does not clear the coach store.
export const TRANSFER_FORMAT = 'handbook-progress';
export const MAX_IMPORT_BYTES = 1_000_000;

const fileSchema = z.object({
  format: z.literal(TRANSFER_FORMAT),
  version: z.literal(1),
  exportedAt: z.string().optional(),
  handbookState: z.unknown().optional(),
  handbookSettings: z.unknown().optional(),
  handbookCoach: z.unknown().optional(),
});

export type ProgressFile = {
  format: typeof TRANSFER_FORMAT;
  version: 1;
  exportedAt: string;
  handbookState: unknown;
  handbookSettings: unknown;
  handbookCoach?: unknown;
};

export const buildExport = (state: unknown, settings: unknown, now: Date, coach?: unknown): ProgressFile => ({
  format: TRANSFER_FORMAT,
  version: 1,
  exportedAt: now.toISOString(),
  handbookState: state,
  handbookSettings: settings,
  ...(coach === undefined ? {} : { handbookCoach: coach }),
});

export type ImportSummary = { chaptersRead: number; checklistTicks: number; scorecardEntries: number; tools: number; checkpointAnswers: number };
export type ImportResult =
  | { ok: true; state: HandbookState; settings: Settings; summary: ImportSummary; coach?: CoachState }
  | { ok: false; error: string };

const count = (o: unknown) => (typeof o === 'object' && o !== null ? Object.keys(o).length : 0);

export function parseImport(text: string): ImportResult {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) return { ok: false, error: 'That file is too large to be a handbook progress file.' };
  let json: unknown;
  try { json = JSON.parse(text); } catch { return { ok: false, error: 'That file is not a handbook progress file (it is not valid JSON).' }; }
  const file = fileSchema.safeParse(json);
  if (!file.success) return { ok: false, error: 'That file is not a handbook progress file.' };
  // an absent half means "nothing saved there", the same as an empty object
  const state = handbookStateSchema.safeParse(migrate(file.data.handbookState ?? {}));
  const settings = settingsSchema.safeParse(migrate(file.data.handbookSettings ?? {}));
  if (!state.success || !settings.success) return { ok: false, error: 'The progress in that file could not be read.' };
  const ok = { ok: true as const, state: state.data, settings: settings.data, summary: summarizeState(state.data) };
  // null and missing both mean "this file has no coach snapshot" (the static site never wrote one)
  if (file.data.handbookCoach === undefined || file.data.handbookCoach === null) return ok;
  const coach = coachSchema.safeParse(file.data.handbookCoach);
  if (!coach.success) return { ok: false, error: 'The progress in that file could not be read.' };
  return { ...ok, coach: coach.data };
}

/** Counts of what a state holds, for the restore confirmation and the Account page. */
export const summarizeState = (s: HandbookState): ImportSummary => ({
  chaptersRead: Object.values(s.read).filter(Boolean).length,
  checklistTicks: Object.values(s.checks).filter(v => v === true).length,
  scorecardEntries: count(s.scorecard),
  tools: count(s.widgets),
  checkpointAnswers: count(s.widgets.checkpoints),
});

export function describeSummary(x: ImportSummary): string {
  const parts = [
    `${x.chaptersRead} ${x.chaptersRead === 1 ? 'section' : 'sections'} read`,
    `${x.checklistTicks} checklist ${x.checklistTicks === 1 ? 'tick' : 'ticks'}`,
    `${x.scorecardEntries} scorecard ${x.scorecardEntries === 1 ? 'entry' : 'entries'}`,
    `${x.checkpointAnswers} checkpoint ${x.checkpointAnswers === 1 ? 'answer' : 'answers'}`,
    `${x.tools} ${x.tools === 1 ? 'tool' : 'tools'} with saved work`,
  ];
  return parts.join(', ');
}
