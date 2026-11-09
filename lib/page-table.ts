import { htmlText } from './html-text';

export type PageTable = {
  /** The caption's inner HTML, or null when the table has none. */
  caption: string | null;
  /** Column headings as plain text. */
  head: string[];
  /** One entry per body row: each cell's inner HTML, and whether the first cell was a row heading (th scope="row"). */
  rows: { cells: string[]; rowHeader: boolean }[];
};

const CELL = /<t([dh])\b[^>]*>([\s\S]*?)<\/t\1>/gi;

/** The first table in a trusted page snippet (content/pages), taken apart so a component can lay it out again. */
export function parsePageTable(html: string): PageTable {
  const table = /<table[^>]*>([\s\S]*?)<\/table>/i.exec(html)?.[1];
  if (table === undefined) throw new Error('the data-table marker does not wrap a <table>');
  const caption = /<caption[^>]*>([\s\S]*?)<\/caption>/i.exec(table)?.[1]?.trim() ?? null;
  const headRow = /<thead[^>]*>([\s\S]*?)<\/thead>/i.exec(table)?.[1] ?? '';
  const head = [...headRow.matchAll(CELL)].map(m => htmlText(m[2]!));
  const body = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i.exec(table)?.[1] ?? '';
  const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(row => {
    const cells = [...row[1]!.matchAll(CELL)];
    return { cells: cells.map(c => c[2]!.trim()), rowHeader: cells[0]?.[1]?.toLowerCase() === 'h' };
  });
  if (head.length === 0 || rows.length === 0) throw new Error('a data-table needs a <thead> and a <tbody>');
  return { caption, head, rows };
}
