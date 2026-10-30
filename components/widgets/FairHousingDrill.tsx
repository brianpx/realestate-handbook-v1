'use client';

import { FAIR_HOUSING_ITEMS } from '@/content/data/fair-housing';
import { ChoiceDrill } from './ChoiceDrill';
import { InteractiveHeader } from './InteractiveHeader';

const ITEMS = FAIR_HOUSING_ITEMS.map(item => ({ ...item, options: ['Problem', 'Fine as written'], question: 'Problem or fine?' }));

export function FairHousingDrill() {
  return (
    <aside className="box try-it iw">
      <h3 className="box-title">● PRACTICE · PROBLEM OR FINE?</h3>
      <InteractiveHeader hint="Judge each phrase against the three rules above. Practice only: not legal advice, so ask your broker." widgetKey="fair-housing-drill" label="Fair Housing drill" />
      <ChoiceDrill stateKey="fairHousing" noun="Phrase" items={ITEMS} />
    </aside>
  );
}
