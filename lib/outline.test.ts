import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGE_IDS } from './pages';
import { collectOutline, headingSlug, introCut, OUTLINE_MIN } from './outline';

const page = (id: string) => readFileSync(join(process.cwd(), 'content/pages', `${id}.html`), 'utf8');
// Objectives and takeaways are h2s with no ids, so they stay out of the outline.
const sectionHeadings = (html: string) => {
  const body = html
    .replace(/<section class="learning-objectives">[\s\S]*?<\/section>/, '')
    .replace(/<section class="key-takeaways">[\s\S]*?<\/section>/, '');
  return [...body.matchAll(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/g)];
};

describe('collectOutline', () => {
  it('lists Chapter 2 in order and keeps the existing ids', () => {
    const items = collectOutline(page('ch2'));
    expect(items.map(i => i.id)).toEqual([
      'sphere-of-influence', 'online-leads', 'open-houses', 'geographic-farming',
      'expired-and-fsbo', 'referral-partners', 'track-every-source',
    ]);
    expect(items[0]?.text).toBe('Sphere of influence and referrals');
  });

  it('returns nothing for a short page and for Appendix C', () => {
    expect(collectOutline(page('ch6'))).toEqual([]);
    expect(collectOutline(page('app-c'))).toEqual([]);
    expect(collectOutline(page('cover'))).toEqual([]);
  });

  it('gives every outlined page a unique id on each section heading', () => {
    for (const id of PAGE_IDS) {
      const html = page(id);
      const headings = sectionHeadings(html);
      if (headings.length < OUTLINE_MIN) continue;
      const ids = headings.map(m => /\bid="([^"]+)"/.exec(m[1] ?? '')?.[1]);
      expect(ids.every(Boolean), id).toBe(true);
      expect(new Set(ids).size, id).toBe(ids.length);
      expect(collectOutline(html), id).toHaveLength(headings.length);
    }
  });
});

describe('introCut', () => {
  it('puts Chapter 12\'s outline after the objectives and before the roadmap figure', () => {
    const html = page('ch12');
    const cut = introCut(html);
    const intro = html.slice(0, cut);
    const rest = html.slice(cut);
    expect(intro).toContain('learning-objectives');
    expect(intro).not.toContain('fig-roadmap-90');
    expect(rest.startsWith('\n') || rest.includes('fig-roadmap-90')).toBe(true);
    expect(rest.indexOf('fig-roadmap-90')).toBeLessThan(rest.indexOf('id="days-1-to-30"'));
  });

  it('puts the preface outline after the title, because the objectives sit inside the first section', () => {
    const html = page('pref');
    const intro = html.slice(0, introCut(html));
    expect(intro).toContain('</h1>');
    expect(intro).not.toContain('<h2');
  });
});

describe('headingSlug', () => {
  it('lowercases, spells out ampersands and drops punctuation', () => {
    expect(headingSlug('Buyer agreements & compensation')).toBe('buyer-agreements-and-compensation');
    expect(headingSlug('B.2 New sphere contact: 8x8 (8 weeks)')).toBe('b-2-new-sphere-contact-8x8-8-weeks');
  });
});
