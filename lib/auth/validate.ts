import { z } from '@/lib/zod';
import { emailSchema } from '@/lib/validate/email';
import { DEFAULT_NEXT_PATH, SOURCES, TERMS_VERSION } from './config';

// Where to land after sign-in. Stored server-side with the token, so the link itself is never an open redirect;
// anything that is not a plain same-site path falls back to the handbook home. A leading backslash is refused too,
// because browsers read "/\evil" as "//evil".
export function safeNextPath(value: string | null | undefined): string {
  if (!value || value.length > 2000) return DEFAULT_NEXT_PATH;
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\s\u0000-\u001f]/.test(value)) return DEFAULT_NEXT_PATH;
  return value;
}

// The only body /api/auth/request-link accepts. `_gotcha` is a field a person never sees; anything in it marks a bot.
export const requestLinkSchema = z.object({
  email: emailSchema,
  termsVersion: z.enum([TERMS_VERSION]),
  source: z.enum(SOURCES),
  next: z.string().max(2000).optional(),
  _gotcha: z.string().max(500).optional().default(''),
});
export type RequestLinkInput = z.infer<typeof requestLinkSchema>;
