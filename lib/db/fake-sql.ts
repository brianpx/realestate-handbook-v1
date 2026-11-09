import type { Row, Sql } from './sql';

// A fake of the tagged-template query function for unit tests: it records each statement with its bound values
// and answers from a queue, one result per call, so a test can check what was asked without a database. A
// `transaction` records how many statements it grouped, so a test can check that they went together.
export function fakeSql(...answers: Row[][]) {
  const calls: { text: string; values: unknown[] }[] = [];
  const transactions: number[] = [];
  const tag = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push({ text: strings.join('?').replace(/\s+/g, ' ').trim(), values });
    return answers.shift() ?? [];
  };
  const sql = Object.assign(tag, {
    transaction: async (queries: Promise<Row[]>[]) => {
      transactions.push(queries.length);
      return Promise.all(queries);
    },
  }) as Sql;
  return { sql, calls, transactions };
}
