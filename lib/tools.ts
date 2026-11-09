/** The tools "Essential tools only" keeps (ESSENTIAL_WIDGETS in legacy/js/interactive.js). Keys are each tool's data-widget. */
export const ESSENTIAL_WIDGETS: readonly string[] = ['goal-calculator', 'speed-to-lead', 'script-practice', 'objection-trainer', 'scorecard'];

// The tools only the Pro tier builds inside a member chapter (decision OD-31): everything that is neither one of
// the essential five nor part of the reading itself (checkpoints, quizzes, checklists, the reference tables, the
// response timer that belongs to speed-to-lead). On a free page every tool is built for every reader
// (lib/access/entitlement.ts, toolOpen). Changing what Basic includes is this list.
export const PRO_ONLY_WIDGETS: readonly string[] = [
  'nurture-timeline', 'qualifying-drill', 'pitfall-cycle', 'error-self-score', 'consultation-lab', 'fair-housing-drill',
  'lead-sources', 'pipeline-calculator', 'timeblock-planner', 'postclose-scheduler',
];
