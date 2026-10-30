// The reading plan's week-to-chapter mapping, shared by the preface list and the planner so they cannot drift.
// Mirrors the four-week list in content/pages/pref.html.
export const UNITS: { unit: number; chapters: string[] }[] = [
  { unit: 1, chapters: ['ch1', 'ch4', 'ch12'] },
  { unit: 2, chapters: ['ch2', 'ch5', 'ch6'] },
  { unit: 3, chapters: ['ch7', 'ch8', 'ch9'] },
  { unit: 4, chapters: ['ch3', 'ch10', 'ch11', 'ch13'] },
];
