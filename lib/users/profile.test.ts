import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE, JURISDICTION_LABELS, JURISDICTIONS, lastLicenseYear, profileFields, profileInputSchema } from './profile';

const NOW = new Date('2026-11-08T12:00:00Z');
const schema = profileInputSchema(NOW);
const FULL = {
  professionalRole: 'agent',
  brokerageName: '  Example Realty ',
  teamName: 'The A Team',
  licenseJurisdiction: 'TX',
  licenseNumber: 'TX-0123456',
  licenseStatus: 'active',
  yearFirstLicensed: 2025,
  primaryMarketCity: 'Austin',
  primaryMarketState: 'TX',
  phone: '+15125550123',
  narMember: true,
  narMemberSince: '2025-03-01',
};

describe('profileInputSchema', () => {
  it('accepts a full form, trimming the text', () => {
    const parsed = schema.safeParse(FULL);
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({ ...FULL, brokerageName: 'Example Realty' });
  });
  it('turns an empty box, a missing field and null all into null, so every field is optional', () => {
    const parsed = schema.safeParse({ professionalRole: '', brokerageName: '   ', teamName: null, yearFirstLicensed: '', narMember: null, narMemberSince: '' });
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual(EMPTY_PROFILE);
    expect(schema.safeParse({}).data).toEqual(EMPTY_PROFILE);
  });
  it.each([
    ['an unknown role', { professionalRole: 'ceo' }, 'professionalRole'],
    ['a jurisdiction that is not a code', { licenseJurisdiction: 'Texas' }, 'licenseJurisdiction'],
    ['a market state that is not a code', { primaryMarketState: 'tx' }, 'primaryMarketState'],
    ['an unknown license status', { licenseStatus: 'revoked' }, 'licenseStatus'],
    ['a brokerage name over 200 characters', { brokerageName: 'x'.repeat(201) }, 'brokerageName'],
    ['a license number over 50 characters', { licenseNumber: 'x'.repeat(51) }, 'licenseNumber'],
    ['a year before 1950', { yearFirstLicensed: 1949 }, 'yearFirstLicensed'],
    ['a year after next year', { yearFirstLicensed: lastLicenseYear(NOW) + 1 }, 'yearFirstLicensed'],
    ['a year that is not a whole number', { yearFirstLicensed: 2020.5 }, 'yearFirstLicensed'],
    ['a year sent as text', { yearFirstLicensed: '2020' }, 'yearFirstLicensed'],
    ['a phone with spaces or no country code', { phone: '512 555 0123' }, 'phone'],
    ['a phone that is only a plus', { phone: '+' }, 'phone'],
    ['a membership answer that is not a boolean', { narMember: 'yes' }, 'narMember'],
    ['a membership date that is not a calendar date', { narMemberSince: '2025-13-01' }, 'narMemberSince'],
    ['a membership date with a time on it', { narMemberSince: '2025-03-01T00:00:00Z' }, 'narMemberSince'],
  ])('refuses %s and names the field', (_, body, field) => {
    const parsed = schema.safeParse(body);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map(i => i.path[0])).toEqual([field]);
  });
  it('allows next year as the first license year, as the table does', () => {
    expect(schema.safeParse({ yearFirstLicensed: 2027 }).success).toBe(true);
    expect(lastLicenseYear(new Date('2030-12-31T23:59:59Z'))).toBe(2031);
  });
});

describe('the choice lists', () => {
  it('give every jurisdiction a label and end with "other"', () => {
    for (const j of JURISDICTIONS) expect(JURISDICTION_LABELS[j]).toBeTruthy();
    expect(JURISDICTIONS).toHaveLength(57); // 50 states, DC, 5 territories, other
    expect(JURISDICTIONS.at(-1)).toBe('other');
  });
  it('profileFields keeps the editable columns and nothing else', () => {
    const extra = { ...EMPTY_PROFILE, phone: '+15125550123', userId: 'u', profileSource: 'user', updatedAt: NOW };
    expect(profileFields(extra)).toEqual({ ...EMPTY_PROFILE, phone: '+15125550123' });
  });
});
