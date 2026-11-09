'use client';

import { useSyncExternalStore } from 'react';
import { settingsStore, trackingProgress } from '../state';
import { createStore } from '../state/store';
import * as actions from './actions';
import { COACH_KEY, coachSchema, type CoachState } from './schema';
import type { Attempt } from './types';

export const coachStore = createStore({ key: COACH_KEY, schema: coachSchema });

export const useCoachState = (): CoachState => useSyncExternalStore(coachStore.subscribe, coachStore.get, coachStore.getServerSnapshot);

/** Records an answer unless the reader switched progress tracking off, in which case nothing is stored. */
export function recordAttempt(input: actions.AttemptInput): Attempt | undefined {
  if (!trackingProgress(settingsStore.get())) return undefined;
  return actions.recordAttempt(coachStore, input);
}

export const markStep = (sessionId: string, step: actions.Step): void => {
  if (trackingProgress(settingsStore.get())) actions.markStep(coachStore, sessionId, step);
};
export const applyPlan = (input: Parameters<typeof actions.applyPlan>[1], today: string): void => { actions.applyPlan(coachStore, input, today); };
export const reschedule = (today: string): void => { actions.reschedule(coachStore, today); };
export const mergeAttempts = (incoming: readonly Attempt[]): number => actions.mergeAttempts(coachStore, incoming);
