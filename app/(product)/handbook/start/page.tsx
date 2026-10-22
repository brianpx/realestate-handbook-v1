import type { Metadata } from 'next';
import { StartSetup } from '@/components/handbook/StartSetup';
import { ProductCard } from '@/components/shell/ProductCard';
import { HANDBOOK } from '@/lib/routes';

export const metadata: Metadata = { title: 'Start here: guided setup', alternates: { canonical: `${HANDBOOK}/start` } };

export default function StartPage() {
  return (
    <ProductCard>
      <p className="part-label">Your first session</p>
      <h1 className="hb-title">Set up your first week</h1>
      <p>Six short steps take you from an income goal to a daily conversation target, two lead sources and a scheduled week. Your answers are saved on this device as you go, so you can stop and come back, and change any step later.</p>
      <StartSetup />
    </ProductCard>
  );
}
