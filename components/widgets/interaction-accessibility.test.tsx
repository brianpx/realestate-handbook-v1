// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ChoiceDrill } from './ChoiceDrill';
import { ScriptBox } from './ScriptBox';
import { ResponseTimer } from './ResponseTimer';

vi.mock('@/lib/state', () => ({
  useHandbookState: () => ({ scripts: {} }),
  widgetOf: () => ({}),
  updateWidget: vi.fn(),
  setScript: vi.fn(),
  useSettings: () => ({}),
  essentialOnly: () => false,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
const button = (name: string) => {
  const found = [...container.querySelectorAll('button')].find(el => el.textContent === name);
  if (!found) throw new Error(`Missing button: ${name}`);
  return found;
};
const activate = async (name: string) => {
  const control = button(name);
  control.focus();
  await act(() => control.click());
};
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

it('keeps focus in the drill through next question, result, and restart without taking focus on mount', async () => {
  const previous = document.createElement('button');
  document.body.appendChild(previous);
  previous.focus();
  const items = ['First question', 'Second question'].map(prompt => ({ prompt, options: ['Yes', 'No'], answer: 0, explain: 'Explanation.' }));
  await act(() => root.render(<ChoiceDrill stateKey="test" noun="Phrase" items={items} />));
  expect(document.activeElement).toBe(previous);
  previous.remove();
  await activate('Yes');
  expect(document.activeElement).toBe(button('Next phrase →'));
  expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain('Explanation.');
  await activate('Next phrase →');
  expect(document.activeElement).toBe(container.querySelector('.drill-prompt'));
  expect(document.activeElement?.textContent).toBe('Second question');
  await activate('Yes');
  await activate('See your result');
  expect(document.activeElement).toBe(container.querySelector('.drill-score'));
  expect(document.activeElement?.textContent).toBe('2 of 2 correct');
  await activate('Try again');
  expect(document.activeElement).toBe(container.querySelector('.drill-prompt'));
  expect(document.activeElement?.textContent).toBe('First question');
});

it('moves focus to the revealed script and announces the comparison state', async () => {
  vi.useFakeTimers();
  await act(() => root.render(<><div id="pageStatus" role="status" /><ScriptBox titleHtml="Practice" bodyHtml="The example script." storageKey="test" /></>));
  await activate('Practice');
  await act(async () => { await Promise.resolve(); });
  expect(document.activeElement).toBe(container.querySelector('textarea'));
  await activate('Reveal script to compare');
  expect(document.activeElement).toBe(container.querySelector('.script-body'));
  expect(button('Reveal script to compare').hidden).toBe(true);
  await act(() => vi.advanceTimersByTime(50));
  expect(container.querySelector('#pageStatus')?.textContent).toBe('Script revealed. Compare it with your own words below.');
});

it('announces only the latest stamped verdict and keeps clock ticks out of the status', async () => {
  vi.useFakeTimers();
  await act(() => root.render(<ResponseTimer />));
  const status = () => container.querySelector('[role="status"]')!;
  expect(status().textContent).toBe('');
  await activate('Start');
  await act(() => vi.advanceTimersByTime(1000));
  expect(status().textContent).toBe('');
  await activate('Text arrived');
  expect(status().textContent).toMatch(/^Text: .*Meets the standard/);
  expect(status().getAttribute('aria-atomic')).toBe('true');
  const first = status().textContent;
  await act(() => vi.advanceTimersByTime(1000));
  expect(status().textContent).toBe(first);
  await activate('Email arrived');
  expect(status().textContent).toMatch(/^Email:/);
  expect(status().textContent).not.toContain('Text:');
  expect(container.querySelectorAll('.timer-results li')).toHaveLength(2);
  await activate('Reset');
  expect(status().textContent).toBe('');
});
