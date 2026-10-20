import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { splitSegments } from './content';
import { validateMarkers, widgetInstanceId } from './widget-markers';

const known = ['goal-calculator', 'roadmap'];

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
