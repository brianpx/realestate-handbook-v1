// RFC 4180: fields holding a comma, a quote or a line break are quoted, quotes are doubled, rows end in CRLF.
const field = (value: string): string => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export const toCsv = (rows: readonly (readonly string[])[]): string => rows.map(row => row.map(field).join(',')).join('\r\n') + '\r\n';
