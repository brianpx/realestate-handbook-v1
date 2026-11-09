import { describe, expect, test } from 'vitest';
import { crumbsFor, partLabel } from './breadcrumbs';

describe('crumbsFor', () => {
  test('the front page has no trail', () => {
    expect(crumbsFor('/')).toEqual([]);
    expect(crumbsFor('')).toEqual([]);
  });

  test('a chapter shows the handbook, its part and its own label', () => {
    expect(crumbsFor('/handbook/ch5')).toEqual([
      { label: 'Handbook', href: '/handbook' },
      { label: 'Nurture' },
      { label: '5. Nurturing Leads' },
    ]);
    expect(crumbsFor('/handbook/app-d/')).toEqual([
      { label: 'Handbook', href: '/handbook' },
      { label: 'Appendices' },
      { label: 'App D: Glossary' },
    ]);
  });

  test('pages outside a part skip the part crumb', () => {
    expect(crumbsFor('/handbook/cover')).toEqual([{ label: 'Handbook', href: '/handbook' }, { label: 'Title Page' }]);
  });

  test('the handbook home and its sections', () => {
    expect(crumbsFor('/handbook')).toEqual([{ label: 'Handbook' }]);
    expect(crumbsFor('/handbook/start')).toEqual([{ label: 'Handbook', href: '/handbook' }, { label: 'Start here' }]);
    expect(crumbsFor('/handbook/plan')).toEqual([{ label: 'Handbook', href: '/handbook' }, { label: 'My plan' }]);
  });

  test('public pages use their titles', () => {
    expect(crumbsFor('/pricing')).toEqual([{ label: 'Pricing and availability' }]);
    expect(crumbsFor('/account')).toEqual([{ label: 'Account and saved progress' }]);
  });

  test('an unknown address falls back to readable segments with the parents linked', () => {
    expect(crumbsFor('/handbook/nowhere')).toEqual([{ label: 'Handbook', href: '/handbook' }, { label: 'Nowhere' }]);
    expect(crumbsFor('/some-section/deep_page')).toEqual([{ label: 'Some section', href: '/some-section' }, { label: 'Deep page' }]);
  });
});

test('partLabel shortens the part headings', () => {
  expect(partLabel('ch1')).toBe('Foundations');
  expect(partLabel('ch9')).toBe('Serve and Keep');
  expect(partLabel('app-a')).toBe('Appendices');
  expect(partLabel('pref')).toBeNull();
});
