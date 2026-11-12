// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { resetAccountSummaryCache, setAccountSummaryAvatar, useAccountSummary } from './useAccountSummary';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SUMMARY = { ok: true, displayName: 'Sam Rivera', email: 'sam@example.com', avatarUrl: null };
const reply = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let container: HTMLDivElement;
let root: Root;
let fetchMock: Mock<typeof fetch>;

function Probe({ signedIn = true }: { signedIn?: boolean }) {
  const state = useAccountSummary(signedIn);
  return <p data-probe>{state.status === 'ready' ? `${state.account.displayName}|${state.account.avatarUrl ?? 'none'}` : state.status}</p>;
}
const probes = () => [...container.querySelectorAll('[data-probe]')].map(n => n.textContent);
const render = (signedIn = true) => act(async () => root.render(<Probe signedIn={signedIn} />));
const remount = () => { act(() => root.unmount()); root = createRoot(container); };

beforeEach(() => {
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

describe('useAccountSummary', () => {
  it('asks only when the sign-in flag is set, and once for every menu on the page', async () => {
    fetchMock.mockImplementation(async () => reply(200, SUMMARY));
    await render(false);
    expect(probes()).toEqual(['idle']);
    expect(fetchMock).not.toHaveBeenCalled();
    await act(async () => root.render(<><Probe /><Probe /></>));
    expect(probes()).toEqual(['Sam Rivera|none', 'Sam Rivera|none']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('reports a failed request as an error and asks again on the next mount', async () => {
    fetchMock.mockResolvedValueOnce(reply(500)).mockResolvedValueOnce(reply(200, SUMMARY));
    await render();
    expect(probes()).toEqual(['error']);
    remount();
    await render();
    expect(probes()).toEqual(['Sam Rivera|none']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('reports a 401 as out', async () => {
    fetchMock.mockResolvedValue(reply(401));
    await render();
    expect(probes()).toEqual(['out']);
  });
  it('shows a new picture in every mounted menu at once, and keeps it for the next mount', async () => {
    fetchMock.mockImplementation(async () => reply(200, SUMMARY));
    await act(async () => root.render(<><Probe /><Probe /></>));
    act(() => setAccountSummaryAvatar('/api/account/avatar?v=42'));
    expect(probes()).toEqual(['Sam Rivera|/api/account/avatar?v=42', 'Sam Rivera|/api/account/avatar?v=42']);
    remount();
    await render();
    expect(probes()).toEqual(['Sam Rivera|/api/account/avatar?v=42']);
    act(() => setAccountSummaryAvatar(null));
    expect(probes()).toEqual(['Sam Rivera|none']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('ignores a change made before the summary has loaded', async () => {
    fetchMock.mockImplementation(async () => reply(200, { ...SUMMARY, avatarUrl: '/api/account/avatar?v=7' }));
    act(() => setAccountSummaryAvatar('/api/account/avatar?v=1'));
    await render();
    expect(probes()).toEqual(['Sam Rivera|/api/account/avatar?v=7']);
  });
});
