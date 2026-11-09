import { expect, type APIRequestContext } from '@playwright/test';

// Mailpit, the local mail catcher the e2e server sends through (playwright.config.ts). The sign-in link and the
// notes confirmation link are read back from its API; a subject narrows the search when one address got both.
export const MAILPIT_URL = 'http://localhost:8025';

export async function linkFor(request: APIRequestContext, email: string, subject?: string): Promise<string> {
  const query = `to:"${email}"${subject ? ` subject:"${subject}"` : ''}`;
  let link = '';
  await expect.poll(async () => {
    const search = (await (await request.get(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(query)}`)).json()) as { messages: { ID: string }[] };
    const id = search.messages[0]?.ID;
    if (!id) return null;
    const message = (await (await request.get(`${MAILPIT_URL}/api/v1/message/${id}`)).json()) as { Text: string };
    link = /https?:\/\/\S+/.exec(message.Text)?.[0] ?? '';
    return link || null;
  }, { timeout: 10_000 }).not.toBeNull();
  return link;
}
