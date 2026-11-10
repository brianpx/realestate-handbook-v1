import { handleDeleteAccount } from '@/lib/account/handler';
import { authDepsFromEnv, authRequestFrom, toResponse } from '@/lib/auth/env';
import { storeFromEnv } from '@/lib/leads/store';
import { profileStoreFromEnv } from '@/lib/users/profile-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return toResponse(await handleDeleteAccount(await authRequestFrom(request), { ...authDepsFromEnv(process.env), leads: storeFromEnv(process.env), profiles: profileStoreFromEnv(process.env) }));
}
