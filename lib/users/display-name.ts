import { z } from '@/lib/zod';
import type { User } from './types';

export const DISPLAY_NAME_MAX = 32;

/** The PUT body of /api/account/preferences: trimmed, 1 to 32 characters (the database check in 009 says the same). */
export const displayNameInputSchema = z.object({
  displayName: z.string().trim().min(1).max(DISPLAY_NAME_MAX),
}).strict();

/** The name shown for a reader: the one they chose, else first and last name, else the address before the @. */
export function resolveDisplayName(user: Pick<User, 'email' | 'firstName' | 'lastName' | 'displayName'>): string {
  const chosen = user.displayName?.trim();
  if (chosen) return chosen;
  const full = [user.firstName, user.lastName].map(part => part?.trim()).filter(Boolean).join(' ');
  if (full) return full;
  return user.email.split('@')[0] || user.email;
}
