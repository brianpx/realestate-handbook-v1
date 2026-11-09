import { authDepsFromEnv, authRequestFrom, toResponse } from '@/lib/auth/env';
import { handleRequestLink } from '@/lib/auth/handler';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return toResponse(await handleRequestLink(await authRequestFrom(request), authDepsFromEnv(process.env)));
}
