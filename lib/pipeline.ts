// Pipeline value and the Monday-call rule. Ported from setupPipelineCalculator in legacy/js/widgets-practice.js.
export const PIPELINE_TYPES = ['Active opportunity', 'Nurture'] as const;
export const QUIET_DAYS = 14;

export type PipelineRow = { name?: string; type?: string; commission?: number; days?: number; next?: boolean };

export const isActive = (r: PipelineRow): boolean => (r.type ?? PIPELINE_TYPES[0]) === PIPELINE_TYPES[0];
/** No real conversation for QUIET_DAYS and nothing scheduled: this contact gets a call on Monday. */
export const needsCall = (r: PipelineRow): boolean => (r.days ?? 0) >= QUIET_DAYS && !r.next;

export function pipelineStats(rows: readonly PipelineRow[]): { value: number; active: number; calls: number } {
  let value = 0;
  let active = 0;
  let calls = 0;
  for (const r of rows) {
    if (isActive(r)) { active++; value += r.commission ?? 0; }
    if (needsCall(r)) calls++;
  }
  return { value, active, calls };
}

export const callFlag = (r: PipelineRow): string => (needsCall(r) ? `⚑ Call Monday: ${r.days} days quiet, no next step` : '');
