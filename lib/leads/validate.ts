import { z } from 'zod';
import { emailSchema } from '@/lib/validate/email';
import { CONSENT_VERSION, LEAD_SOURCES } from './config';

// The only thing the route accepts. `_gotcha` is a field a person never sees; anything in it marks a bot.
export const leadSchema = z.object({
  email: emailSchema,
  consentVersion: z.enum([CONSENT_VERSION]),
  source: z.enum(LEAD_SOURCES),
  _gotcha: z.string().max(500).optional().default(''),
});
export type LeadInput = z.infer<typeof leadSchema>;
