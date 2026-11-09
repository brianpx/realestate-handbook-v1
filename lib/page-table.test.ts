import { expect, test } from 'vitest';
import { parsePageTable } from './page-table';

const TABLE = `
  <table><caption>Table 8.2. Weekly <em>targets</em>.</caption>
    <thead><tr><th>ACTIVITY</th><th>WEEKLY TARGET</th></tr></thead>
    <tbody>
      <tr><th scope="row"><a href="/handbook/ch1">Outbound calls</a></th><td>40 to 60</td></tr>
      <tr><td>Conversations &amp; talks</td><td>15 to 25</td></tr>
    </tbody>
  </table>`;

test('a page table is split into caption, headings and rows that keep their markup', () => {
  const table = parsePageTable(`<p>before</p>${TABLE}<p>after</p>`);
  expect(table.caption).toBe('Table 8.2. Weekly <em>targets</em>.');
  expect(table.head).toEqual(['ACTIVITY', 'WEEKLY TARGET']);
  expect(table.rows).toEqual([
    { cells: ['<a href="/handbook/ch1">Outbound calls</a>', '40 to 60'], rowHeader: true },
    { cells: ['Conversations &amp; talks', '15 to 25'], rowHeader: false },
  ]);
});

test('a table without a caption has null for it', () => {
  expect(parsePageTable('<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>').caption).toBeNull();
});

test('a marker that does not wrap a complete table fails loudly', () => {
  expect(() => parsePageTable('<p>no table here</p>')).toThrow(/does not wrap a <table>/);
  expect(() => parsePageTable('<table><tbody><tr><td>1</td></tr></tbody></table>')).toThrow(/thead/);
});
