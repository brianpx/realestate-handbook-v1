import type { Metadata } from 'next';
import { requireViewer } from '@/lib/auth/dal';
import { StartSetup } from '@/components/handbook/StartSetup';
import { Breadcrumbs } from '@/components/shell/Breadcrumbs';
import { HANDBOOK } from '@/lib/routes';

export const metadata: Metadata = { title: 'Start here: guided setup', alternates: { canonical: `${HANDBOOK}/start` } };

// The onboarding wizard draws its own sheet (brand header, progress bar), so this page has no ProductCard.
export default async function StartPage() {
  await requireViewer();
  return (
    <div className="onboarding-page">
      <Breadcrumbs className="onboarding-crumbs" />
      <StartSetup
        intro={
          <>
            <h1 className="hb-title onboarding-title">Set up your first week</h1>
            <p className="onboarding-lede">Six short steps take you from an income goal to a daily conversation target, two lead sources and a scheduled week. Your answers are saved on this device as you go, so you can stop and come back, and change any step later.</p>
          </>
        }
      />
    </div>
  );
}
