// Scorecard rows, moved verbatim from Appendix A. `id` is the legacy data-row value; persisted keys are `${id}:${week}`.
// mode: min = hit at or above `min`, close at half of it; growing = beats the previous week; track = no status.
export type ScoreMode = 'min' | 'growing' | 'track';
export type ScoreRow = { id: string; label: string; target: string; mode: ScoreMode; min: number };

export const SCORECARD_CAPTION = 'Table A.1. Weekly scorecard. The rows match Table 8.2.';

export const SCORE_HEADINGS = ["LEADING INDICATOR", "WEEKLY TARGET", "WK 1", "WK 2", "WK 3", "WK 4"];

export const SCORE_ROWS: ScoreRow[] = [
  { id: "calls", label: "Outbound calls (sphere, database, new leads)", target: "40 to 60", mode: "min", min: 40 },
  { id: "conversations", label: "Conversations (two-way, phone or in person)", target: "15 to 25", mode: "min", min: 15 },
  { id: "followups", label: "Follow-ups completed (follow-up plan tasks, nurture touches, overdue contacts)", target: "30 to 50", mode: "min", min: 30 },
  { id: "appts-set", label: "Appointments set (consultations and listing appointments)", target: "1 to 2", mode: "min", min: 1 },
  { id: "appts-held", label: "Appointments held", target: "1+", mode: "min", min: 1 },
  { id: "events", label: "Open houses or events", target: "1", mode: "min", min: 1 },
  { id: "db-days", label: "Database updated before end of day (days out of 5)", target: "5", mode: "min", min: 5 },
  { id: "new-contacts", label: "New contacts added to your CRM (with source)", target: "15", mode: "min", min: 15 },
  { id: "content", label: "Content posted (per Table 3.1)", target: "2", mode: "min", min: 2 },
  { id: "morning-blocks", label: "Morning blocks held (out of 5)", target: "4+", mode: "min", min: 4 },
  { id: "pipeline-count", label: "Active opportunities in pipeline", target: "Growing", mode: "growing", min: 0 },
  { id: "pipeline-value", label: "Pipeline value (likely commission)", target: "Growing", mode: "growing", min: 0 },
  { id: "referrals", label: "Referrals received", target: "Track", mode: "track", min: 0 },
];
