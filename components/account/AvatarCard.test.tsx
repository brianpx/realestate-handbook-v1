// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { resetAccountSummaryCache, useAccountSummary } from '@/components/site/useAccountSummary';
import type { AccountSummary } from '@/lib/account/me';
import { AvatarCard } from './AvatarCard';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ACCOUNT: AccountSummary = { displayName: 'Sam Rivera', email: 'sam@example.com', avatarUrl: null };
const WITH_PICTURE = { ...ACCOUNT, avatarUrl: '/api/account/avatar?v=1' };

let container: HTMLDivElement;
let root: Root;
let fetchMock: Mock<typeof fetch>;

const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const render = (account = ACCOUNT) => act(() => root.render(<AvatarCard account={account} />));
const input = () => container.querySelector<HTMLInputElement>('input[type="file"]')!;
const pick = (file: File) => act(async () => {
  Object.defineProperty(input(), 'files', { value: [file], configurable: true });
  input().dispatchEvent(new Event('change', { bubbles: true }));
});
const picture = (type = 'image/png', size = 1000, name = 'me.png') => new File([new Uint8Array(size)], name, { type });
const note = () => container.querySelector('[role="alert"], [role="status"]')?.textContent;
const buttons = () => [...container.querySelectorAll('button')];
const remove = () => buttons().find(b => b.textContent === 'Remove');

// The avatar shows its <img> only once the browser has loaded the picture; happy-dom loads nothing, so loading is faked.
class LoadingImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  referrerPolicy = '';
  crossOrigin: string | null = null;
  set src(_value: string) { queueMicrotask(() => this.onload?.()); }
}

beforeEach(() => {
  vi.stubGlobal('Image', LoadingImage);
  resetAccountSummaryCache();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('AvatarCard', () => {
  it('is a titled card with the description, the footer text, the picture as a button and a file input for the three types', async () => {
    await render();
    const card = container.querySelector('section')!;
    expect(card.id).toBe('avatar');
    expect(card.querySelector('h2')?.textContent).toBe('Avatar');
    expect(card.textContent).toContain('An avatar is optional. PNG, JPEG or WebP, up to 2 MB.');
    expect(buttons()[0]!.getAttribute('aria-label')).toBe('Upload an avatar');
    expect(input().accept).toBe('image/png,image/jpeg,image/webp');
    expect(remove()).toBeUndefined();
  });
  it('shows the current picture and a Remove button when one is set', async () => {
    await render(WITH_PICTURE);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/api/account/avatar?v=1');
    expect(buttons()[0]!.getAttribute('aria-label')).toBe('Change your avatar');
    expect(remove()).toBeDefined();
  });
  it('opens the file picker from the picture', async () => {
    await render();
    const click = vi.spyOn(input(), 'click').mockImplementation(() => {});
    await act(async () => buttons()[0]!.click());
    expect(click).toHaveBeenCalledOnce();
  });
  it('uploads the chosen file as multipart field "file", shows the new picture, announces it and updates the header summary', async () => {
    fetchMock.mockImplementation(async url => (String(url) === '/api/account/me' ? reply(200, { ok: true, ...ACCOUNT }) : reply(200, { ok: true, avatarUrl: '/api/account/avatar?v=2' })));
    function Header() {
      const state = useAccountSummary(true);
      return <output data-header>{state.status === 'ready' ? state.account.avatarUrl ?? 'none' : state.status}</output>;
    }
    const header = document.createElement('div');
    document.body.appendChild(header);
    const headerRoot = createRoot(header);
    await act(async () => headerRoot.render(<Header />));
    expect(header.textContent).toBe('none');
    await render();
    await pick(picture());
    const [url, init] = fetchMock.mock.calls.find(([u]) => String(u).startsWith('/api/account/avatar'))!;
    expect(url).toBe('/api/account/avatar');
    expect((init as RequestInit).method).toBe('POST');
    const body = (init as RequestInit).body as FormData;
    expect(body.get('file')).toBeInstanceOf(File);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/api/account/avatar?v=2');
    expect(note()).toBe('Avatar updated.');
    expect(document.activeElement?.textContent).toBe('Avatar updated.');
    expect(header.textContent).toBe('/api/account/avatar?v=2');
    expect(remove()).toBeDefined();
    act(() => headerRoot.unmount());
    header.remove();
  });
  it('checks type and size in the browser first and sends nothing for a file it can already tell is wrong', async () => {
    await render();
    await pick(picture('image/gif', 100, 'a.gif'));
    expect(note()).toBe('Choose a PNG, JPEG or WebP image.');
    await pick(picture('image/png', 2 * 1024 * 1024 + 1));
    expect(note()).toBe('That file is larger than 2 MB. Choose a smaller image.');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });
  it.each([
    [413, 'too_large', 'That file is larger than 2 MB. Choose a smaller image.'],
    [415, 'unsupported_type', 'Choose a PNG, JPEG or WebP image.'],
    [422, 'unreadable_image', 'That image could not be read. Try a different one.'],
    [401, 'unauthorized', 'Your sign-in has ended. Sign in again, then come back to this page.'],
    [403, 'forbidden', 'This request was blocked. Reload the page and try again.'],
    [503, 'storage_unavailable', 'Avatars are not set up on this site yet, so nothing was changed.'],
    [503, 'unavailable', 'Saving is not available right now. Please try again later.'],
    [500, 'oops', 'Something went wrong. Please try again in a moment.'],
  ])('says so plainly when the server answers %i %s, and keeps the picture it had', async (status, error, message) => {
    fetchMock.mockResolvedValue(reply(status, { ok: false, error }));
    await render(WITH_PICTURE);
    await pick(picture());
    expect(note()).toBe(message);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/api/account/avatar?v=1');
  });
  it('says something went wrong when the request itself fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'));
    await render();
    await pick(picture());
    expect(note()).toBe('Something went wrong. Please try again in a moment.');
  });
  it('removes the picture with DELETE, announces it, and drops the Remove button', async () => {
    fetchMock.mockResolvedValue(reply(200, { ok: true, avatarUrl: null }));
    await render(WITH_PICTURE);
    await act(async () => remove()!.click());
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/account/avatar');
    expect((fetchMock.mock.calls[0]![1] as RequestInit).method).toBe('DELETE');
    expect(note()).toBe('Avatar removed.');
    expect(container.querySelector('img')).toBeNull();
    expect(remove()).toBeUndefined();
  });
  it('keeps the picture and says why when removal fails', async () => {
    fetchMock.mockResolvedValue(reply(503, { ok: false, error: 'unavailable' }));
    await render(WITH_PICTURE);
    await act(async () => remove()!.click());
    expect(note()).toBe('Saving is not available right now. Please try again later.');
    expect(remove()).toBeDefined();
  });
  it('turns the controls off while a request is in flight and ignores a second choice', async () => {
    let finish!: (res: Response) => void;
    fetchMock.mockImplementation(() => new Promise<Response>(resolve => { finish = resolve; }));
    await render(WITH_PICTURE);
    await pick(picture());
    expect(note()).toBe('Uploading…');
    expect(buttons().every(b => b.disabled)).toBe(true);
    await pick(picture());
    expect(fetchMock).toHaveBeenCalledOnce();
    await act(async () => finish(reply(200, { ok: true, avatarUrl: '/api/account/avatar?v=3' })));
    expect(buttons().every(b => !b.disabled)).toBe(true);
  });
});
