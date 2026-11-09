import { authDepsFromEnv, authRequestFrom, toResponse } from '@/lib/auth/env';
import { handleVerify } from '@/lib/auth/handler';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return toResponse(await handleVerify(await authRequestFrom(request), authDepsFromEnv(process.env)));
}
