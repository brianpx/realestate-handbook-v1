import { z } from 'zod';
import { CONSENT_VERSION } from './config';

// The only thing the route accepts. `_gotcha` is a field a person never sees; anything in it marks a bot.
export const leadSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  consentVersion: z.enum([CONSENT_VERSION]),
  _gotcha: z.string().max(500).optional().default(''),
});
export type LeadInput = z.infer<typeof leadSchema>;
