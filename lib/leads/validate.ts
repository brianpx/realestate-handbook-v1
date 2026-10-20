import { z } from 'zod';
import { CONSENT_TEXTS } from './config';

// The only thing the route accepts. `_gotcha` is a field a person never sees; anything in it marks a bot.
export const leadSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  consentVersion: z.string().refine(v => v in CONSENT_TEXTS, 'unknown consent version'),
  _gotcha: z.string().max(500).optional().default(''),
});
export type LeadInput = z.infer<typeof leadSchema>;
