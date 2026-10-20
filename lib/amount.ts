// Number entry that tolerates "$1,500". Type="number" inputs drop or blank those characters in some browsers,
// so amounts are typed as text and parsed here. Ported from parseAmount/amountInput in legacy/js/widgets.js.
export const parseAmount = (text: string): number | undefined => {
  const cleaned = text.replace(/[$,\s]/g, '');
  return /^(\d+\.?\d*|\.\d+)$/.test(cleaned) ? Number(cleaned) : undefined;
};

export type AmountBounds = { min?: number; max?: number; hint?: string };

/** `value` is undefined when the field is empty or invalid; `message` explains invalid input. */
export function checkAmount(raw: string, { min = 0, max, hint = 'Numbers only, for example 1500.' }: AmountBounds = {}): { value: number | undefined; message: string } {
  const trimmed = raw.trim();
  const n = parseAmount(trimmed);
  let message = '';
  if (trimmed !== '' && n === undefined) message = hint;
  else if (n !== undefined && n < min) message = `Enter ${min} or more.`;
  else if (n !== undefined && max !== undefined && n > max) message = `Enter ${max} or fewer.`;
  return { value: message || trimmed === '' ? undefined : n, message };
}
