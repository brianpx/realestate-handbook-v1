'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  FIRST_LICENSE_YEAR,
  JURISDICTION_LABELS,
  JURISDICTIONS,
  LICENSE_STATUS_LABELS,
  LICENSE_STATUSES,
  PROFESSIONAL_ROLE_LABELS,
  PROFESSIONAL_ROLES,
  type ProfileField,
  type ProfileFields,
} from '@/lib/users/profile';

const GENERIC_ERROR = 'Something went wrong. Please try again in a moment.';
const LABELS: Record<ProfileField, string> = {
  professionalRole: 'Your role',
  brokerageName: 'Brokerage',
  teamName: 'Team',
  licenseJurisdiction: 'Licensed in',
  licenseNumber: 'Licence number',
  licenseStatus: 'Licence status',
  yearFirstLicensed: 'Year first licensed',
  primaryMarketCity: 'Main market: city',
  primaryMarketState: 'Main market: state',
  phone: 'Phone',
  narMember: 'REALTOR® association member',
  narMemberSince: 'Member since',
};
const FIELDS = Object.keys(LABELS) as ProfileField[];

/** What the boxes hold: every field a string, '' for empty; the choices are the stored codes, `narMember` is '', 'yes' or 'no'. */
type Values = Record<ProfileField, string>;
type State = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; at: string } | { kind: 'error'; message: string; fields: ProfileField[] };

const toValues = (p: ProfileFields): Values => ({
  professionalRole: p.professionalRole ?? '',
  brokerageName: p.brokerageName ?? '',
  teamName: p.teamName ?? '',
  licenseJurisdiction: p.licenseJurisdiction ?? '',
  licenseNumber: p.licenseNumber ?? '',
  licenseStatus: p.licenseStatus ?? '',
  yearFirstLicensed: p.yearFirstLicensed === null ? '' : String(p.yearFirstLicensed),
  primaryMarketCity: p.primaryMarketCity ?? '',
  primaryMarketState: p.primaryMarketState ?? '',
  phone: p.phone ?? '',
  narMember: p.narMember === null ? '' : p.narMember ? 'yes' : 'no',
  narMemberSince: p.narMemberSince ?? '',
});

// The body the route checks: strings go as typed (the server trims and turns '' into null); the year and the
// membership answer are given their real types, and a year that is not a number goes as typed so the server names
// the field rather than this code guessing.
const toBody = (v: Values): Record<ProfileField, unknown> => ({
  ...v,
  yearFirstLicensed: v.yearFirstLicensed.trim() === '' ? null : /^\d+$/.test(v.yearFirstLicensed.trim()) ? Number(v.yearFirstLicensed) : v.yearFirstLicensed,
  narMember: v.narMember === '' ? null : v.narMember === 'yes',
});

const isField = (name: unknown): name is ProfileField => typeof name === 'string' && FIELDS.includes(name as ProfileField);
const moment = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

type Props = { initial: ProfileFields; updatedAt: string | null };

