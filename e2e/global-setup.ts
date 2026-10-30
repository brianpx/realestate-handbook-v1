import { rm } from 'node:fs/promises';

// A clean lead file (and rate-limit counters) for every run.
export default async function globalSetup() {
  await rm('.data/e2e-leads.json', { force: true });
}
