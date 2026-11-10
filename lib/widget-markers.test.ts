import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { splitSegments } from './content';
import { isWidgetName, validateMarkers, WIDGET_NAMES, widgetInstanceId } from './widget-markers';

const known = ['goal-calculator', 'roadmap'];

describe('WIDGET_NAMES', () => {
  it('is the list isWidgetName narrows to, and nothing else', () => {
    for (const name of WIDGET_NAMES) expect(isWidgetName(name)).toBe(true);
    expect(isWidgetName('roadmap')).toBe(false);
    expect(isWidgetName('')).toBe(false);
    expect(new Set(WIDGET_NAMES).size).toBe(WIDGET_NAMES.length);
  });
});

describe('validateMarkers', () => {
  it('accepts well-formed, known, unique markers', () => {
    expect(validateMarkers('ch1', '<p>a</p><!--widget:goal-calculator--><!--widget:roadmap-->', known)).toEqual([]);
  });

  it('rejects unknown widget names', () => {
    expect(validateMarkers('ch1', '<!--widget:nope-->', known)).toEqual(['ch1: unknown widget "nope"']);
  });

  it('rejects duplicates on one page', () => {
    const out = validateMarkers('ch1', '<!--widget:roadmap--><!--widget:roadmap-->', known);
    expect(out).toEqual(['ch1: duplicate widget "roadmap"']);
  });

  it('rejects malformed markers', () => {
    for (const bad of ['<!-- widget:roadmap -->', '<!--widget:Roadmap-->', '<!--widget:-->', '<!--widget roadmap-->']) {
      expect(validateMarkers('ch1', bad, known).some(p => p.includes('malformed'))).toBe(true);
    }
  });

  it('ignores ordinary comments', () => {
    expect(validateMarkers('ch1', '<!-- a note -->', known)).toEqual([]);
  });
});

describe('wrapping markers and slugs', () => {
  const wrap = (slug: string, inner = '<b>x</b>') => `<!--widget:roadmap#${slug}-->${inner}<!--/widget:roadmap#${slug}-->`;

  it('accepts several wrapped uses of one widget when slugs differ', () => {
    expect(validateMarkers('ch6', wrap('a') + wrap('b'), known)).toEqual([]);
  });
  it('rejects the same slug twice, and a bare name beside a slugged one is distinct', () => {
    expect(validateMarkers('ch6', wrap('a') + wrap('a'), known)).toEqual(['ch6: duplicate widget "roadmap#a"']);
    expect(validateMarkers('ch6', wrap('a') + '<!--widget:roadmap-->', known)).toEqual([]);
  });
  it('rejects a wrapper that is never closed, and a close with no open', () => {
    expect(validateMarkers('ch6', '<!--widget:roadmap#a--><p>x</p>', known)).toEqual([]); // stands alone
    expect(validateMarkers('ch6', '<!--/widget:roadmap#a-->', known)).toEqual(['ch6: closing marker for "roadmap#a" has no matching open marker']);
  });
  it('rejects another marker inside a wrapper', () => {
    const out = validateMarkers('ch6', '<!--widget:roadmap#a--><!--widget:goal-calculator--><!--/widget:roadmap#a-->', known);
    expect(out).toContain('ch6: widget "roadmap#a" has another marker inside it');
  });
  it('rejects a malformed slug', () => {
    expect(validateMarkers('ch6', '<!--widget:roadmap#-->', known).some(p => p.includes('malformed'))).toBe(true);
  });
});

describe('splitSegments', () => {
  it('hands a wrapping marker its enclosed html', () => {
    const html = '<p>a</p><!--widget:script-practice#x--><b>in</b><!--/widget:script-practice#x--><p>b</p><!--widget:scorecard-->';
    expect(splitSegments('ch6', html)).toEqual([
      { kind: 'html', html: '<p>a</p>' },
      { kind: 'widget', name: 'script-practice', slug: 'x', html: '<b>in</b>' },
      { kind: 'html', html: '<p>b</p>' },
      { kind: 'widget', name: 'scorecard', slug: undefined },
    ]);
  });

  it('throws on an unknown widget so the build fails', () => {
    expect(() => splitSegments('ch1', '<!--widget:nope-->')).toThrow(/unknown widget "nope"/);
  });

  it('passes pages without markers through as one html segment', () => {
    expect(splitSegments('ch1', '<p>hi</p>')).toEqual([{ kind: 'html', html: '<p>hi</p>' }]);
  });
});

it('builds a stable instance id', () => {
  expect(widgetInstanceId('ch5', 'nurture-timeline')).toBe('ch5:nurture-timeline');
  expect(widgetInstanceId('ch6', 'script-practice', 'voicemail')).toBe('ch6:script-practice#voicemail');
});

it('every shipped page has valid markers', () => {
  const dir = 'content/pages';
  const problems = readdirSync(dir)
    .filter(f => f.endsWith('.html'))
    .flatMap(f => validateMarkers(f.replace(/\.html$/, ''), readFileSync(`${dir}/${f}`, 'utf8')));
  expect(problems).toEqual([]);
});

