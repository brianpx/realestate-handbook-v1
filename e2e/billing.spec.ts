import { createHmac } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { expect, test } from './fixtures';
import { linkFor } from './mail';
import { BASE_URL } from './target';

const SECRET = 'e2e-billing-webhook-secret';
const FIXTURE = '.data/e2e-orders.json';

test.describe('a signed billing webhook', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('grants the buyer and the account page shows the purchase', async ({ page, request }) => {
    const email = `buyer-${Date.now()}@e2e.test`;
    const orderId = String(Date.now());
    const when = new Date().toISOString();
    const body = {
      meta: { event_name: 'order_created' },
      data: {
        type: 'orders',
        id: orderId,
        attributes: {
          status: 'paid',
          user_email: email,
          customer_id: 55,
          total: 4321,
          currency: 'USD',
          refunded_amount: 0,
          identifier: 'pay_e2e',
          first_order_item: { variant_id: 2357693 },
          urls: { receipt: 'https://app.lemonsqueezy.com/my-orders/e2e-receipt' },
          created_at: when,
          updated_at: when,
        },
      },
    };
    const raw = JSON.stringify(body);
    await mkdir('.data', { recursive: true });
    await writeFile(FIXTURE, JSON.stringify({ orders: { [orderId]: body } }));
    const signature = createHmac('sha256', SECRET).update(raw).digest('hex');

    const posted = await request.post('/api/billing/webhook', {
      data: raw,
      headers: { 'content-type': 'application/json', 'x-signature': signature, 'x-event-name': 'order_created' },
    });
    expect(posted.status()).toBe(200);
    expect(await posted.json()).toEqual({ ok: true, outcome: 'processed' });

    const link = await linkFor(request, email, 'Your handbook is ready');
    expect(link.startsWith(`${BASE_URL}/auth/verify?token=`)).toBe(true);
    await page.goto(link);
    await expect(page).toHaveURL(`${BASE_URL}/handbook`);

    await page.goto('/account');
    await expect(page.locator('[data-account-email]')).toHaveText(email);
    await expect(page.locator('[data-account-plan]')).toHaveText('Basic plan');
    await expect(page.locator('[data-billing-purchase]')).toHaveAttribute('data-billing-purchase', 'paid');
    await expect(page.locator('[data-billing-manage]')).toHaveAttribute('href', 'https://app.lemonsqueezy.com/my-orders/e2e-receipt');
    await expect(page.locator('[data-billing-purchase]')).not.toContainText('4321');
    await expect(page.locator('[data-billing-purchase]')).not.toContainText('$');
  });
});
