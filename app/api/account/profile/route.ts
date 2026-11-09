import { handleReadProfile, handleSaveProfile, type ProfileDeps } from '@/lib/account/profile-handler';
import { getViewer } from '@/lib/auth/dal';
import { authRequestFrom, toResponse } from '@/lib/auth/env';
import { allowedOrigins } from '@/lib/site';
import { profileStoreFromEnv } from '@/lib/users/profile-store';

export const dynamic = 'force-dynamic';

// The viewer comes from the session cookie through the data-access layer, never from the body. A visitor without
// one gets a 401 rather than requireViewer()'s redirect: a fetch that followed it would land on the sign-in page's
// HTML with a 200 and the form would call that a save.
const deps = (): ProfileDeps => ({ profiles: profileStoreFromEnv(process.env), allowedOrigins: allowedOrigins(process.env), now: () => new Date() });

export async function GET() {
  const viewer = await getViewer();
  return toResponse(await handleReadProfile(viewer?.user.id ?? null, deps()));
}

export async function PUT(request: Request) {
  const viewer = await getViewer();
  return toResponse(await handleSaveProfile(viewer?.user.id ?? null, await authRequestFrom(request), deps()));
}
