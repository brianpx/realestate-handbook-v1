'use client';

import { PAGE_IDS } from '@/lib/pages';
import { checkpointConfident, rollupText } from '@/lib/checkpoints';
import { trackingProgress, useHandbookState, useSettings } from '@/lib/state';

export const TRACKED_PAGES = PAGE_IDS.filter(id => id !== 'cover');

export function ProgressItem() {
  const { read, widgets } = useHandbookState();
  const settings = useSettings();
  if (!trackingProgress(settings)) return null;
  const done = TRACKED_PAGES.filter(id => read[id]).length;
  const pct = Math.round((done / TRACKED_PAGES.length) * 100);
  return (
    <li className="progress-item">
      <div className="progress-head">
        <div className="progress-label" id="progressLabel">{done} of {TRACKED_PAGES.length} sections read</div>
      </div>
      <div className="progress-bar" role="progressbar" aria-labelledby="progressLabel" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} id="progressBar">
        <span id="progressFill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-sub" id="checkpointRollup">{rollupText(checkpointConfident(widgets.checkpoints))}</div>
    </li>
  );
}
