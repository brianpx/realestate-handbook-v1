import { handleReadProfile, handleSaveProfile } from '@/lib/account/profile-handler';
import { authDepsFromEnv, authRequestFrom, toResponse } from '@/lib/auth/env';
import { profileStoreFromEnv } from '@/lib/users/profile-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return toResponse(await handleReadProfile(await authRequestFrom(request), { ...authDepsFromEnv(process.env), profiles: profileStoreFromEnv(process.env) }));
}

export async function PUT(request: Request) {
  return toResponse(await handleSaveProfile(await authRequestFrom(request), { ...authDepsFromEnv(process.env), profiles: profileStoreFromEnv(process.env) }));
}
