import { neon } from '@neondatabase/serverless';

export type Row = Record<string, unknown>;

// The tagged-template query function the Neon stores are written against: Postgres on Neon over its HTTP driver,
// so each call is one stateless request and every server instance shares the same rows. `transaction` sends
// several statements in one request, run in one transaction; the queries passed to it must be unawaited calls of
// the same tag (the driver runs them lazily). Tests pass a fake.
export type Sql = ((strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>) & {
  transaction(queries: Promise<Row[]>[]): Promise<Row[][]>;
};

export const sqlFromUrl = (url: string): Sql => neon(url) as unknown as Sql;

/** A timestamptz column as the driver returns it (a Date, or a string from a fake), as a Date. */
export const toDate = (value: unknown): Date => (value instanceof Date ? value : new Date(String(value)));
export const toDateOrNull = (value: unknown): Date | null => (value === null || value === undefined ? null : toDate(value));
export const toText = (value: unknown): string | null => (value === null || value === undefined ? null : String(value));
