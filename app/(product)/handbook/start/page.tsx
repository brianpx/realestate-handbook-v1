import type { Metadata } from 'next';
import { StartSetup } from '@/components/handbook/StartSetup';
import { UpsellCard } from '@/components/handbook/UpsellCard';
import { Breadcrumbs } from '@/components/shell/Breadcrumbs';
import { requireViewer } from '@/lib/auth/dal';
import { HANDBOOK } from '@/lib/routes';

export const metadata: Metadata = { title: 'Start here: guided setup', alternates: { canonical: `${HANDBOOK}/start` } };

// The onboarding wizard draws its own sheet (brand header, progress bar), so this page has no ProductCard.
// The setup belongs to the paid handbook (it builds the plan the member chapters run); the free set reads about it.
export default async function StartPage() {
  const viewer = await requireViewer();
  if (viewer.entitlement.level !== 'member') return <UpsellCard feature="start" entitlement={viewer.entitlement} />;
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
