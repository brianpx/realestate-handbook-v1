export const fmtNum = (n: number): string => Math.round(n).toLocaleString('en-US');
export const fmtMoney = (n: number): string => `$${fmtNum(n)}`;
