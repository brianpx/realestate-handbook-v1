import { handleDeleteAvatar, handleReadAvatar, handleUploadAvatar } from '@/lib/account/avatar-handler';
import { avatarRequestFrom } from '@/lib/account/avatar-request';
import { authDepsFromEnv, sessionIdFrom, toResponse } from '@/lib/auth/env';
import { avatarStorageFromEnv } from '@/lib/users/avatar-storage';

export const dynamic = 'force-dynamic';

const depsFromEnv = () => ({ ...authDepsFromEnv(process.env), avatars: avatarStorageFromEnv(process.env) });

export async function GET(request: Request) {
  return handleReadAvatar({ sessionId: sessionIdFrom(request) }, depsFromEnv());
}

export async function POST(request: Request) {
  return toResponse(await handleUploadAvatar(avatarRequestFrom(request), depsFromEnv()));
}

export async function DELETE(request: Request) {
  return toResponse(await handleDeleteAvatar(avatarRequestFrom(request), depsFromEnv()));
}
