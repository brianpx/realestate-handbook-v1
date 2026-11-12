import { handleReadMe } from '@/lib/account/me-handler';
import { authDepsFromEnv, authRequestFrom, toResponse } from '@/lib/auth/env';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return toResponse(await handleReadMe(await authRequestFrom(request), authDepsFromEnv(process.env)));
}