// The account page's profile form: the editable columns of the realtor profile, saved whole with one PUT to
// /api/account/profile, which stores them against the signed-in reader. Every field is optional. Rendered with the
// server's values, so nothing is fetched on load; the button is disabled until hydration so an early Enter cannot
// submit the boxes as a page query.
export function ProfileForm({ initial, updatedAt }: Props) {
  const [values, setValues] = useState<Values>(() => toValues(initial));
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [savedAt, setSavedAt] = useState(updatedAt);
  const [ready, setReady] = useState(false);
  const busy = useRef(false);
  const noteRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => setReady(true), []);
  // the outcome is announced where the reader is looking, below the button
  useEffect(() => { if (state.kind === 'saved' || state.kind === 'error') noteRef.current?.focus(); }, [state]);

  const set = (field: ProfileField, value: string) => setValues(v => ({ ...v, [field]: value }));
  const fail = (message: string, fields: ProfileField[] = []) => setState({ kind: 'error', message, fields });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setState({ kind: 'saving' });
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(toBody(values)),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; fields?: unknown; profile?: ProfileFields; updatedAt?: string | null };
      if (res.ok && body.profile) {
        setValues(toValues(body.profile));
        setSavedAt(body.updatedAt ?? null);
        setState({ kind: 'saved', at: body.updatedAt ?? '' });
        return;
      }
      if (res.status === 400 && body.error === 'invalid_profile') {
        const fields = Array.isArray(body.fields) ? body.fields.filter(isField) : [];
        fail(fields.length ? `Please check: ${fields.map(f => LABELS[f]).join(', ')}.` : 'Please check the form and try again.', fields);
      } else if (res.status === 401) fail('Your sign-in has ended. Sign in again, then come back to this page.');
      else if (res.status === 503) fail('Saving is not available right now. Please try again later.');
      else fail(GENERIC_ERROR);
    } catch {
      fail(GENERIC_ERROR);
    } finally {
      busy.current = false;
    }
  };

  const error = state.kind === 'error' ? state : null;
  const invalid = (field: ProfileField) => (error?.fields.includes(field) ? true : undefined);
  const id = (field: ProfileField) => `profile-${field}`;
  const textInput = (field: ProfileField, extra: Partial<React.ComponentProps<'input'>> = {}) => (
    <div className="profile-field">
      <label htmlFor={id(field)}>{LABELS[field]}</label>
      <input id={id(field)} name={field} className="account-input" type="text" value={values[field]} onChange={e => set(field, e.target.value)} aria-invalid={invalid(field)} {...extra} />
    </div>
  );
  const select = (field: ProfileField, options: readonly string[], labels: Record<string, string>, none = 'Not given') => (
    <div className="profile-field">
      <label htmlFor={id(field)}>{LABELS[field]}</label>
      <select id={id(field)} name={field} className="account-input" value={values[field]} onChange={e => set(field, e.target.value)} aria-invalid={invalid(field)}>
        <option value="">{none}</option>
        {options.map(o => <option key={o} value={o}>{labels[o]}</option>)}
      </select>
    </div>
  );

  return (
    <form className="account-form profile-form" noValidate onSubmit={submit} data-profile-form data-ready={ready || undefined} aria-describedby={error ? 'profile-error' : undefined}>
      {select('professionalRole', PROFESSIONAL_ROLES, PROFESSIONAL_ROLE_LABELS)}
      {textInput('brokerageName', { autoComplete: 'organization', maxLength: 200 })}
      {textInput('teamName', { maxLength: 200 })}
      {select('licenseJurisdiction', JURISDICTIONS, JURISDICTION_LABELS)}
      {textInput('licenseNumber', { autoComplete: 'off', maxLength: 50 })}
      {select('licenseStatus', LICENSE_STATUSES, LICENSE_STATUS_LABELS)}
      {textInput('yearFirstLicensed', { inputMode: 'numeric', min: FIRST_LICENSE_YEAR, maxLength: 4, placeholder: 'YYYY' })}
      {textInput('primaryMarketCity', { autoComplete: 'address-level2', maxLength: 100 })}
      {select('primaryMarketState', JURISDICTIONS, JURISDICTION_LABELS)}
      {textInput('phone', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', maxLength: 20, placeholder: '+12025550123' })}
      {select('narMember', ['yes', 'no'], { yes: 'Yes', no: 'No' }, 'Not said')}
      {textInput('narMemberSince', { type: 'date' })}
      <button type="submit" className="btn-nav btn-secondary" disabled={!ready || state.kind === 'saving'}>{state.kind === 'saving' ? 'Saving…' : 'Save profile'}</button>
      {error && <p ref={noteRef} tabIndex={-1} className="setup-error" id="profile-error" role="alert">{error.message}</p>}
      {state.kind === 'saved' && <p ref={noteRef} tabIndex={-1} className="setup-hint" role="status">Saved.</p>}
      <span className="setup-hint">{savedAt ? `Last saved ${moment.format(new Date(savedAt))} UTC.` : 'Nothing saved yet.'} Every field is optional; a blank one is cleared when you save.</span>
    </form>
  );
}
