'use client';

import { useState } from 'react';
import { fmtDate, parseIso } from '@/lib/dates';
import { downloadIcs } from '@/lib/ics';
import { postCloseEvents, postCloseNote, postCloseSchedule, type PostCloseRows } from '@/lib/plan';
import { setPostClose, useHandbookState, widgetOf } from '@/lib/state';
import { AmountInput } from './AmountInput';
import { InteractiveHeader } from './InteractiveHeader';

export function PostCloseCard({ rows }: { rows: PostCloseRows }) {
  const saved = widgetOf(useHandbookState(), 'postClose');
  const iso = typeof saved.date === 'string' ? saved.date : '';
  const closings = typeof saved.closings === 'number' ? saved.closings : undefined;
  const [who, setWho] = useState(''); // deliberately not saved
  const plan = postCloseSchedule(parseIso(iso), rows);
  return (
    <aside className="box try-it iw">
      <h3 className="box-title">● SCHEDULER · YOUR POST-CLOSE DATES</h3>
      <InteractiveHeader hint="Enter a closing date to see every touch in the first year with its date, then add them to your calendar." widgetKey="postclose-scheduler" label="Post-close scheduler" />
      <div className="planner-controls">
        <label className="cost-field">
          Closing date
          <input type="date" className="calc-input" value={iso} onChange={e => setPostClose({ date: e.target.value })} />
        </label>
        <label className="cost-field">
          Client name (optional, not saved)
          <input type="text" className="calc-input" maxLength={40} value={who} onChange={e => setWho(e.target.value)} />
        </label>
        <label className="cost-field">
          Closings you expect this year
          <AmountInput value={closings} min={1} onValue={n => setPostClose({ closings: n })} />
        </label>
      </div>
      <div className="postclose-result" aria-live="polite">
        {plan.length === 0 ? (
          <p className="calc-empty">Enter a closing date to see your schedule.</p>
        ) : (
          <>
            <ol className="postclose-list">
              {plan.map(p => (
                <li key={p.label} className="postclose-item">
                  <div className="postclose-head"><strong>{fmtDate(p.date)}</strong><span className="nurture-tag">{p.label}</span></div>
                  <div>{p.touch}</div>
                  <div className="postclose-purpose">{p.purpose}</div>
                </li>
              ))}
            </ol>
            <p className="calc-note">After the first year: {rows.Annually!.touch} {rows.Annually!.purpose}</p>
          </>
        )}
      </div>
      <div className="script-actions">
        <button type="button" className="btn-mini" disabled={plan.length === 0} onClick={() => downloadIcs('handbook-post-close-plan.ics', postCloseEvents(plan, who))}>
          Add these touches to my calendar (.ics)
        </button>
      </div>
      <p className="calc-note">{postCloseNote(closings)}</p>
    </aside>
  );
}
