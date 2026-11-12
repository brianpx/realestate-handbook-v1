// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PAGE_IDS } from '@/lib/pages';
import { ChapterBands } from './ChapterBands';
import { BANDS } from './chapter-bands';

const hoisted = vi.hoisted(() => ({
  read: {} as Record<string, boolean>,
  settings: {} as { trackProgress?: boolean },
}));

vi.mock('@/lib/state', () => ({
  useHandbookState: () => ({ read: hoisted.read }),
  useSettings: () => hoisted.settings,
  trackingProgress: (s: { trackProgress?: boolean }) => s.trackProgress !== false,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;

const LOCKED = PAGE_IDS.filter(id => !['cover', 'pref', 'ch1', 'ch7'].includes(id));
const render = (props: { locked: readonly string[]; free: boolean }) => act(() => root.render(<ChapterBands {...props} />));
const link = (id: string) => container.querySelector<HTMLAnchorElement>(`a[href="/handbook/${id}"]`)!;

beforeEach(() => {
  hoisted.read = {};
  hoisted.settings = {};
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it('derives the bands from NAV with the spec labels and row titles', () => {
  expect(BANDS.map(b => [b.eyebrow, b.name])).toEqual([
    ['Start here', 'Front matter'],
    ['PART I', 'Foundations'],
    ['PART II', 'Find'],
    ['PART III', 'Operating System'],
    ['PART IV', 'Nurture'],
    ['PART V', 'Stay on Track'],
    ['PART VI', 'Serve and Keep'],
    ['PART VII', 'Execute'],
    ['Reference', 'Appendices'],
  ]);
  const rows = BANDS.flatMap(b => b.rows);
  expect(rows.map(r => r.id)).toEqual(PAGE_IDS);
  expect(rows.find(r => r.id === 'cover')).toEqual({ id: 'cover', num: '', title: 'Title page' });
  expect(rows.find(r => r.id === 'pref')).toMatchObject({ num: '', title: 'Handbook Overview & Plan' });
  expect(rows.find(r => r.id === 'ch10')).toEqual({ id: 'ch10', num: '10', title: 'Keeping Clients' });
  expect(rows.find(r => r.id === 'app-d')).toEqual({ id: 'app-d', num: 'D', title: 'Glossary' });
});

it('links every page and marks open rows with a pill and locked rows as muted members-only text', async () => {
  await render({ locked: LOCKED, free: true });
  expect(container.querySelectorAll('a.hb-home-row-link')).toHaveLength(PAGE_IDS.length);
  for (const id of PAGE_IDS) expect(link(id)).not.toBeNull();
  expect(container.querySelector('.hb-home-legend')?.textContent).toBe('Free chapters are open to everyone. The rest come with the paid handbook.');
  expect(container.querySelectorAll('.hb-home-pill')).toHaveLength(5);
  expect(link('ch1').querySelector('.hb-home-pill')).not.toBeNull();
  expect(link('ch1').classList.contains('hb-home-locked')).toBe(false);
  expect(link('ch2').classList.contains('hb-home-locked')).toBe(true);
  expect(link('ch2').querySelector('.hb-home-pill')).toBeNull();
  expect(link('ch2').querySelector('.visually-hidden')?.textContent).toBe(' (members only)');
  expect(container.querySelector('svg')).toBeNull();
});

it('shows no pills, legend or muted rows to a member', async () => {
  await render({ locked: LOCKED, free: false });
  expect(container.querySelector('.hb-home-pill')).toBeNull();
  expect(container.querySelector('.hb-home-legend')).toBeNull();
  expect(container.querySelector('.hb-home-locked')).toBeNull();
  expect(container.textContent).not.toContain('members only');
});

it('replaces the pill with a check on a read open page while tracking is on', async () => {
  hoisted.read = { ch1: true, ch2: true };
  await render({ locked: LOCKED, free: true });
  expect(link('ch1').querySelector('.hb-home-read')).not.toBeNull();
  expect(link('ch1').querySelector('.hb-home-pill')).toBeNull();
  expect(link('ch2').querySelector('.hb-home-read')).toBeNull();
});

it('ignores read state when tracking is off', async () => {
  hoisted.read = { ch1: true };
  hoisted.settings = { trackProgress: false };
  await render({ locked: LOCKED, free: true });
  expect(container.querySelector('.hb-home-read')).toBeNull();
  expect(link('ch1').querySelector('.hb-home-pill')).not.toBeNull();
});
