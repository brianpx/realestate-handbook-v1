import { handleSaveBillingInfo } from '@/lib/account/billing-info-handler';
import { authDepsFromEnv, authRequestFrom, toResponse } from '@/lib/auth/env';
import { billingInfoStoreFromEnv } from '@/lib/users/billing-info-store';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  return toResponse(await handleSaveBillingInfo(await authRequestFrom(request), { ...authDepsFromEnv(process.env), billingInfo: billingInfoStoreFromEnv(process.env) }));
}
