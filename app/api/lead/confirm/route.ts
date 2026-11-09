import { leadDepsFromEnv, leadRequestFrom, toResponse } from '@/lib/leads/env';
import { handleConfirm } from '@/lib/leads/handler';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return toResponse(await handleConfirm(await leadRequestFrom(request), leadDepsFromEnv(process.env)));
}
