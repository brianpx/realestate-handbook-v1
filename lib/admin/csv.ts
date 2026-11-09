// RFC 4180: fields holding a comma, a quote or a line break are quoted, quotes are doubled, rows end in CRLF.
// A field that a spreadsheet would read as a formula (an address can start with "+" or "-") gets a leading
// apostrophe, the convention Excel and Sheets show as text, so the export never evaluates anything.
const FORMULA_START = /^[=+\-@\t\r]/;
const field = (value: string): string => {
  const text = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\r\n']/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (rows: readonly (readonly string[])[]): string => rows.map(row => row.map(field).join(',')).join('\r\n') + '\r\n';
