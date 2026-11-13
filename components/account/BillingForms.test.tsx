// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { EMPTY_BILLING, type BillingFields } from '@/lib/users/billing-info';
import { BillingForms } from './BillingForms';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let fetchMock: Mock<typeof fetch>;

const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const render = (initial: Partial<BillingFields> = {}) => act(() => root.render(<BillingForms initial={{ ...EMPTY_BILLING, ...initial }} accountEmail="reader@example.com" />));
const card = (id: string) => container.querySelector<HTMLElement>(`section#${id}`)!;
const control = <T extends HTMLElement>(name: string) => container.querySelector<T>(`[name="${name}"]`)!;
const save = (id: string) => card(id).querySelector<HTMLButtonElement>('button[type="submit"]')!;
const setValue = (el: HTMLInputElement | HTMLSelectElement, value: string) => act(() => {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value);
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
});
const submit = (id: string) => act(async () => { card(id).querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
const sentBody = (call = 0) => JSON.parse(String((fetchMock.mock.calls[call]![1] as RequestInit).body)) as unknown;

beforeEach(() => {
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

describe('BillingForms', () => {
  it('renders the six cards, each with its own Save, off until something changes', async () => {
    await render();
    const titles = [...container.querySelectorAll('h2')].map(h => h.textContent);
    expect(titles).toEqual(['Invoice Email Recipient', 'Company Name', 'Billing Address', 'Invoice Language', 'Invoice Purchase Order', 'Tax ID']);
    const buttons = container.querySelectorAll<HTMLButtonElement>('button[type="submit"]');
    expect(buttons).toHaveLength(6);
    expect([...buttons].every(b => b.disabled)).toBe(true);
    expect(control<HTMLInputElement>('invoiceEmail').placeholder).toBe('reader@example.com');
    expect(container.textContent).toContain('English is the only invoice language available for now.');
    expect(container.textContent).not.toMatch(/payment method|card number|invoices list/i);
  });
  it('gives every field a label', async () => {
    await render();
    for (const el of container.querySelectorAll<HTMLElement>('input, select')) {
      expect(container.querySelector(`label[for="${el.id}"]`), el.id).not.toBeNull();
    }
    for (const id of ['addressCountry', 'addressLine1', 'addressLine2', 'addressCity', 'addressRegion', 'addressPostalCode']) {
      expect(container.querySelector(`label[for="${id}"]`)!.className).not.toContain('sr-only');
    }
    expect(container.querySelector('label[for="addressLine2"]')!.textContent).toBe('Address Line 2 (optional)');
  });
  it('shows what is saved, and Save stays off while a box only differs by spaces', async () => {
    await render({ companyName: 'Example LLC', addressCountry: 'US', addressRegion: 'TX', taxIdType: 'us_ein', taxIdValue: '12-3456789' });
    expect(control<HTMLInputElement>('companyName').value).toBe('Example LLC');
    expect(control<HTMLSelectElement>('addressRegion').value).toBe('TX');
    expect(control<HTMLSelectElement>('taxIdType').value).toBe('us_ein');
    await setValue(control('companyName'), '  Example LLC ');
    expect(save('company-name').disabled).toBe(true);
  });
  it('saves the company name alone with a PUT, announces it, and does not touch other cards', async () => {
    fetchMock.mockResolvedValue(reply(200, { ok: true, billingInfo: { ...EMPTY_BILLING, companyName: 'Example LLC' } }));
    await render();
    await setValue(control('purchaseOrder'), 'PO-9');
    await setValue(control('companyName'), ' Example LLC ');
    expect(save('company-name').disabled).toBe(false);
    await submit('company-name');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/account/billing-info');
    expect((init as RequestInit).method).toBe('PUT');
    expect(sentBody()).toEqual({ companyName: ' Example LLC ' });
    expect(control<HTMLInputElement>('companyName').value).toBe('Example LLC');
    expect(card('company-name').querySelector('[role="status"]')?.textContent).toBe('Saved.');
    expect(save('company-name').disabled).toBe(true);
    expect(control<HTMLInputElement>('purchaseOrder').value).toBe('PO-9');
    expect(save('purchase-order').disabled).toBe(false);
  });
  it('shows a state list for the United States, free text elsewhere, and sends the whole address', async () => {
    fetchMock.mockResolvedValue(reply(200, { ok: true, billingInfo: { ...EMPTY_BILLING, addressCountry: 'US', addressLine1: '1 Main St', addressCity: 'Austin', addressRegion: 'TX', addressPostalCode: '78701' } }));
    await render();
    expect(control('addressRegion').tagName).toBe('INPUT');
    await setValue(control('addressCountry'), 'US');
    expect(control('addressRegion').tagName).toBe('SELECT');
    await setValue(control('addressLine1'), '1 Main St');
    await setValue(control('addressCity'), 'Austin');
    await setValue(control('addressRegion'), 'TX');
    await setValue(control('addressPostalCode'), '78701');
    await submit('billing-address');
    expect(sentBody()).toEqual({ addressCountry: 'US', addressLine1: '1 Main St', addressLine2: '', addressCity: 'Austin', addressRegion: 'TX', addressPostalCode: '78701' });
    await setValue(control('addressCountry'), 'CA');
    expect(control('addressRegion').tagName).toBe('INPUT');
    expect(control<HTMLInputElement>('addressRegion').value).toBe('');
  });
  it('sends the tax ID type with its number, and turns the number box off with no type', async () => {
    fetchMock.mockResolvedValue(reply(200, { ok: true, billingInfo: { ...EMPTY_BILLING, taxIdType: 'us_ein', taxIdValue: '12-3456789' } }));
    await render();
    expect(control<HTMLInputElement>('taxIdValue').disabled).toBe(true);
    await setValue(control('taxIdType'), 'us_ein');
    expect(control<HTMLInputElement>('taxIdValue').placeholder).toBe('12-3456789');
    await setValue(control('taxIdValue'), '12-3456789');
    await submit('tax-id');
    expect(sentBody()).toEqual({ taxIdType: 'us_ein', taxIdValue: '12-3456789' });
  });
  it('offers only English for the invoice language, with Save off', async () => {
    await render();
    const options = [...control<HTMLSelectElement>('invoiceLanguage').options].map(o => o.textContent);
    expect(options).toEqual(['English']);
    expect(save('invoice-language').disabled).toBe(true);
  });
  it('points at the invalid field with an alert on a 400, and names no value', async () => {
    fetchMock.mockResolvedValue(reply(400, { ok: false, error: 'invalid_billing_info', fields: ['invoiceEmail'] }));
    await render();
    await setValue(control('invoiceEmail'), 'nope');
    await submit('invoice-email');
    const alert = card('invoice-email').querySelector('[role="alert"]')!;
    expect(alert.textContent).toBe('Enter a valid email address, or leave the box blank.');
    expect(control('invoiceEmail').getAttribute('aria-invalid')).toBe('true');
    expect(control('invoiceEmail').getAttribute('aria-describedby')).toBe(alert.id);
    expect(save('invoice-email').disabled).toBe(false);
  });
  it('says what to do on 401 and 503, and generically on anything else, including a network failure', async () => {
    await render();
    await setValue(control('companyName'), 'A');
    fetchMock.mockResolvedValueOnce(reply(401, { ok: false, error: 'unauthorized' }));
    await submit('company-name');
    expect(card('company-name').querySelector('[role="alert"]')?.textContent).toContain('Sign in again');
    fetchMock.mockResolvedValueOnce(reply(503, { ok: false, error: 'unavailable' }));
    await submit('company-name');
    expect(card('company-name').querySelector('[role="alert"]')?.textContent).toContain('not available right now');
    fetchMock.mockResolvedValueOnce(reply(500, {}));
    await submit('company-name');
    expect(card('company-name').querySelector('[role="alert"]')?.textContent).toContain('Something went wrong');
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await submit('company-name');
    expect(card('company-name').querySelector('[role="alert"]')?.textContent).toContain('Something went wrong');
  });
  it('ignores a second submit while one is in flight', async () => {
    let finish!: (res: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>(resolve => { finish = resolve; }));
    await render();
    await setValue(control('companyName'), 'A');
    await submit('company-name');
    await submit('company-name');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => finish(reply(200, { ok: true, billingInfo: { ...EMPTY_BILLING, companyName: 'A' } })));
  });
});
