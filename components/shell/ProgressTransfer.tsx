'use client';

import { useRef, useState } from 'react';
import { applyImport, exportProgress } from '@/lib/state';
import { describeSummary, parseImport, type ImportResult } from '@/lib/state/transfer';

type Ready = Extract<ImportResult, { ok: true }>;

// Save the progress to a file and bring it back, for a new device or a changed web address. Shown inside Settings.
export function ProgressTransfer() {
  const [note, setNote] = useState('');
  const [ready, setReady] = useState<Ready | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(exportProgress(), null, 2)], { type: 'application/json' }));
    link.download = `handbook-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setReady(null);
    setNote('Progress downloaded.');
  };

  const choose = async (file: File | undefined) => {
    if (!file) return;
    const result = parseImport(await file.text());
    if (fileRef.current) fileRef.current.value = ''; // so choosing the same file again still fires
    if (!result.ok) { setReady(null); setNote(result.error); return; }
    setReady(result);
    setNote('');
  };

  return (
    <div className="settings-row settings-transfer">
      <div className="settings-col">
        <span className="settings-transfer-title">Move your progress</span>
        <div className="settings-sub">
          <button type="button" className="btn-mini" id="settingExport" onClick={download}>Download my progress</button>
          <button type="button" className="btn-mini" id="settingImport" onClick={() => fileRef.current?.click()}>Restore from a file</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden id="settingImportFile" aria-label="Choose a handbook progress file" onChange={e => void choose(e.target.files?.[0])} />
        </div>
        {ready && (
          <div className="settings-confirm" role="group" aria-label="Confirm restoring progress">
            <p className="settings-note">This file has {describeSummary(ready.summary)}. Restoring replaces the progress on this device; what is here now is kept as a backup in this browser.</p>
            <button
              type="button"
              className="btn-mini"
              id="settingImportConfirm"
              onClick={() => { const saved = applyImport(ready); setReady(null); setNote(saved ? 'Progress restored.' : 'Progress restored for this visit only: your browser would not save it.'); }}
            >
              Replace my progress
            </button>
            <button type="button" className="btn-mini" onClick={() => setReady(null)}>Cancel</button>
          </div>
        )}
        <span className="settings-note" id="settingTransferNote" role="status">{note}</span>
      </div>
    </div>
  );
}
