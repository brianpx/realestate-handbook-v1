// Fixed locale and zone so the server and the browser print the same string, whatever the admin's machine is set to.
const dateFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC', timeZoneName: 'short' });
const countFormat = new Intl.NumberFormat('en-US');

/** "Nov 8, 2026, 12:00 UTC" from an ISO string or a Date. */
export const formatWhen = (value: string | Date): string => dateFormat.format(typeof value === 'string' ? new Date(value) : value);
export const formatCount = (n: number): string => countFormat.format(n);
export const formatShare = (share: number): string => `${Math.round(share * 100)}%`;
