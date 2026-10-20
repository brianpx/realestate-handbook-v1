'use client';

import { FAIR_HOUSING_ITEMS } from '@/content/data/fair-housing';
import { ChoiceDrill } from './ChoiceDrill';
import { InteractiveHeader } from './InteractiveHeader';

const ITEMS = FAIR_HOUSING_ITEMS.map(item => ({ ...item, options: ['Problem', 'Fine as written'], question: 'Problem or fine?' }));

export function FairHousingDrill() {
  return (
    <div className="box try-it iw">
      <div className="box-title">● PRACTICE · PROBLEM OR FINE?</div>
      <InteractiveHeader hint="Judge each phrase against the three rules above. Practice only: not legal advice, so ask your broker." widgetKey="fair-housing-drill" label="Fair Housing drill" />
      <ChoiceDrill stateKey="fairHousing" noun="Phrase" items={ITEMS} />
    </div>
  );
}
