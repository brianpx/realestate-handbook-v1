import { expect, it } from 'vitest';
import { returnTarget, withReturn } from './return-to';

it('adds the current page to a link', () => {
  expect(withReturn('/support', '/handbook/ch3')).toBe('/support?from=%2Fhandbook%2Fch3');
  expect(withReturn('/support', null)).toBe('/support');
});

it('refuses anything that is not a path on this site', () => {
  for (const bad of ['//evil.test', 'https://evil.test', '/a?b=1', '/a#b', '/\\evil', 'javascript:alert(1)', '']) {
    expect(withReturn('/support', bad)).toBe('/support');
    expect(returnTarget(bad)).toBeNull();
  }
});

it('names the page it returns to', () => {
  expect(returnTarget('/handbook/ch3')).toEqual({ href: '/handbook/ch3', label: '3. Marketing & Brand Presence' });
  expect(returnTarget('/handbook')).toEqual({ href: '/handbook', label: 'the handbook' });
  expect(returnTarget('/account')).toEqual({ href: '/account', label: 'Account and saved progress' });
});
