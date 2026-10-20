// The goal ladder (Table 1.1), moved verbatim from Chapter 1. Row order matters: the calculator writes into rows 2, 6 and 7.
export const GOAL_HEADINGS = ['STEP', 'EXAMPLE', 'YOUR NUMBER'];
export const GOAL_CAPTION = "Table 1.1. The goal ladder. The example numbers are fixed. Fill in your own in the last column.";
export const GOAL_ROWS: { step: string; example: string }[] = [
  { step: "Income goal for the year", example: "$80,000" },
  { step: "Average commission per closed side after splits", example: "$6,500" },
  { step: "Closings needed (goal ÷ average)", example: "13" },
  { step: "Appointments needed per closing (new agents: about 3)", example: "39 appointments" },
  { step: "Conversations needed per appointment (new agents: about 20, blended across sources)", example: "≈ 780 conversations" },
  { step: "Working weeks", example: "48" },
  { step: "Conversations per week", example: "≈ 16" },
  { step: "Conversations per working day", example: "3 to 4" },
];
