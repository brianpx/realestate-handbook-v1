export type PageId =
  | 'cover' | 'pref'
  | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6' | 'ch7' | 'ch8' | 'ch9' | 'ch10' | 'ch11' | 'ch12' | 'ch13'
  | 'app-a' | 'app-b' | 'app-c' | 'app-d' | 'app-e' | 'app-f';

export type PageEntry = { id: PageId; label: string; title: string };
export type NavGroup = { part: string | null; pages: PageEntry[] };

const p = (id: PageId, label: string, title = label): PageEntry => ({ id, label, title });

export const NAV: NavGroup[] = [
  { part: null, pages: [p('cover', 'Title Page'), p('pref', 'Handbook Overview & Plan')] },
  { part: 'PART I: Foundations', pages: [p('ch1', '1. Mindset & Foundations')] },
  { part: 'PART II: Find', pages: [p('ch2', '2. Finding Clients'), p('ch3', '3. Marketing & Brand Presence')] },
  { part: 'PART III: Operating System', pages: [p('ch4', '4. Your CRM and daily operating system')] },
  { part: 'PART IV: Nurture', pages: [p('ch5', '5. Nurturing Leads'), p('ch6', '6. Scripts & Conversations')] },
  { part: 'PART V: Stay on Track', pages: [p('ch7', '7. Common Errors & Pitfalls'), p('ch8', '8. Staying Organized & Motivated')] },
  {
    part: 'PART VI: Serve and Keep',
    pages: [p('ch9', '9. Client Consultations & Objections'), p('ch10', '10. Keeping Clients'), p('ch11', '11. Legal Protection & Standards')],
  },
  { part: 'PART VII: Execute', pages: [p('ch12', '12. Execution Plans (90 Days)'), p('ch13', '13. Resources & Next Steps')] },
  {
    part: 'APPENDICES',
    pages: [
      p('app-a', 'App A: Weekly Activity Scorecard'),
      p('app-b', 'App B: Follow-Up Plan Starter Kit'),
      p('app-c', 'App C: CRM Setup Checklist'),
      p('app-d', 'App D: Glossary'),
      p('app-e', 'App E: Interactive Tools'),
      p('app-f', 'App F: Essential Links'),
    ],
  },
];

export const PAGES: PageEntry[] = NAV.flatMap(g => g.pages);
export const PAGE_IDS = PAGES.map(x => x.id);

export const BOOK_TITLE = 'Finding, Keeping, and Nurturing Clients';
export const BOOK_DESCRIPTION =
  'A practical training manual for new real estate agents: how to find clients, nurture leads and keep past clients, with scripts, calculators and a 90-day plan.';

export const isPageId = (value: string): value is PageId => (PAGE_IDS as string[]).includes(value);
export const pageById = (id: PageId): PageEntry => PAGES.find(x => x.id === id)!;
export const neighbors = (id: PageId): { prev: PageEntry | null; next: PageEntry | null } => {
  const i = PAGE_IDS.indexOf(id);
  return { prev: PAGES[i - 1] ?? null, next: PAGES[i + 1] ?? null };
};
