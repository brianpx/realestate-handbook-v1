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

export const BOOK_TITLE = 'Finding, Nurturing, and Keeping Clients';
export const BOOK_DESCRIPTION =
  'A practical training manual for new real estate agents: how to find clients, nurture leads and keep past clients, with scripts, calculators and a 90-day plan.';

export const isPageId = (value: string): value is PageId => (PAGE_IDS as string[]).includes(value);
export const pageById = (id: PageId): PageEntry => PAGES.find(x => x.id === id)!;
export const neighbors = (id: PageId): { prev: PageEntry | null; next: PageEntry | null } => {
  const i = PAGE_IDS.indexOf(id);
  return { prev: PAGES[i - 1] ?? null, next: PAGES[i + 1] ?? null };
};

// The pages a signed-in reader opens without a grant (decision OD-01): the title page, the overview and the two
// chapters the public sample shows in full. Everything else shows the upsell card until a grant exists
// (lib/access/entitlement.ts). Changing the set is this line plus the /signup copy.
export const FREE_PAGE_IDS: readonly PageId[] = ['cover', 'pref', 'ch1', 'ch7'];
export const isFreePage = (id: PageId): boolean => FREE_PAGE_IDS.includes(id);

export type LabelParts = { before: string; mark: string; after: string; title: string };
/**
 * A page label split around its number or letter, so a menu can set the mark in its own column:
 * "5. Nurturing Leads" is 5 and "Nurturing Leads", "App D: Glossary" is D and "Glossary". The four pieces joined
 * give the label back. Null for a page with no mark (the title page, the overview).
 */
export function labelParts(label: string): LabelParts | null {
  const m = /^(App )?(\d+|[A-Z])(\. |: )(.+)$/.exec(label);
  return m ? { before: m[1] ?? '', mark: m[2]!, after: m[3]!, title: m[4]! } : null;
}

/** A part heading as an eyebrow and a name: "PART IV: Nurture" is "Part IV" and "Nurture"; "APPENDICES" is "Reference" and "Appendices". */
export function partParts(part: string): { eyebrow: string; name: string } {
  const colon = part.indexOf(':');
  if (colon < 0) return { eyebrow: 'Reference', name: part.charAt(0) + part.slice(1).toLowerCase() };
  return { eyebrow: `Part ${part.slice(0, colon).replace(/^PART\s+/i, '')}`, name: part.slice(colon + 1).trim() };
}
