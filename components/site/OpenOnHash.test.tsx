// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { OpenOnHash } from './OpenOnHash';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
let details: HTMLDetailsElement;
beforeEach(() => {
  window.location.hash = '';
  container = document.createElement('div');
  container.innerHTML = '<a href="#tool-index">Every tool</a><a href="#elsewhere">Elsewhere</a><details id="tool-index"><summary>Index</summary></details>';
  document.body.appendChild(container);
  details = container.querySelector('details') as HTMLDetailsElement;
  root = createRoot(document.createElement('div'));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.location.hash = '';
});

it('leaves the details closed when the hash is something else', async () => {
  window.location.hash = '#elsewhere';
  await act(() => root.render(<OpenOnHash id="tool-index" />));
  expect(details.open).toBe(false);
});

it('opens the details on load when the hash names it', async () => {
  window.location.hash = '#tool-index';
  await act(() => root.render(<OpenOnHash id="tool-index" />));
  expect(details.open).toBe(true);
});

it('opens the details when the hash changes to it', async () => {
  await act(() => root.render(<OpenOnHash id="tool-index" />));
  expect(details.open).toBe(false);
  await act(async () => {
    window.location.hash = '#tool-index';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  expect(details.open).toBe(true);
});

it('opens the details on a click of a link to it, even when the hash already matches', async () => {
  await act(() => root.render(<OpenOnHash id="tool-index" />));
  window.location.hash = '#tool-index';
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); }); // let the hashchange this fires settle
  details.open = false;
  await act(async () => {
    (container.querySelector('a[href="#tool-index"]') as HTMLAnchorElement).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  expect(details.open).toBe(true);
});

it('ignores a click on a link to another hash and stops listening once unmounted', async () => {
  await act(() => root.render(<OpenOnHash id="tool-index" />));
  await act(async () => {
    (container.querySelector('a[href="#elsewhere"]') as HTMLAnchorElement).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  expect(details.open).toBe(false);
  await act(() => root.unmount());
  await act(async () => {
    (container.querySelector('a[href="#tool-index"]') as HTMLAnchorElement).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  expect(details.open).toBe(false);
  root = createRoot(document.createElement('div'));
});
