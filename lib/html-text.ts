// Plain text of a trusted HTML snippet from content/pages (tags dropped, entities decoded). Not a general parser:
// it handles the inline markup and entities the handbook pages actually use.
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', middot: '·', bull: '•' };

/** Decodes character references; unknown ones are left as written. Does not trim. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const n = code[1]!.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : whole;
    }
    return ENTITIES[code.toLowerCase()] ?? whole;
  });
}

export function htmlText(html: string): string {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).trim();
}

/** The cells of every body row in the first table of `html`, as plain text. */
export function tableRows(html: string): string[][] {
  const body = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i.exec(html)?.[1] ?? '';
  return [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(row =>
    [...row[1]!.matchAll(/<t([dh])\b[^>]*>([\s\S]*?)<\/t\1>/gi)].map(cell => htmlText(cell[2]!)),
  );
}
