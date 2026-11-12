// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { ToolCards } from './ToolCards';

const LOCKED = ['ch2', 'ch6', 'ch8', 'ch12', 'app-a', 'app-e'];

async function render(props: { locked: readonly string[]; free: boolean }) {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(<ToolCards {...props} />));
  return { host, done: async () => { await act(async () => root.unmount()); host.remove(); } };
}

it('marks the open tool Free and mutes the locked ones for a free reader', async () => {
  const { host, done } = await render({ locked: LOCKED, free: true });
  const cards = Array.from(host.querySelectorAll<HTMLAnchorElement>('a.hb-home-tool'));
  expect(cards).toHaveLength(6);
  const open = cards[0];
  expect(open?.getAttribute('data-goto')).toBe('ch1');
  expect(open?.getAttribute('data-widget')).toBe('goal-calculator');
  expect(open?.querySelector('.hb-home-pill')?.textContent).toBe('Free');
  expect(open?.classList.contains('hb-home-locked')).toBe(false);
  for (const card of cards.slice(1)) {
    expect(card.classList.contains('hb-home-locked')).toBe(true);
    expect(card.hasAttribute('data-widget')).toBe(false);
    expect(card.hasAttribute('data-goto')).toBe(true);
    expect(card.querySelector('.hb-home-pill')).toBeNull();
    expect(card.textContent).toContain('(members only)');
  }
  expect(cards[5]?.querySelector('.hb-home-tool-where')?.textContent).toBe('Appendix A');
  expect(host.querySelector('a.hb-home-head-link')?.getAttribute('href')).toBe('/handbook/app-e');
  await done();
});

it('shows a member plain cards with every widget target', async () => {
  const { host, done } = await render({ locked: [], free: false });
  const cards = Array.from(host.querySelectorAll('a.hb-home-tool'));
  expect(cards).toHaveLength(6);
  expect(host.querySelector('.hb-home-pill')).toBeNull();
  expect(host.querySelector('.hb-home-locked')).toBeNull();
  expect(cards.every(c => c.hasAttribute('data-widget'))).toBe(true);
  await done();
});
