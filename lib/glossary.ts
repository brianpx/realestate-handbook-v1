import { htmlText } from './html-text';

// Glossary terms get a dotted underline and a popover the first time they appear on a page. This works on the
// page HTML at build time instead of walking the DOM in the browser. Ported from setupGlossary in
// legacy/js/widgets-plan.js: same term list, same skip rules, same one-use-per-term-per-page behavior.
type Term = { term: string; exact?: boolean; plural?: boolean; alt?: string };

export const GLOSSARY_TERMS: Term[] = [
  { term: '8x8', exact: true }, { term: 'Agency disclosure' }, { term: 'Client App' }, { term: 'Cost per closed deal' },
  { term: 'CRM', exact: true }, { term: 'Expired listing', plural: true }, { term: 'Fair Housing' }, { term: 'Farming' },
  { term: 'Follow-up plan', plural: true }, { term: 'FSBO', exact: true }, { term: 'IDX', exact: true },
  { term: 'Lagging indicator', plural: true }, { term: 'Lead routing' }, { term: 'Leading indicator', plural: true },
  { term: 'Opportunities', alt: 'Opportunit(?:y|ies)' }, { term: 'Pipeline value' }, { term: 'Speed-to-lead' },
  { term: 'Sphere of influence' }, { term: 'Value piece', plural: true },
];

/** Pages that never get glossary terms: the title page and the glossary itself. */
export const NO_GLOSSARY_PAGES: readonly string[] = ['cover', 'app-d'];

const SKIP_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'button', 'textarea', 'input', 'select', 'label', 'a', 'th']);
const SKIP_CLASSES = new Set(['box-title', 'iw', 'term', 'interactive-head', 'glossary', 'part-label', 'diagram-title', 'checklist', 'read-sentinel', 'scorecard']);
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERNS = GLOSSARY_TERMS.map(t => ({
  ...t,
  regex: new RegExp(`(^|[^\\w-])(${t.alt ?? escapeRegex(t.term)}${t.plural ? 's?' : ''})(?![\\w-])`, t.exact ? 'g' : 'gi'),
}));

/** Term -> definition, from the `<dt>`/`<dd>` pairs of Appendix D. Keys are lower-case. */
export function parseGlossary(appDHtml: string): Map<string, string> {
  const defs = new Map<string, string>();
  for (const m of appDHtml.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)) defs.set(htmlText(m[1]!).toLowerCase(), htmlText(m[2]!));
  return defs;
}

const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrapText(text: string, defs: ReadonlyMap<string, string>, used: Set<string>): string {
  let out = '';
  let rest = text;
  for (;;) {
    let best: { index: number; length: number; term: string } | null = null;
    for (const p of PATTERNS) {
      if (used.has(p.term)) continue;
      p.regex.lastIndex = 0;
      const m = p.regex.exec(rest);
      if (m) {
        const index = m.index + m[1]!.length;
        if (!best || index < best.index) best = { index, length: m[2]!.length, term: p.term };
      }
    }
    if (!best) return out + rest;
    const definition = defs.get(best.term.toLowerCase());
    if (!definition) { used.add(best.term); continue; } // no definition in Appendix D: leave it alone
    used.add(best.term);
    out += `${rest.slice(0, best.index)}<button type="button" class="term" aria-expanded="false" data-term="${attr(best.term)}" data-definition="${attr(definition)}">${rest.slice(best.index, best.index + best.length)}</button>`;
    rest = rest.slice(best.index + best.length);
  }
}

/**
 * Wraps the first use of each unused term in `html`. `used` is shared across a page's pieces so a term is
 * marked once per page, in reading order. Text inside headings, links, buttons, form fields, tool markup and
 * the skip classes above is left alone.
 */
export function wrapGlossary(html: string, defs: ReadonlyMap<string, string>, used: Set<string>): string {
  const stack: { tag: string; skip: boolean }[] = [];
  let skipping = 0;
  return html
    .split(/(<!--[\s\S]*?-->|<[^>]+>)/)
    .map(piece => {
      if (!piece) return piece;
      if (piece.startsWith('<!--')) return piece;
      if (!piece.startsWith('<')) return skipping > 0 || !piece.trim() ? piece : wrapText(piece, defs, used);
      const close = /^<\/\s*([a-z][a-z0-9]*)/i.exec(piece);
      if (close) {
        const tag = close[1]!.toLowerCase();
        // pop to the matching open tag, tolerating unclosed tags such as <li> or <p> before it
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i]!.tag === tag) {
            for (const f of stack.splice(i)) if (f.skip) skipping--;
            break;
          }
        }
        return piece;
      }
      const open = /^<([a-z][a-z0-9]*)/i.exec(piece);
      if (!open) return piece;
      const tag = open[1]!.toLowerCase();
      if (VOID_TAGS.has(tag) || piece.endsWith('/>')) return piece;
      const classes = (/\sclass\s*=\s*"([^"]*)"/i.exec(piece)?.[1] ?? '').split(/\s+/);
      const skip = SKIP_TAGS.has(tag) || classes.some(c => SKIP_CLASSES.has(c)) || /\sdata-widget\s*=/i.test(piece);
      stack.push({ tag, skip });
      if (skip) skipping++;
      return piece;
    })
    .join('');
}
