// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { HeroPlan } from './HeroPlan';

vi.mock('./useSignedIn', () => ({ useSignedIn: () => true }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it('shows the daily range and the five-day working week for the Chapter 1 example', async () => {
  await act(() => root.render(<HeroPlan />));
  expect([...container.querySelectorAll('.pub-stat b')].map(stat => stat.textContent)).toEqual(['13', '16', '3–4']);
  expect(container.querySelector('.pub-device-note')?.textContent).toContain('48 working weeks of 5 days each');
  expect(container.querySelector('.pub-device-sub')?.textContent).toContain('example numbers');
  expect(container.querySelector('.pub-device-income-note')?.textContent).toContain('before business expenses and taxes');
  expect(container.querySelector('.pub-stat-daily b')?.textContent).toBe('3–4');
});

it.each([
  ['120000', ['19', '24', '4–5']],
  ['104000', ['16', '20', '4']],
  ['6500', ['1', '1', '0.3']],
])('recalculates the daily target for a %s income goal', async (goal, expected) => {
  await act(() => root.render(<HeroPlan />));
  const input = container.querySelector<HTMLInputElement>('#heroGoal')!;
  await act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, goal);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect([...container.querySelectorAll('.pub-stat b')].map(stat => stat.textContent)).toEqual(expected);
});

it('explains all five steps and recalculates the breakdown when the commission changes', async () => {
  await act(() => root.render(<HeroPlan />));
  const details = container.querySelector<HTMLElement>('.pub-calc-details')!;
  const toggle = container.querySelector<HTMLButtonElement>('.pub-calc-toggle')!;
  expect(details.hidden).toBe(true);
  expect(details.hasAttribute('inert')).toBe(true);
  expect(toggle.textContent).toBe('How it’s calculated');
  expect(toggle.getAttribute('aria-controls')).toBe(details.id);
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(toggle.querySelector('.lucide-chevron-up')).not.toBeNull();
  await act(() => toggle.click());
  expect(details.hidden).toBe(false);
  expect(details.hasAttribute('inert')).toBe(false);
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  expect(toggle.querySelector('.lucide-chevron-down')).not.toBeNull();
  expect(container.querySelector('.pub-device-calculator')?.hasAttribute('inert')).toBe(true);
  expect(container.querySelector('.pub-device-calculator')?.getAttribute('aria-hidden')).toBe('true');
  const results = () => [...details.querySelectorAll('tbody tr')].map(row => row.lastElementChild?.textContent);
  expect(results()).toEqual(['13', '39', '780', '16.25', '3.25']);
  expect(details.textContent).toContain('$80,000 ÷ $6,500, rounded up');
  expect(details.textContent).toContain('Dials and voicemails do not count.');
  expect(details.querySelector('a')?.getAttribute('href')).toBe('/handbook/ch1#working-backward-from-an-income-goal');

  await act(() => details.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(details.hidden).toBe(true);
  expect(details.hasAttribute('inert')).toBe(true);
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(toggle);
  expect(container.querySelector('.pub-device-calculator')?.hasAttribute('inert')).toBe(false);

  const input = container.querySelector<HTMLInputElement>('#heroCommission')!;
  await act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '8000');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(results()).toEqual(['10', '30', '600', '12.5', '2.5']);
  expect(details.textContent).toContain('$80,000 ÷ $8,000, rounded up');
  expect(container.querySelector('.pub-stat-daily b')?.textContent).toBe('2–3');
});

it('hides the breakdown and results when an input is cleared', async () => {
  await act(() => root.render(<HeroPlan />));
  const input = container.querySelector<HTMLInputElement>('#heroGoal')!;
  await act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(container.querySelector('.pub-calc-details')).toBeNull();
  expect(container.querySelector('.pub-calc-toggle')).toBeNull();
  expect(container.querySelector('[role=status]')?.textContent).toContain('Enter both numbers');
  expect(container.querySelectorAll('.pub-stat')).toHaveLength(0);
});
