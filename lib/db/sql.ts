import { neon } from '@neondatabase/serverless';

// The tagged-template query function the Neon stores are written against: Postgres on Neon over its HTTP driver,
// so each call is one stateless request and every server instance shares the same rows. Tests pass a fake.
export type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

export const sqlFromUrl = (url: string): Sql => neon(url) as unknown as Sql;

/** A timestamptz column as the driver returns it (a Date, or a string from a fake), as a Date. */
export const toDate = (value: unknown): Date => (value instanceof Date ? value : new Date(String(value)));
export const toDateOrNull = (value: unknown): Date | null => (value === null || value === undefined ? null : toDate(value));
