'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProgressTransfer } from '@/components/shell/ProgressTransfer';
import { describeSummary, summarizeState } from '@/lib/state/transfer';
import { trackingProgress, useHandbookState, useSettings } from '@/lib/state';

type Storage = 'checking' | 'ok' | 'blocked';

// Writes and removes one throwaway key, which is the only honest test of whether this browser will keep progress.
function checkStorage(): Storage {
  try {
    const key = '__handbook_storage_check__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return 'ok';
  } catch {
    return 'blocked';
  }
}

export function SavedProgress() {
  const state = useHandbookState();
  const tracking = trackingProgress(useSettings());
  const [storage, setStorage] = useState<Storage>('checking');
  useEffect(() => setStorage(checkStorage()), []);
  const summary = summarizeState(state);
  const empty = summary.chaptersRead + summary.checklistTicks + summary.scorecardEntries + summary.tools + summary.checkpointAnswers === 0;

  return (
    <>
      <h2 className="hb-h2" id="progress">Saved progress on this device</h2>
      {storage === 'blocked' && (
        <p className="setup-error" role="alert">This browser is blocking storage, so nothing you do can be remembered after you leave. A private window or a privacy setting is the usual cause. Download a progress file before you close the page.</p>
      )}
      {storage === 'ok' && <p role="status">Saving works in this browser.</p>}
      <p>{empty ? 'Nothing is saved on this device yet.' : `This device holds ${describeSummary(summary)}.`}</p>
      {!tracking && <p>Reading progress tracking is switched off in Settings; the other entries are still saved.</p>}
      <p className="setup-hint">The data is in this browser only. It is not on a server, so it cannot be seen or recovered by anyone else, and it does not sync to your other devices.</p>
      <h2 className="hb-h2" id="backup">Back up and restore</h2>
      <p>Download a file of everything above, and restore it on this or another device or browser. Restoring replaces what is there now; the previous copy is kept as a backup in the same browser.</p>
      <ProgressTransfer />
      <p className="setup-hint">More on <Link href="/support#backup">backup and restore</Link> and <Link href="/support#devices">devices and browsers</Link>.</p>
    </>
  );
}
