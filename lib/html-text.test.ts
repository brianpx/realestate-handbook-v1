import { describe, expect, it } from 'vitest';
import { decodeEntities, htmlText, tableRows } from './html-text';

describe('htmlText', () => {
  it('drops tags and decodes entities', () => {
    expect(htmlText('<em>Acknowledge</em> &amp; offer &quot;value&quot;&nbsp;now &#39;ok&#39; &#x2014;')).toBe('Acknowledge & offer "value" now \'ok\' —');
  });
  it('keeps unknown entities as written and turns <br> into a line break', () => {
    expect(htmlText('a&zzz;b<br>c')).toBe('a&zzz;b\nc');
  });
});

describe('decodeEntities', () => {
  it('keeps the spaces around text', () => {
    expect(decodeEntities(' a &amp; b ')).toBe(' a & b ');
  });
});

describe('tableRows', () => {
  it('reads body rows only, as plain text', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody>' +
      '<tr><td>"x"</td><td><em>Do</em> this</td></tr><tr><td>y</td><td>z &amp; w</td></tr></tbody></table>';
    expect(tableRows(html)).toEqual([['"x"', 'Do this'], ['y', 'z & w']]);
  });
  it('keeps a row header as the first cell', () => {
    const html = '<table><thead><tr><th>When</th><th>Do</th></tr></thead><tbody><tr><th scope="row">Day 1</th><td>Call</td></tr></tbody></table>';
    expect(tableRows(html)).toEqual([['Day 1', 'Call']]);
  });
  it('returns nothing without a tbody', () => {
    expect(tableRows('<p>no table</p>')).toEqual([]);
  });
});
