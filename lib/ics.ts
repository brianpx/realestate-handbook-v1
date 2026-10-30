import { addDays } from './dates';

// Calendar export. Times are "floating" (no time zone), so an event lands at the same clock time wherever the
// reader's calendar is set. Ported from downloadIcs in legacy/js/widgets.js, with one change: long lines are
// folded at 75 bytes as RFC 5545 requires (the static site wrote them unfolded).
export type IcsEvent = {
  summary: string;
  description?: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  rrule?: string;
};

const two = (n: number) => String(n).padStart(2, '0');
export const icsDate = (d: Date): string => `${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}`;
export const icsDateTime = (d: Date): string => `${icsDate(d)}T${two(d.getHours())}${two(d.getMinutes())}00`;
export const icsEscape = (text: string): string => text.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Folds a content line to at most 75 UTF-8 bytes per physical line, continuing with a leading space. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
      limit = 74; // continuation lines start with one space
    }
    current += ch;
    bytes += n;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

export function buildIcs(events: readonly IcsEvent[], opts: { now?: Date; uidSeed?: number } = {}): string {
  const now = opts.now ?? new Date();
  const seed = opts.uidSeed ?? now.getTime();
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Handbook//Interactive tools//EN', 'CALSCALE:GREGORIAN'];
  events.forEach((e, i) => {
    lines.push('BEGIN:VEVENT', `UID:${seed}-${i}@handbook.local`, `DTSTAMP:${stamp}`);
    if (e.allDay) lines.push(`DTSTART;VALUE=DATE:${icsDate(e.start)}`, `DTEND;VALUE=DATE:${icsDate(addDays(e.start, 1))}`);
    else lines.push(`DTSTART:${icsDateTime(e.start)}`, `DTEND:${icsDateTime(e.end ?? e.start)}`);
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    lines.push(`SUMMARY:${icsEscape(e.summary)}`);
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n');
}

export function downloadIcs(filename: string, events: readonly IcsEvent[]): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([buildIcs(events)], { type: 'text/calendar' }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
