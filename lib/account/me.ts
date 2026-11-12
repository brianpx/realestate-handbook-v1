import { resolveDisplayName } from '@/lib/users/display-name';
import type { User } from '@/lib/users/types';

export type AccountSummary = { displayName: string; email: string; avatarUrl: string | null };

/** What the user menu shows for a signed-in reader: their display name, the address and a picture. */
export function accountSummary(user: Pick<User, 'email'> & Partial<Pick<User, 'firstName' | 'lastName' | 'displayName'>>): AccountSummary {
  const name = resolveDisplayName({ firstName: null, lastName: null, displayName: null, ...user });
  return { displayName: name, email: user.email, avatarUrl: null };
}
