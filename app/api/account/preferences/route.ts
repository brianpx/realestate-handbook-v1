import { handleSavePreferences } from '@/lib/account/preferences-handler';
import { authDepsFromEnv, authRequestFrom, toResponse } from '@/lib/auth/env';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  return toResponse(await handleSavePreferences(await authRequestFrom(request), authDepsFromEnv(process.env)));
}
