import { rm } from 'node:fs/promises';
import { seedSession } from './auth';

// A clean lead file (and rate-limit counters) and a freshly seeded signed-in reader for every run. The web server
// is already up by now; the file stores read on every request, so seeding after it starts is fine.
export default async function globalSetup() {
  await rm('.data/e2e-leads.json', { force: true });
  await seedSession();
}
