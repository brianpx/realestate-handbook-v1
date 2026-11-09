'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { captureScrollAnchor, applyScrollAnchor } from '@/lib/scroll-anchor';
import { essentialOnly, quizzesShown, resetProgress, textSize, trackingProgress, useSettings, writeSettings } from '@/lib/state';
import { TEXT_SIZES, type Settings as SettingsShape, type TextSize } from '@/lib/state/schema';
import { ProgressTransfer } from './ProgressTransfer';

const SIZE_LABELS: Record<TextSize, string> = { small: 'Small', medium: 'Medium', large: 'Large' };
const isTextSize = (value: unknown): value is TextSize => typeof value === 'string' && (TEXT_SIZES as readonly string[]).includes(value);
// Settings rows read at the sidebar's size, not the form default.
const ROW_LABEL = 'text-base font-normal leading-snug';
// Base UI puts the id on a hidden input unless the control is a native button; the ids here are what labels, the
// e2e checks and the static site's selectors point at, so every control is a real <button>.
const AS_BUTTON = { nativeButton: true, render: <button type="button" /> } as const;

export function Settings() {
  const settings = useSettings();
  const [note, setNote] = useState('');
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Mirror theme choices onto <html>; the inline script in layout.tsx did the first paint.
  // systemDark stays null until mounted so server and first client render agree and the class set before paint is kept.
  // It then tracks the system scheme, so a reader who never chose a theme follows a change without reloading.
  const [systemDark, setSystemDark] = useState<boolean | null>(null);
  useEffect(() => {
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(scheme.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    scheme.addEventListener('change', onChange);
    return () => scheme.removeEventListener('change', onChange);
  }, []);
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
  // so programmatic jumps never collapse it, and never while a control inside has focus (folding would drop it).
  // The summary itself stays visible through a fold, so focus on it does not hold the panel open.
  useEffect(() => {
    const details = detailsRef.current;
    const main = document.getElementById('main-content');
    if (!details || !main) return;
    const summary = details.querySelector('summary');
    const collapse = () => {
      const active = document.activeElement;
      if (details.contains(active) && active !== summary) return;
      details.open = false;
    };
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
  // when storage is blocked the write fails and the controlled switch simply keeps its old value
  const set = (patch: Partial<SettingsShape>) => writeSettings(patch);

  // One on/off setting: a switch with its label beside it, the shadcn form-layout row at the sidebar's width.
  const toggle = (id: string, label: string, checked: boolean, onChange: (checked: boolean) => void, className = '') => (
    <Field orientation="horizontal" className={`settings-row ${className}`.trim()}>
      <Switch id={id} checked={checked} onCheckedChange={onChange} {...AS_BUTTON} />
      <FieldLabel htmlFor={id} className={ROW_LABEL}>{label}</FieldLabel>
    </Field>
  );

  return (
    <li className="settings-item">
      <details className="settings" ref={detailsRef}>
        <summary>Settings</summary>
        {toggle('settingDark', 'Dark mode', dark, checked => set({ dark: checked }))}
        <FieldSet className="settings-size">
          <FieldLegend variant="label" className={ROW_LABEL}>Text size</FieldLegend>
          <RadioGroup name="textSize" value={size} onValueChange={value => { if (isTextSize(value)) set({ textSize: value }); }} className="gap-2">
            {TEXT_SIZES.map(option => (
              <Field key={option} orientation="horizontal" className={`settings-size-option size-${option}`}>
                <RadioGroupItem value={option} id={`settingText-${option}`} {...AS_BUTTON} />
                <FieldLabel htmlFor={`settingText-${option}`} className={ROW_LABEL}><span>{SIZE_LABELS[option]}</span></FieldLabel>
              </Field>
            ))}
          </RadioGroup>
        </FieldSet>
        {toggle('settingWide', 'Full width', settings.fullWidth === true, checked => set({ fullWidth: checked }), 'settings-wide')}
        {toggle('settingQuiz', 'Test your knowledge sections', quizzesShown(settings), checked => set({ hideQuizzes: !checked }))}
        {toggle('settingEssential', 'Essential tools only (the 5 best)', essentialOnly(settings), checked => set({ essentialOnly: checked }))}
        <Field orientation="horizontal" className="settings-row">
          <Switch id="settingTrack" checked={tracking} onCheckedChange={checked => { if (set({ trackProgress: checked })) setNote(''); }} {...AS_BUTTON} />
          <div className="settings-col">
            <FieldLabel htmlFor="settingTrack" className={ROW_LABEL}>Keep track of progress</FieldLabel>
            <div className="settings-sub" id="settingResetGroup" hidden={!tracking}>
              <Button type="button" variant="outline" size="sm" className="settings-reset" id="settingReset" onClick={() => setNote(resetProgress() ? 'Progress reset.' : 'Nothing to reset.')}>
                Reset progress
              </Button>
              <span className="settings-note" id="settingResetNote" role="status">{note}</span>
            </div>
          </div>
        </Field>
        <ProgressTransfer />
      </details>
      <p className="settings-legal">
        <strong>Finding, Nurturing, and Keeping Clients</strong><br />A Practical Guide for New Real Estate Agents<br />v1.0 · October 2026 · All rights reserved.
      </p>
    </li>
  );
}
