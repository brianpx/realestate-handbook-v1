import type { Metadata } from 'next';
import { ChapterBands } from '@/components/handbook/home/ChapterBands';
import { Hero } from '@/components/handbook/home/Hero';
import { HowToUse } from '@/components/handbook/home/HowToUse';
import { ToolCards } from '@/components/handbook/home/ToolCards';
import { ContinuePanel } from '@/components/handbook/HomePanels';
import { ProductCard } from '@/components/shell/ProductCard';
import { pageOpen } from '@/lib/access/entitlement';
import { requireViewer } from '@/lib/auth/dal';
import { purchaseOpen } from '@/lib/offer';
import { PAGE_IDS } from '@/lib/pages';
import { HANDBOOK } from '@/lib/routes';

export const metadata: Metadata = { title: 'Handbook home', alternates: { canonical: HANDBOOK } };

export default async function HandbookHome() {
  const { entitlement } = await requireViewer();
  const locked = PAGE_IDS.filter(id => !pageOpen(entitlement, id));
  const free = entitlement.level !== 'member';
  const suspended = entitlement.level === 'preview' && entitlement.suspended;
  return (
    <ProductCard>
      <div className="hb-home">
        <Hero free={free} suspended={suspended} purchaseOpen={purchaseOpen()} locked={locked} />
        {!free && <ContinuePanel />}
        <HowToUse free={free} />
        <ChapterBands locked={locked} free={free} />
        <ToolCards locked={locked} free={free} />
      </div>
    </ProductCard>
  );
}
