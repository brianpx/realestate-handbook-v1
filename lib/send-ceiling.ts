// The global send ceiling (M8 step 2, CR-L2): a cost backstop on the two routes that send email, /api/lead (the
// confirmation link) and /api/auth/request-link (the sign-in link). The per-connection and per-address limits bound
// one caller; this bounds all callers together, per route, so a burst spread over many addresses cannot run up the
// email bill. Each route's store keeps one count per clock-aligned window (every server instance names the same
// one), and the handler refuses with the per-connection limit's 429 once the count passes the ceiling, so a caller
// learns nothing from the answer and nothing is sent.

export const SEND_CEILING_WINDOW_SECONDS = 600;
export const DEFAULT_SEND_CEILING = 60;

/** EMAIL_SEND_CEILING: sends per route per window, a positive whole number; unset or anything else is the default. */
export function sendCeilingFromEnv(env: Record<string, string | undefined>): number {
  const raw = env.EMAIL_SEND_CEILING?.trim() ?? '';
  return /^[1-9]\d*$/.test(raw) ? Number(raw) : DEFAULT_SEND_CEILING;
}

/** The start of the window `now` falls in. */
export function sendWindowStart(now: Date): Date {
  const ms = SEND_CEILING_WINDOW_SECONDS * 1000;
  return new Date(Math.floor(now.getTime() / ms) * ms);
}