// CR-L19: the "●" before a box title is drawn by `.box-title::before`, not written in the heading. These are the box
// titles that showed it when it was still text (12df277), page by page; each must still be a .box-title, and so
// still show it.
const MARKED_BOX_TITLES: Record<string, string[]> = {
  ch1: ['h3 FIELD NOTE', 'h3 TRY IT TODAY', 'div CHECKPOINT'],
  ch2: ['h3 PITFALL', 'h3 BEFORE YOU CALL', 'h3 TRY IT TODAY', 'div CHECKPOINT'],
  ch3: ['h3 FIELD NOTE', 'h3 PITFALL', 'h3 TRY IT TODAY', 'div CHECKPOINT'],
  ch4: ['h3 FIELD NOTE', 'h3 TRY IT TODAY', 'div CHECKPOINT'],
  ch5: ['h3 PITFALL', 'h3 FIELD NOTE', 'h3 TRY IT TODAY', 'div CHECKPOINT'],
  ch6: [
    'div SCRIPT · NEW LEAD BY PHONE (SPEED-TO-LEAD)', 'div SCRIPT · VOICEMAIL (NO ANSWER)', 'div SCRIPT · NEW LEAD BY TEXT',
    'div SCRIPT · SPHERE ANNOUNCEMENT', 'div SCRIPT · SPHERE REFERRAL ASK', 'div SCRIPT · REFERRAL PARTNER INTRODUCTION (LENDER OR ATTORNEY)',
    'div SCRIPT · OPEN HOUSE GREETING', 'div SCRIPT · EXPIRED LISTING OR FSBO (ADVANCED)', 'div SCRIPT · BUYER CONSULTATION OPENING',
    'div SCRIPT · SELLER CONSULTATION OPENING', 'div SCRIPT · OBJECTION: "I\'M JUST LOOKING."', 'div SCRIPT · POST-CLOSE REFERRAL REQUEST',
    'div SCRIPT · ONE-WEEK CALL (AFTER CLOSING)', 'div SCRIPT · 30-DAY REVIEW REQUEST', 'div SCRIPT · HOME ANNIVERSARY CARD',
    'div SCRIPT · QUARTERLY CALL (WHOLE DATABASE)', 'h3 TRY IT TODAY', 'div CHECKPOINT',
  ],
  ch7: ['h3 TRY IT TODAY', 'div CHECKPOINT'],
  ch8: ['h3 FIELD NOTE', 'h3 PITFALL', 'h3 TRY IT TODAY', 'div CHECKPOINT'],
  ch9: ['div SCRIPT · "WE WANT TO INTERVIEW OTHER AGENTS."', 'h3 TRY IT TODAY', 'div CHECKPOINT'],
  ch10: ['h3 FIELD NOTE', 'h3 TRY IT TODAY', 'div CHECKPOINT'],
  ch11: ['h3 READ THIS FIRST', 'div SCRIPT · WIRE FRAUD WARNING', 'h3 TRY IT TODAY', 'div CHECKPOINT'],
  ch12: ['h3 TRY IT TODAY', 'div CHECKPOINT'],
  ch13: ['div CHECKPOINT'],
  pref: ['h3 FIELD NOTE', 'h3 PITFALL', 'div SCRIPT', 'h3 TRY IT TODAY', 'h3 CHECKPOINT', 'h3 LEGAL'],
};

// Box titles the tools render themselves, per file, that showed the marker. ScriptBox and CheckpointBox take theirs
// from the page. BoxTitle.tsx is the component itself; registry.tsx's locked-tool note never had one (CSS skips it).
const MARKED_TOOL_TITLES: Record<string, number> = {
  'coach/PlanSetup.tsx': 1, 'coach/ReviewDeck.tsx': 2, 'coach/TodayCard.tsx': 2,
  'widgets/CheckpointBox.tsx': 1, 'widgets/CoachCheck.tsx': 1, 'widgets/ConsultationLab.tsx': 1, 'widgets/ErrorScoreCard.tsx': 1,
  'widgets/FairHousingDrill.tsx': 1, 'widgets/GoalCalculator.tsx': 1, 'widgets/KnowledgeCheck.tsx': 1, 'widgets/LeadSources.tsx': 1,
  'widgets/ObjectionCard.tsx': 1, 'widgets/PipelineCalculator.tsx': 1, 'widgets/PostCloseCard.tsx': 1, 'widgets/QualifyCard.tsx': 1,
  'widgets/ResponseTimer.tsx': 1, 'widgets/ScriptBox.tsx': 1, 'widgets/TimeBlockPlanner.tsx': 1,
  'widgets/BoxTitle.tsx': 1, 'widgets/registry.tsx': 1,
};

describe('box title markers', () => {
  it('every page shows the marker on the same box titles as before, and none writes it', () => {
    const dir = 'content/pages';
    const found: Record<string, string[]> = {};
    for (const f of readdirSync(dir).filter(f => f.endsWith('.html'))) {
      const html = readFileSync(`${dir}/${f}`, 'utf8');
      expect(html, f).not.toContain('●');
      const titles = [...html.matchAll(/<(h3|div) class="box-title">([^<]*)<\/\1>/g)].map(m => `${m[1]} ${m[2]}`);
      expect(html.match(/class="box-title"/g)?.length ?? 0, `${f}: a box title this check cannot read`).toBe(titles.length);
      if (titles.length) found[f.replace(/\.html$/, '')] = titles;
    }
    expect(found).toEqual(MARKED_BOX_TITLES);
  });

  it('the tools keep their box titles, without the marker in the text', () => {
    const found: Record<string, number> = {};
    for (const f of readdirSync('components', { recursive: true, encoding: 'utf8' }).filter(f => f.endsWith('.tsx'))) {
      const src = readFileSync(`components/${f}`, 'utf8');
      expect(src, f).not.toMatch(/(className="box-title"|<BoxTitle)[^>]*>\s*●/);
      const n = src.match(/className="box-title"|<BoxTitle\b/g)?.length ?? 0;
      if (n) found[f] = n;
    }
    expect(found).toEqual(MARKED_TOOL_TITLES);
  });

  it('the stylesheet draws it, out of the accessible name, except on the locked-tool note', () => {
    const css = readFileSync('app/globals.css', 'utf8');
    expect(css).toMatch(/\.box-title::before \{[^}]*content: "● " \/ "";/);
    expect(css).toContain('.tool-locked .box-title::before { content: none}');
  });
});
