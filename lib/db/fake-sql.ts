import type { Sql } from './sql';

// A fake of the tagged-template query function for unit tests: it records each statement with its bound values
// and answers from a queue, one result per call, so a test can check what was asked without a database.
export function fakeSql(...answers: Record<string, unknown>[][]) {
  const calls: { text: string; values: unknown[] }[] = [];
  const sql: Sql = async (strings, ...values) => {
    calls.push({ text: strings.join('?').replace(/\s+/g, ' ').trim(), values });
    return answers.shift() ?? [];
  };
  return { sql, calls };
}
