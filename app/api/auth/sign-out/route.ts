import { authDepsFromEnv, authRequestFrom, toResponse } from '@/lib/auth/env';
import { handleSignOut } from '@/lib/auth/handler';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return toResponse(await handleSignOut(await authRequestFrom(request), authDepsFromEnv(process.env)));
}
