// The in-page outline. Built from the chapter HTML so it renders without JavaScript.
// Existing heading ids (the review deck's deep links) are kept; this module only reads them.

export const OUTLINE_MIN = 4;

export type OutlineItem = { id: string; text: string };

const H2 = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;

const decode = (value: string) =>
  value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&apos;/g, "'").replace(/&nbsp;/g, ' ');

/** Visible text of a heading, with tags removed and whitespace collapsed. */
export function headingText(inner: string): string {
  return decode(inner.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

/**
 * Slug for a heading that does not already have an id.
 * Lower case, "&" to "and", punctuation dropped, spaces to hyphens.
 */
export function headingSlug(text: string): string {
  return text.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function attrId(attrs: string): string | null {
  return /\bid="([^"]+)"/.exec(attrs)?.[1] ?? null;
}

/** Section headings (h2s that carry an id), in order. Empty when the page has fewer than OUTLINE_MIN of them. */
export function collectOutline(html: string): OutlineItem[] {
  const items: OutlineItem[] = [];
  for (const match of html.matchAll(H2)) {
    const id = attrId(match[1] ?? '');
    const text = headingText(match[2] ?? '');
    if (!id || !text) continue;
    items.push({ id, text });
  }
  return items.length >= OUTLINE_MIN ? items : [];
}

/**
 * Index where the opening ends and the first section begins, so the stacked outline
 * sits after the title and learning objectives and before the roadmap or the first section.
 * `.learning-objectives` is a flat section. When a section heading comes first (the preface),
 * the cut is the title. Returns 0 when there is nothing to split.
 */
export function introCut(html: string): number {
  const section = html.search(/<h2\b/i);
  const objectives = html.search(/class="learning-objectives"/);
  if (objectives !== -1 && (section === -1 || objectives < section)) {
    const close = html.indexOf('</section>', objectives);
    if (close !== -1) return close + '</section>'.length;
  }
  const title = html.search(/<\/h1>/i);
  if (title !== -1) return title + '</h1>'.length;
  return 0;
}
