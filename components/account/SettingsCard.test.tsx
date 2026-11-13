// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SettingsCard } from './SettingsCard';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
const render = (node: React.ReactNode) => act(() => root.render(node));

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('SettingsCard', () => {
  it('is a region named by its title, with the description, the control area, the hint and the action', async () => {
    await render(<SettingsCard id="thing" title="Thing" description="About the thing" footer="A hint" action={<button type="button">Save</button>}><input aria-label="Value" /></SettingsCard>);
    const card = container.querySelector('section')!;
    expect(card.id).toBe('thing');
    expect(card.getAttribute('aria-labelledby')).toBe('thing-title');
    expect(container.querySelector('h2#thing-title')?.textContent).toBe('Thing');
    expect(card.textContent).toContain('About the thing');
    expect(card.querySelector('input')).not.toBeNull();
    const footer = card.querySelector('[data-settings-card-footer]')!;
    expect(footer.textContent).toContain('A hint');
    expect(footer.querySelector('button')?.textContent).toBe('Save');
    expect(card.getAttribute('data-tone')).toBe('default');
    expect(card.querySelector('form')).toBeNull();
  });
  it('puts an aside beside the title inside the card, and adds nothing without one', async () => {
    await render(<SettingsCard id="pic" title="Pic" description="About" aside={<img alt="Me" src="/me.webp" />} />);
    const card = container.querySelector('section')!;
    expect(card.querySelector('img[alt="Me"]')).not.toBeNull();
    expect(card.querySelector('#pic-title')!.parentElement!.parentElement!.contains(card.querySelector('img'))).toBe(true);
    await render(<SettingsCard id="plain" title="Plain" />);
    expect(container.querySelector('img')).toBeNull();
  });
  it('leaves the footer out when it has neither a hint nor an action', async () => {
    await render(<SettingsCard id="bare" title="Bare">body</SettingsCard>);
    expect(container.querySelector('[data-settings-card-footer]')).toBeNull();
  });
  it('wraps the body and the footer in one form when given form props, so the footer button submits it', async () => {
    await render(<SettingsCard id="f" title="F" form={{ method: 'post', action: '/somewhere' }} action={<button type="submit">Go</button>}><input name="x" /></SettingsCard>);
    const form = container.querySelector('form')!;
    expect(form.getAttribute('action')).toBe('/somewhere');
    expect(form.getAttribute('method')).toBe('post');
    expect(form.querySelector('input[name="x"]')).not.toBeNull();
    expect(form.querySelector('[data-settings-card-footer] button[type="submit"]')).not.toBeNull();
  });
  it('marks the danger tone on the card', async () => {
    await render(<SettingsCard id="d" title="D" tone="danger" footer="Careful" />);
    expect(container.querySelector('section')!.getAttribute('data-tone')).toBe('danger');
    expect(container.querySelector('[data-settings-card-footer]')!.className).toContain('bg-red-50');
  });
});
