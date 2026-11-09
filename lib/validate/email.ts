import { z } from '@/lib/zod';

// The one email schema every form shares: trimmed and lower-cased, nothing else rewritten (no dot or plus folding,
// which would merge addresses their owners keep apart), capped at the RFC length, then checked for shape.
export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());
