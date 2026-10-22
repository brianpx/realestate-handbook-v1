'use client';

import { useEffect, useRef, useState } from 'react';
import { captureScrollAnchor, applyScrollAnchor } from '@/lib/scroll-anchor';
import { essentialOnly, quizzesShown, resetProgress, textSize, trackingProgress, useSettings, writeSettings } from '@/lib/state';
import { TEXT_SIZES, type Settings as SettingsShape, type TextSize } from '@/lib/state/schema';
import { ProgressTransfer } from './ProgressTransfer';

const SIZE_LABELS: Record<TextSize, string> = { small: 'Small', medium: 'Medium', large: 'Large' };

export function Settings() {
  const settings = useSettings();
  const [note, setNote] = useState('');
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Mirror theme choices onto <html>; the inline script in layout.tsx did the first paint.
  // systemDark stays null until mounted so server and first client render agree and the class set before paint is kept.
  const [systemDark, setSystemDark] = useState<boolean | null>(null);
  useEffect(() => { setSystemDark(window.matchMedia('(prefers-color-scheme: dark)').matches); }, []);
  const dark = settings.dark ?? systemDark ?? false;
  useEffect(() => {
    if (systemDark !== null) document.documentElement.classList.toggle('dark', dark);
  }, [dark, systemDark]);

  // Until mounted, settings are still the server snapshot. Applying hide-quizzes or wide then
  // would strip the classes the inline script painted; the client snapshot arrives in a later effect.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('hide-quizzes', !quizzesShown(settings));
  }, [mounted, settings]);
  useEffect(() => {
    if (!mounted) return;
    const anchor = captureScrollAnchor();
    document.documentElement.classList.toggle('wide', settings.fullWidth === true);
    applyScrollAnchor(anchor);
  }, [mounted, settings.fullWidth]);

  // Text size is a class on <html> (text-small / text-large; medium has none). The inline script in layout.tsx set it
  // before first paint. Until mounted, settings are still the server default, so applying then would strip that class.
  const size = textSize(settings);
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const anchor = captureScrollAnchor();
    root.classList.toggle('text-small', size === 'small');
    root.classList.toggle('text-large', size === 'large');
    applyScrollAnchor(anchor);
  }, [mounted, size]);

  // Scrolling up folds Settings away. Only real user scrolling counts (wheel, swipe, keys, dragging the scrollbar),
  // so programmatic jumps never collapse it.
  useEffect(() => {
    const details = detailsRef.current;
    const main = document.getElementById('main-content');
    if (!details || !main) return;
    const collapse = () => { details.open = false; };
    const inSidebar = (e: Event) => (e.target as Element | null)?.closest('#sidebar');
    let touchY: number | null = null;
    let dragging = false;
    let lastTop = main.scrollTop;
    const onWheel = (e: WheelEvent) => { if (e.deltaY < 0 && !inSidebar(e)) collapse(); };
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? null; };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      if (touchY !== null && !inSidebar(e) && y - touchY > 10) { collapse(); touchY = y; }
    };
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'PageUp', 'Home'].includes(e.key) && !(e.target as Element).closest('input, textarea, select, #sidebar')) collapse();
    };
    const onPointerDown = (e: PointerEvent) => { dragging = e.target === main; };
    const onPointerUp = () => { dragging = false; };
    const onScroll = () => {
      if (dragging && main.scrollTop < lastTop) collapse();
      lastTop = main.scrollTop;
    };
    document.addEventListener('wheel', onWheel, { passive: true });
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('keydown', onKey);
    main.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('wheel', onWheel);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('keydown', onKey);
      main.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      main.removeEventListener('scroll', onScroll);
    };
  }, []);

  const tracking = trackingProgress(settings);
  // when storage is blocked the write fails and the controlled checkbox simply keeps its old value
  const set = (patch: Partial<SettingsShape>) => writeSettings(patch);

  return (
    <li className="settings-item">
      <details className="settings" ref={detailsRef}>
        <summary>Settings</summary>
        <label className="settings-row">
          <input type="checkbox" id="settingDark" checked={dark} onChange={e => set({ dark: e.target.checked })} />
          <span>Dark mode</span>
        </label>
        <fieldset className="settings-size">
          <legend>Text size</legend>
          {TEXT_SIZES.map(option => (
            <label key={option} className={`settings-size-option size-${option}`}>
              <input type="radio" name="textSize" id={`settingText-${option}`} value={option} checked={size === option} onChange={() => set({ textSize: option })} />
              <span>{SIZE_LABELS[option]}</span>
            </label>
          ))}
        </fieldset>
        <label className="settings-row settings-wide">
          <input type="checkbox" id="settingWide" checked={settings.fullWidth === true} onChange={e => set({ fullWidth: e.target.checked })} />
          <span>Full width</span>
        </label>
        <label className="settings-row">
          <input type="checkbox" id="settingQuiz" checked={quizzesShown(settings)} onChange={e => set({ hideQuizzes: !e.target.checked })} />
          <span>Test your knowledge sections</span>
        </label>
        <label className="settings-row">
          <input type="checkbox" id="settingEssential" checked={essentialOnly(settings)} onChange={e => set({ essentialOnly: e.target.checked })} />
          <span>Essential tools only (the 5 best)</span>
        </label>
        <div className="settings-row">
          <input type="checkbox" id="settingTrack" checked={tracking} onChange={e => { if (set({ trackProgress: e.target.checked })) setNote(''); }} />
          <div className="settings-col">
            <label htmlFor="settingTrack">Keep track of progress</label>
            <div className="settings-sub" id="settingResetGroup" hidden={!tracking}>
              <button type="button" className="btn-mini settings-reset" id="settingReset" onClick={() => setNote(resetProgress() ? 'Progress reset.' : 'Nothing to reset.')}>
                Reset progress
              </button>
              <span className="settings-note" id="settingResetNote" role="status">{note}</span>
            </div>
          </div>
        </div>
        <ProgressTransfer />
      </details>
      <p className="settings-legal">
        <strong>Finding, Keeping, and Nurturing Clients</strong><br />A Practical Guide for New Agents<br />v1.0 · October 2026 · All rights reserved.
      </p>
    </li>
  );
}
