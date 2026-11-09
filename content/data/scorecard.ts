// Scorecard rows, moved verbatim from Appendix A. `id` is the legacy data-row value; persisted keys are `${id}:${week}`.
// mode: min = hit at or above `min`, close at half of it; growing = beats the previous week; track = no status.
// Targets and thresholds come from Table 8.2 via rules.ts; the events row keeps its one-figure form until M4 step 4
// decides how the widget scores the table's first-30-days ramp-up.
import { WEEKLY_TARGETS, type WeeklyTargetId } from './rules';

export type ScoreMode = 'min' | 'growing' | 'track';
export type ScoreRow = { id: WeeklyTargetId; label: string; target: string; mode: ScoreMode; min: number };

export const SCORECARD_CAPTION = 'Table A.1. Weekly scorecard. The rows match Table 8.2.';

export const SCORE_HEADINGS = ["LEADING INDICATOR", "WEEKLY TARGET", "WK 1", "WK 2", "WK 3", "WK 4"];

export const SCORE_ROWS: ScoreRow[] = [
  { id: "calls", label: "Outbound calls (sphere, database, new leads)", mode: "min", ...WEEKLY_TARGETS.calls },
  { id: "conversations", label: "Conversations (two-way, phone or in person)", mode: "min", ...WEEKLY_TARGETS.conversations },
  { id: "followups", label: "Follow-ups completed (follow-up plan tasks, nurture touches, overdue contacts)", mode: "min", ...WEEKLY_TARGETS.followups },
  { id: "appts-set", label: "Appointments set (consultations and listing appointments)", mode: "min", ...WEEKLY_TARGETS["appts-set"] },
  { id: "appts-held", label: "Appointments held", mode: "min", ...WEEKLY_TARGETS["appts-held"] },
  { id: "events", label: "Open houses or events", mode: "min", target: "1", min: WEEKLY_TARGETS.events.min },
  { id: "db-days", label: "Database updated before end of day (days out of 5)", mode: "min", ...WEEKLY_TARGETS["db-days"] },
  { id: "new-contacts", label: "New contacts added to your CRM (with source)", mode: "min", ...WEEKLY_TARGETS["new-contacts"] },
  { id: "content", label: "Content posted (per Table 3.1)", mode: "min", ...WEEKLY_TARGETS.content },
  { id: "morning-blocks", label: "Morning blocks held (out of 5)", mode: "min", ...WEEKLY_TARGETS["morning-blocks"] },
  { id: "pipeline-count", label: "Active opportunities in pipeline", mode: "growing", ...WEEKLY_TARGETS["pipeline-count"] },
  { id: "pipeline-value", label: "Pipeline value (likely commission)", mode: "growing", ...WEEKLY_TARGETS["pipeline-value"] },
  { id: "referrals", label: "Referrals received", mode: "track", ...WEEKLY_TARGETS.referrals },
];
