// @vitest-environment happy-dom
import { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { SidebarSearch, type SearchApi } from './SidebarSearch';
vi.mock('next/navigation', () => ({ usePathname: () => '/handbook/ch1', useRouter: () => ({ push: vi.fn() }) }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
it('retries a failed index request with an explicit control and announces the result', async () => {
  const fetchMock = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(new Response('[]'));
  vi.stubGlobal('fetch', fetchMock);
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  try {
    await act(() => root.render(<SidebarSearch onSearching={() => {}} onNavigate={() => {}} apiRef={createRef<SearchApi>()}>{null}</SidebarSearch>));
    const input = host.querySelector('input')!;
    await act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'commission');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(host.querySelector('[role=status]')?.textContent).toContain('Search could not load');
    await act(async () => { host.querySelector('button')!.focus(); host.querySelector('button')!.click(); });
    expect(document.activeElement).toBe(input);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(host.querySelector('[role=status]')?.textContent).toBe('No matches');
    expect(host.querySelector('button')).toBeNull();
  } finally {
    await act(() => root.unmount()); host.remove(); vi.unstubAllGlobals();
  }
});
