// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fmtNum } from '@/lib/format';
import { AmountInput } from './AmountInput';

// react-dom warns and skips act() batching unless the host declares itself an act environment
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Stands in for a widget: stores the parsed number and lets the test change it from outside, as a preset or a
// Clear button would.
let setStored: (value: number | undefined) => void = () => {};
function Harness({ initial, format }: { initial?: number; format?: (n: number) => string }) {
  const [value, setValue] = useState<number | undefined>(initial);
  setStored = setValue;
  return <AmountInput label="Amount" value={value} format={format} onValue={setValue} />;
}

let container: HTMLDivElement;
let root: Root;

const input = () => container.querySelector('input')!;
const error = () => container.querySelector('.calc-error')!.textContent;

const render = (initial?: number, format?: (n: number) => string) => act(() => root.render(<Harness initial={initial} format={format} />));

// React only fires onChange when the DOM value differs from the one it last set, and it watches the node's own
// `value` property, so the prototype setter is used to slip past that tracker the way a keypress would.
const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
const type = (text: string) => act(() => {
  nativeValue.call(input(), text);
  input().dispatchEvent(new Event('input', { bubbles: true }));
});
const blur = () => act(() => { input().dispatchEvent(new FocusEvent('focusout', { bubbles: true })); });
const setFromOutside = (value: number | undefined) => act(() => setStored(value));

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('AmountInput', () => {
  it('shows the stored value before anything is typed', async () => {
    await render(6500, fmtNum);
    expect(input().value).toBe('6,500');
  });

  it('keeps what was typed while the parent stores the parsed number', async () => {
    await render();
    await type('$1,500');
    expect(input().value).toBe('$1,500');
    await setFromOutside(1500); // the parent re-rendering with the number it was just given changes nothing
    expect(input().value).toBe('$1,500');
  });

  it('keeps a half-finished entry whose number has not changed', async () => {
    await render();
    await type('15');
    await type('15.');
    expect(input().value).toBe('15.');
    expect(error()).toBe('');
  });

  it('shows the new value when the parent changes it', async () => {
    await render(undefined, fmtNum);
    await type('5000');
    await setFromOutside(6500);
    expect(input().value).toBe('6,500');
  });

  it('empties the field and its message when the parent clears the value', async () => {
    await render();
    await type('45');
    await setFromOutside(undefined);
    expect(input().value).toBe('');
    expect(error()).toBe('');
  });

  it('drops the error once the parent supplies a valid value', async () => {
    await render();
    await type('abc');
    expect(error()).toBe('Numbers only, for example 1500.');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    await setFromOutside(12);
    expect(input().value).toBe('12');
    expect(error()).toBe('');
    expect(input().getAttribute('aria-invalid')).toBe('false');
  });

  it('formats what was typed on blur, and leaves an externally set value alone', async () => {
    await render(undefined, fmtNum);
    await type('8000');
    await blur();
    expect(input().value).toBe('8,000');
    await setFromOutside(9000);
    await blur();
    expect(input().value).toBe('9,000');
  });
});
