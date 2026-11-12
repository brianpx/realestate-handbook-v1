import type { User } from '@/lib/users/types';

export type AccountSummary = { displayName: string; email: string; avatarUrl: string | null };

/** What the user menu shows for a signed-in reader: the name (or the address's local part), the address and a picture. */
export function accountSummary(user: Pick<User, 'email' | 'firstName' | 'lastName'>): AccountSummary {
  const name = [user.firstName, user.lastName].map(part => part?.trim()).filter(Boolean).join(' ');
  return { displayName: name || user.email.split('@')[0] || user.email, email: user.email, avatarUrl: null };
}
