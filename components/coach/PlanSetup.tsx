'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { applyPlan, useCoachState } from '@/lib/coach';
import { PACES, buildPlan, reflow, type Pace, type PlanInput } from '@/lib/coach/plan';
import { formatDay, warningText } from '@/lib/coach/today';

const PACE_OPTIONS: { value: Pace; label: string; detail: string }[] = [
  { value: 'sprint', label: '2-week sprint', detail: 'Nearly every day.' },
  { value: 'default', label: '4-week plan', detail: 'Recommended.' },
  { value: 'relaxed', label: '8-week, relaxed', detail: 'A couple of days a week.' },
];
// Monday first; the numbers are JavaScript weekdays (0 = Sunday).
const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' }, { value: 3, label: 'Wed' }, { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' }, { value: 6, label: 'Sat' }, { value: 0, label: 'Sun' },
];
const isPace = (value: unknown): value is Pace => typeof value === 'string' && value in PACES;
// A real <button> carries the id, so the label's htmlFor and tests reach the control itself (see Settings).
const AS_BUTTON = { nativeButton: true, render: <button type="button" /> } as const;

// One setting per row, label and help on the left and the control on the right (shadcnuikit's form-layout9).
function Row({ id, title, description, children }: { id?: string; title: string; description: string; children: ReactNode }) {
  return (
    <Field className="grid gap-3 py-5 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8">
      <FieldContent className="gap-0.5">
        {id ? <FieldLabel htmlFor={id}>{title}</FieldLabel> : <FieldTitle>{title}</FieldTitle>}
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <div className="flex min-w-0 flex-col gap-2">{children}</div>
    </Field>
  );
}

// Start the plan, or change the pace and study days of the one in progress. Shows the dates it would produce, and any
// warning, before anything is saved.
export function PlanSetup({ today, tz, onDone }: { today: string; tz: string; onDone: () => void }) {
  const { plan: existing, completions } = useCoachState();
  const editing = existing !== undefined && existing.sessions.length > 0;
  const [startDate, setStartDate] = useState(existing?.startDate ?? today);
  const [pace, setPace] = useState<Pace>(existing?.pace ?? 'default');
  const [studyDays, setStudyDays] = useState<number[]>(existing?.studyDays ?? [1, 2, 3, 4, 5]);

  const input: PlanInput = { startDate, pace, studyDays };
  const preview = useMemo(() => {
    if (studyDays.length === 0 || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null;
    return editing ? reflow(input, existing.sessions, completions, today) : buildPlan(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, pace, studyDays, editing, existing?.sessions, completions, today]);

  const toggleDay = (day: number, on: boolean) => setStudyDays(d => (on ? (d.includes(day) ? d : [...d, day]) : d.filter(x => x !== day)));

  return (
    <Card className="plan-setup gap-0 py-0 shadow-none">
      <CardHeader className="border-b py-5">
        <CardTitle>{editing ? 'Change your plan' : 'Start your reading plan'}</CardTitle>
        <CardDescription>One chapter per session: read it, do its exercise, then answer its questions. {editing ? 'Sessions you have finished stay where they are.' : ''}</CardDescription>
      </CardHeader>
      <form
        className="contents"
        onSubmit={e => {
          e.preventDefault();
          if (!preview) return;
          applyPlan({ ...input, tz }, today);
          onDone();
        }}
      >
        <CardContent className="py-5">
          <div className="divide-y divide-dashed">
            {!editing && (
              <Row id="planStart" title="Start date" description="The first session is on this day or the next study day after it.">
                <Input type="date" id="planStart" value={startDate} min={today} onChange={e => setStartDate(e.target.value)} required className="max-w-xs" />
              </Row>
            )}

            <Row title="How fast?" description={`This pace needs up to ${PACES[pace].perWeek} study days a week.`}>
              <RadioGroup name="pace" value={pace} onValueChange={value => { if (isPace(value)) setPace(value); }} className="gap-3">
                {PACE_OPTIONS.map(o => (
                  <Field key={o.value} orientation="horizontal">
                    <RadioGroupItem value={o.value} id={`planPace-${o.value}`} {...AS_BUTTON} />
                    <FieldContent className="gap-0.5">
                      <FieldLabel htmlFor={`planPace-${o.value}`}>{o.label}</FieldLabel>
                      <FieldDescription>{o.detail}</FieldDescription>
                    </FieldContent>
                  </Field>
                ))}
              </RadioGroup>
            </Row>

            <Row title="Which days can you study?" description="Sessions land only on the days you tick.">
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {DAYS.map(d => (
                  <Field key={d.value} orientation="horizontal" className="w-auto">
                    <Checkbox id={`planDay-${d.value}`} checked={studyDays.includes(d.value)} onCheckedChange={checked => toggleDay(d.value, checked === true)} {...AS_BUTTON} />
                    <FieldLabel htmlFor={`planDay-${d.value}`}>{d.label}</FieldLabel>
                  </Field>
                ))}
              </div>
            </Row>

            <Row title="Your schedule" description="What these choices add up to. Nothing is saved until you confirm below.">
              <div aria-live="polite" className="text-sm">
                {!preview && <p className="text-muted-foreground m-0">Choose at least one study day to see your schedule.</p>}
                {preview && (
                  <>
                    <p className="m-0">
                      {preview.sessions.length} sessions, {formatDay(preview.sessions[0]!.date)} to <strong>{formatDay(preview.endDate)}</strong>.
                    </p>
                    {preview.warnings.map(w => <p key={w.code} className="mt-2 mb-0"><strong>Heads up:</strong> {warningText(w)}</p>)}
                  </>
                )}
              </div>
            </Row>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/50 flex-col items-stretch gap-3 border-t py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground m-0 text-sm">
            {PACE_OPTIONS.find(o => o.value === pace)?.label} · {studyDays.length} {studyDays.length === 1 ? 'study day' : 'study days'} a week
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {editing && <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>}
            <Button type="submit" disabled={!preview}>{editing ? 'Save changes' : 'Start my plan'}</Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
