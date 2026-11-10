// The reading plan's week-to-chapter mapping, shared by the preface list and the planner so they cannot drift.
// Mirrors the four-week list in content/pages/pref.html. Book order (decision OD-03): no chapter is read before one it builds on.
export const UNITS: { unit: number; chapters: string[] }[] = [
  { unit: 1, chapters: ['ch1', 'ch2', 'ch3'] },
  { unit: 2, chapters: ['ch4', 'ch5', 'ch6'] },
  { unit: 3, chapters: ['ch7', 'ch8', 'ch9'] },
  { unit: 4, chapters: ['ch10', 'ch11', 'ch12', 'ch13'] },
];
