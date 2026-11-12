import { z } from '@/lib/zod';
import type { User } from './types';

export const DISPLAY_NAME_MAX = 32;

/**
 * The PUT body of /api/account/preferences: trimmed, at most 32 characters, no control or format characters (they
 * could reorder or hide text where the name is shown). An empty name clears the choice and arrives as null.
 */
export const displayNameInputSchema = z.object({
  displayName: z.string().trim().max(DISPLAY_NAME_MAX).refine(name => !/\p{C}/u.test(name)).transform(name => name || null),
}).strict();

/** The name shown for a reader: the one they chose, else first and last name, else the address before the @. */
export function resolveDisplayName(user: Pick<User, 'email' | 'firstName' | 'lastName' | 'displayName'>): string {
  const chosen = user.displayName?.trim();
  if (chosen) return chosen;
  const full = [user.firstName, user.lastName].map(part => part?.trim()).filter(Boolean).join(' ');
  if (full) return full;
  return user.email.split('@')[0] || user.email;
}
