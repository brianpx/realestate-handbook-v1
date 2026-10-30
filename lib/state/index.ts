'use client';

import { useSyncExternalStore } from 'react';
import { COACH_KEY, coachSchema, type CoachState } from '../coach/schema';
import { handbookStateSchema, migrate, settingsSchema, SETTINGS_KEY, STATE_KEY, type HandbookState, type Settings, type TextSize } from './schema';
import { createStore } from './store';
import { buildExport, type ImportResult } from './transfer';

export const stateStore = createStore({ key: STATE_KEY, schema: handbookStateSchema, migrate });
export const settingsStore = createStore({ key: SETTINGS_KEY, schema: settingsSchema, migrate });

export const useHandbookState = (): HandbookState =>
  useSyncExternalStore(stateStore.subscribe, stateStore.get, stateStore.getServerSnapshot);

export const useSettings = (): Settings =>
  useSyncExternalStore(settingsStore.subscribe, settingsStore.get, settingsStore.getServerSnapshot);

// "on unless the reader switched it off"
export const trackingProgress = (s: Settings) => s.trackProgress !== false;
export const quizzesShown = (s: Settings) => s.hideQuizzes !== true;
export const essentialOnly = (s: Settings) => s.essentialOnly === true;
export const textSize = (s: Settings): TextSize => s.textSize ?? 'medium';

export function markRead(pageId: string): void {
  if (!trackingProgress(settingsStore.get())) return;
  if (stateStore.get().read[pageId]) return;
  stateStore.update(s => { s.read[pageId] = true; });
}

export function resetProgress(): boolean {
  if (Object.keys(stateStore.get().read).length === 0) return false;
  stateStore.update(s => { s.read = {}; });
  return true;
}

/** Returns false when storage is blocked, so the caller can leave the control as it was. */
export function writeSettings(patch: Partial<Settings>): boolean {
  const persisted = settingsStore.update(s => { Object.assign(s, patch); });
  // A choice that cannot be saved is dropped, as the static site did, so the control does not claim a setting
  // that vanishes on the next page.
  if (!persisted) settingsStore.invalidate();
  return persisted;
}

export function setCheck(key: string, checked: boolean): void {
  stateStore.update(s => { s.checks[key] = checked; });
}

export function setScore(key: string, value: number | undefined): void {
  stateStore.update(s => { if (value === undefined) delete s.scorecard[key]; else s.scorecard[key] = value; });
}

/** The scorecard's free-text "one change" note lives beside the numbers, under the key `change`, as before. */
export function setScoreChange(text: string): void {
  stateStore.update(s => { s.scorecard.change = text; });
}

export function clearScorecard(): void {
  stateStore.update(s => { s.scorecard = {}; });
}

/** Stores one goal-calculator input; undefined removes it. */
export function setCalc(key: string, value: number | undefined): void {
  stateStore.update(s => { if (value === undefined) delete s.calc[key]; else s.calc[key] = value; });
}

/** Script practice text, keyed by the script box's title text as before. */
export function setScript(key: string, text: string): void {
  stateStore.update(s => { s.scripts[key] = text; });
}

/** Objections the reader has marked as nailed, keyed by the objection text as before. */
export function setObjection(key: string, mastered: boolean): void {
  stateStore.update(s => { if (mastered) s.objections[key] = true; else delete s.objections[key]; });
}

/** One tool's saved slice (`widgets[name]`); a fresh object until the tool has saved something. */
export const widgetOf = (state: HandbookState, name: string): Record<string, unknown> => state.widgets[name] ?? {};

export function updateWidget(name: string, recipe: (slice: Record<string, unknown>) => void): void {
  stateStore.update(s => { recipe((s.widgets[name] ??= {})); });
}

/** The reader's lead-source cost inputs: an hourly rate plus per-source spend, hours and closings. */
export function setSourceRate(rate: number | undefined): void {
  updateWidget('sourceCost', w => { if (rate === undefined) delete w.rate; else w.rate = rate; });
}

export function setSourceField(source: string, field: 'spend' | 'hours' | 'closings', value: number | undefined): void {
  updateWidget('sourceCost', w => {
    const rows = (w.rows && typeof w.rows === 'object' ? w.rows : (w.rows = {})) as Record<string, Record<string, unknown>>;
    const row = (rows[source] ??= {});
    if (value === undefined) delete row[field]; else row[field] = value;
  });
}

/** Rows of the pipeline calculator, always at least one (an empty contact). */
export function updatePipelineRows(recipe: (rows: Record<string, unknown>[]) => void): void {
  updateWidget('pipeline', w => {
    const rows = (Array.isArray(w.rows) ? w.rows : (w.rows = [{}])) as Record<string, unknown>[];
    recipe(rows);
    if (rows.length === 0) rows.push({});
  });
}

export function setRoadmapStart(iso: string): void {
  updateWidget('roadmap', w => { if (iso) w.start = iso; else delete w.start; });
}

export function setTimeblock(patch: Record<string, unknown>): void {
  updateWidget('timeblock', w => { Object.assign(w, patch); });
}

export function setPostClose(patch: { date?: string; closings?: number | undefined }): void {
  updateWidget('postClose', w => {
    if ('date' in patch) { if (patch.date) w.date = patch.date; else delete w.date; }
    if ('closings' in patch) { if (patch.closings === undefined) delete w.closings; else w.closings = patch.closings; }
  });
}

// lib/coach imports this module, so the live coach store cannot be imported here. Callers pass the snapshot and the
// store; with no snapshot, export reads whatever localStorage holds under handbookCoach.
function readCoach(): unknown {
  try {
    const text = window.localStorage.getItem(COACH_KEY);
    if (text === null) return coachSchema.parse({});
    const parsed = coachSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : coachSchema.parse({});
  } catch {
    return coachSchema.parse({});
  }
}

/** Everything saved on this device, as the file the Settings panel offers to download. */
export const exportProgress = (coach: unknown = readCoach()) => buildExport(stateStore.get(), settingsStore.get(), new Date(), coach);

/**
 * Replaces this device's progress with a validated import. What was there is first copied to `<key>.pre-import`
 * (one copy, overwritten by the next import) so a mistaken restore can be undone by hand. Returns false when the
 * browser would not save the new values. A file with no handbookCoach leaves that store as it is. `coachStore` is
 * the live one; this module cannot import it.
 */
export function applyImport(result: Extract<ImportResult, { ok: true }>, coachStore?: { replace: (next: CoachState) => boolean }): boolean {
  const keys = [STATE_KEY, SETTINGS_KEY];
  if (result.coach !== undefined) keys.push(COACH_KEY);
  for (const key of keys) {
    try {
      const current = window.localStorage.getItem(key);
      if (current !== null) window.localStorage.setItem(`${key}.pre-import`, current);
    } catch {
      // storage blocked: the replace below will report it
    }
  }
  const a = stateStore.replace(result.state);
  const b = settingsStore.replace(result.settings);
  if (result.coach === undefined) return a && b;
  if (coachStore) return a && b && coachStore.replace(result.coach);
  try {
    window.localStorage.setItem(COACH_KEY, JSON.stringify(result.coach));
  } catch {
    return false;
  }
  return a && b;
}

