// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoSubmit } from './AutoSubmit';

// react-dom warns and skips act() batching unless the host declares itself an act environment
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
type RequestSubmit = HTMLFormElement['requestSubmit'];
let submits: ReturnType<typeof vi.fn<RequestSubmit>>;

const button = () => container.querySelector('button')!;

beforeEach(() => {
  vi.useFakeTimers();
  // a stalled submit: the form is asked to submit but the page never navigates away
  submits = vi.fn<RequestSubmit>();
  vi.spyOn(HTMLFormElement.prototype, 'requestSubmit').mockImplementation(submits);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('AutoSubmit', () => {
  it('submits once on arrival, then offers the button again if nothing happens', () => {
    act(() => root.render(<AutoSubmit action="/api/auth/verify" token="t" />));
    expect(submits).toHaveBeenCalledTimes(1);
    expect(button().disabled).toBe(true);
    expect(button().textContent).toBe('Signing you in…');

    act(() => { vi.advanceTimersByTime(7999); });
    expect(button().disabled).toBe(true);

    act(() => { vi.advanceTimersByTime(1); });
    expect(button().disabled).toBe(false);
    expect(button().textContent).toBe('Sign me in');
    expect(submits).toHaveBeenCalledTimes(1);
  });
});
