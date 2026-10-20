// Widget mount points inside a page are HTML comments. The marker is the whole contract between page HTML and
// components, so a bad one must fail the build rather than silently render nothing.
//
//   <!--widget:goal-calculator-->                       stands alone; the component draws everything
//   <!--widget:script-practice#new-lead-->  ...html...  <!--/widget:script-practice#new-lead-->
//                                                       wraps existing page HTML the component enhances
//
// `#slug` tells apart several uses of one widget on a page. A page's markers must be unique by name and slug.
const NAME = '[a-z][a-z0-9-]*';
const SLUG = '[a-z0-9][a-z0-9-]*';
export const OPEN_MARKER = new RegExp(`<!--widget:(${NAME})(?:#(${SLUG}))?-->`, 'g');
export const CLOSE_MARKER = new RegExp(`<!--/widget:(${NAME})(?:#(${SLUG}))?-->`, 'g');
export const ANY_MARKER = /<!--\s*\/?\s*widget\b[^>]*-->/gi;

/** Every widget name a page may reference, including ones not ported yet. Add the name here when adding a marker. */
export const WIDGET_NAMES: readonly string[] = [
  'crm-checklists', 'scorecard', 'scorecard-change', 'goal-calculator', 'speed-to-lead', 'response-timer', 'nurture-timeline',
  'script-practice', 'objection-trainer', 'qualifying-drill', 'pitfall-cycle', 'error-self-score', 'consultation-lab', 'fair-housing-drill',
  'checkpoints', 'knowledge-check', 'lead-sources', 'pipeline-calculator',
  'timeblock-planner', 'postclose-scheduler',
];

const keyOf = (name: string, slug?: string) => (slug ? `${name}#${slug}` : name);

export function widgetInstanceId(pageId: string, name: string, slug?: string): string {
  return `${pageId}:${keyOf(name, slug)}`;
}

type Token = { kind: 'open' | 'close'; name: string; slug: string | undefined; index: number; text: string };

export function tokenizeMarkers(html: string): Token[] {
  const tokens: Token[] = [];
  for (const m of html.matchAll(OPEN_MARKER)) tokens.push({ kind: 'open', name: m[1]!, slug: m[2], index: m.index, text: m[0] });
  for (const m of html.matchAll(CLOSE_MARKER)) tokens.push({ kind: 'close', name: m[1]!, slug: m[2], index: m.index, text: m[0] });
  return tokens.sort((a, b) => a.index - b.index);
}

/** Returns a message per problem; empty when the page's markers are valid. */
export function validateMarkers(pageId: string, html: string, known: readonly string[] = WIDGET_NAMES): string[] {
  const problems: string[] = [];
  const tokens = tokenizeMarkers(html);
  const wellFormed = new Set(tokens.map(t => t.text));
  const seen = new Set<string>();
  let openWrapper: string | null = null;

  tokens.forEach((t, i) => {
    const key = keyOf(t.name, t.slug);
    if (t.kind === 'open') {
      if (!known.includes(t.name)) problems.push(`${pageId}: unknown widget "${t.name}"`);
      // The instance id is page + name (+ slug), so a repeat would share persisted state and anchors.
      if (seen.has(key)) problems.push(`${pageId}: duplicate widget "${key}"`);
      seen.add(key);
      // an open marker is a wrapper when its own close follows before anything else opens
      const next = tokens[i + 1];
      const closesNext = next?.kind === 'close' && keyOf(next.name, next.slug) === key;
      const closesLater = tokens.slice(i + 1).some(x => x.kind === 'close' && keyOf(x.name, x.slug) === key);
      if (closesLater && !closesNext) {
        // something sits between the open and its close: only plain HTML may, never another marker
        problems.push(`${pageId}: widget "${key}" has another marker inside it`);
      } else if (closesNext) {
        openWrapper = key;
      }
    } else if (openWrapper !== key) {
      problems.push(`${pageId}: closing marker for "${key}" has no matching open marker`);
    } else {
      openWrapper = null;
    }
  });

  for (const m of html.matchAll(ANY_MARKER)) {
    if (!wellFormed.has(m[0])) problems.push(`${pageId}: malformed widget marker ${m[0]}`);
  }
  return problems;
}
