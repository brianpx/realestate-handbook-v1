// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { PageOutline } from './PageOutline';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ITEMS = [
  { id: 'one', text: 'First' },
  { id: 'two', text: 'Second' },
  { id: 'three', text: 'Third' },
];

// happy-dom lays nothing out, so every heading reports top 0 and the spy would pick the last one. Stack them below the fold.
function stackHeadings() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const index = ITEMS.findIndex(item => item.id === this.id);
    const top = index < 0 ? 0 : 400 + index * 400;
    return { top, bottom: top + 24, left: 0, right: 0, width: 0, height: 24, x: 0, y: top, toJSON: () => ({}) };
  });
}

async function mount() {
  stackHeadings();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(() => root.render(
    <PageOutline items={ITEMS}>
      {ITEMS.map(item => <h2 key={item.id} id={item.id}>{item.text}</h2>)}
    </PageOutline>,
  ));
  return { host, unmount: async () => { await act(() => root.unmount()); host.remove(); } };
}

// happy-dom has no scrollIntoView, so spyOn cannot wrap it; install a stub and take it away again after each test.
function stubScrollIntoView() {
  const scrollIntoView = vi.fn();
  Object.defineProperty(Element.prototype, 'scrollIntoView', { value: scrollIntoView, configurable: true, writable: true });
  return scrollIntoView;
}

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  history.replaceState(null, '', '/');
});

it('renders every item in both the stacked list and the rail, with the first one current', async () => {
  const { host, unmount } = await mount();
  try {
    const navs = host.querySelectorAll('nav[aria-label="On this page"]');
    expect(navs).toHaveLength(2);
    for (const nav of navs) {
      expect([...nav.querySelectorAll('a')].map(a => a.textContent)).toEqual(['First', 'Second', 'Third']);
      expect(nav.querySelector('a[aria-current="location"]')?.textContent).toBe('First');
    }
  } finally { await unmount(); }
});

it('jumps on click: sets the hash, marks the link current, scrolls and focuses the heading', async () => {
  const scrollIntoView = stubScrollIntoView();
  const { host, unmount } = await mount();
  try {
    const link = host.querySelectorAll<HTMLAnchorElement>('nav a')[1]!;
    await act(() => { link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })); });
    expect(location.hash).toBe('#two');
    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(document.activeElement?.id).toBe('two');
    for (const nav of host.querySelectorAll('nav')) {
      expect(nav.querySelector('a[aria-current="location"]')?.textContent).toBe('Second');
    }
  } finally { await unmount(); }
});

it('leaves a modified click to the browser', async () => {
  const scrollIntoView = stubScrollIntoView();
  const { host, unmount } = await mount();
  try {
    const link = host.querySelectorAll<HTMLAnchorElement>('nav a')[2]!;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, metaKey: true });
    await act(() => { link.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(false);
    expect(scrollIntoView).not.toHaveBeenCalled();
  } finally { await unmount(); }
});
