'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { coachStore } from '@/lib/coach';
import { applyImport, exportProgress, readPreviousBackup } from '@/lib/state';
import { describeSummary, parseImport, type ImportResult } from '@/lib/state/transfer';

type Ready = Extract<ImportResult, { ok: true }>;

// Save the progress to a file and bring it back, for a new device or a changed web address. Shown inside Settings.
export function ProgressTransfer() {
  const [note, setNote] = useState('');
  const [previous, setPrevious] = useState(false);
  const [ready, setReady] = useState<Ready | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (note) noteRef.current?.focus(); }, [note]);

  const download = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(exportProgress(coachStore.get()), null, 2)], { type: 'application/json' }));
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
    let result: ImportResult;
    try {
      result = parseImport(await file.text());
    } catch {
      // the file moved or became unreadable between choosing it and reading it
      result = { ok: false, error: 'That file could not be read. Choose it again.' };
    }
    if (fileRef.current) fileRef.current.value = ''; // so choosing the same file again still fires
    if (!result.ok) { setReady(null); setNote(result.error); return; }
    setPrevious(false);
    setReady(result);
    setNote('');
  };

  return (
    <div className="settings-row settings-transfer">
      <div className="settings-col">
        <span className="settings-transfer-title">Move your progress</span>
        <div className="settings-sub">
          <Button type="button" variant="outline" size="sm" id="settingExport" onClick={download}>Download my progress</Button>
          <Button type="button" variant="outline" size="sm" id="settingImport" onClick={() => fileRef.current?.click()}>Restore from a file</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => {
            const backup = readPreviousBackup();
            if (!backup.ok) { setReady(null); setNote(backup.error); return; }
            setPrevious(true); setReady(backup); setNote('');
          }}>Restore previous backup</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden id="settingImportFile" aria-label="Choose a handbook progress file" onChange={e => void choose(e.target.files?.[0])} />
        </div>
        {ready && (
          <div className="settings-confirm" role="group" aria-label="Confirm restoring progress">
            <p className="settings-note">{previous ? 'The previous backup' : 'This file'} has {describeSummary(ready.summary)}. Restoring replaces the progress on this device; what is here now is kept as a backup in this browser.</p>
            <Button
              type="button"
              size="sm"
              id="settingImportConfirm"
              onClick={() => {
                try {
                  const saved = applyImport(ready, coachStore);
                  setReady(null);
                  setNote(saved ? 'Progress restored.' : 'Progress restored for this visit only: your browser would not save it.');
                } catch (error) {
                  setNote(error instanceof Error ? error.message : 'Nothing was restored. Your recovery backup could not be saved.');
                }
              }}
            >
              {previous ? 'Restore this backup' : 'Replace my progress'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setReady(null)}>Cancel</Button>
          </div>
        )}
        <span ref={noteRef} tabIndex={-1} className="settings-note" id="settingTransferNote" role="status">{note}</span>
      </div>
    </div>
  );
}
