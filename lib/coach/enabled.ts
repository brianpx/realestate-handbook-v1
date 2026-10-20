// The reading-plan coach pages (/plan, /review) stay off until cutover. NEXT_PUBLIC_ because CoachCheck is a client
// component; read at BUILD time, so changing it needs a redeploy.
export const COACH_ENABLED = process.env.NEXT_PUBLIC_COACH_ENABLED === 'true';
