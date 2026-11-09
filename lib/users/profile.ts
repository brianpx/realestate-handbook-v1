import { z } from '@/lib/zod';

// The realtor profile (db/migrations/006_realtor_profiles.sql): the columns the account page's form edits, every one
// optional, plus the row's provenance. No server imports here: the form (a client component) reads the choice lists.
// The verification pair, the survey columns and the deferred ones (website, service areas, specialties, learning
// goals) are not in this type; nothing in the app writes them yet.

export const PROFESSIONAL_ROLES = ['agent', 'broker', 'team_lead', 'assistant', 'student', 'other'] as const;
export type ProfessionalRole = (typeof PROFESSIONAL_ROLES)[number];
export const PROFESSIONAL_ROLE_LABELS: Record<ProfessionalRole, string> = {
  agent: 'Agent',
  broker: 'Broker',
  team_lead: 'Team lead',
  assistant: 'Assistant',
  student: 'Student or pre-licensing',
  other: 'Other',
};

export const LICENSE_STATUSES = ['pending', 'active', 'inactive', 'expired', 'unknown'] as const;
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];
export const LICENSE_STATUS_LABELS: Record<LicenseStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  inactive: 'Inactive',
  expired: 'Expired',
  unknown: 'Not sure',
};

/** US states, the District, the inhabited territories, and 'other' for a licence held anywhere else. */
export const JURISDICTIONS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'AS', 'GU', 'MP', 'PR', 'VI', 'other',
] as const;
export type Jurisdiction = (typeof JURISDICTIONS)[number];
export const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  AS: 'American Samoa', GU: 'Guam', MP: 'Northern Mariana Islands', PR: 'Puerto Rico', VI: 'U.S. Virgin Islands',
  other: 'Outside the United States',
};

export const PROFILE_SOURCES = ['survey', 'user', 'admin'] as const;
export type ProfileSource = (typeof PROFILE_SOURCES)[number];

export const FIRST_LICENSE_YEAR = 1950;
/** The latest year a licence may date from: next year, as the table's check allows (a licence issued in December for January). */
export const lastLicenseYear = (now: Date): number => now.getUTCFullYear() + 1;

/** The editable columns, as the form and the store see them; null is "not given". `narMemberSince` is a YYYY-MM-DD date. */
export type ProfileFields = {
  professionalRole: ProfessionalRole | null;
  brokerageName: string | null;
  teamName: string | null;
  licenseJurisdiction: Jurisdiction | null;
  licenseNumber: string | null;
  licenseStatus: LicenseStatus | null;
  yearFirstLicensed: number | null;
  primaryMarketCity: string | null;
  primaryMarketState: Jurisdiction | null;
  phone: string | null;
  narMember: boolean | null;
  narMemberSince: string | null;
};
export type ProfileField = keyof ProfileFields;

/** One row of `realtor_profiles` as the app reads it: the editable fields with their provenance. */
export type Profile = ProfileFields & { userId: string; profileSource: ProfileSource; updatedAt: Date };

export const EMPTY_PROFILE: ProfileFields = {
  professionalRole: null,
  brokerageName: null,
  teamName: null,
  licenseJurisdiction: null,
  licenseNumber: null,
  licenseStatus: null,
  yearFirstLicensed: null,
  primaryMarketCity: null,
  primaryMarketState: null,
  phone: null,
  narMember: null,
  narMemberSince: null,
};

/** The editable fields of a profile, without its provenance: what the form holds and the API answers. */
export const profileFields = (p: ProfileFields): ProfileFields => ({
  professionalRole: p.professionalRole,
  brokerageName: p.brokerageName,
  teamName: p.teamName,
  licenseJurisdiction: p.licenseJurisdiction,
  licenseNumber: p.licenseNumber,
  licenseStatus: p.licenseStatus,
  yearFirstLicensed: p.yearFirstLicensed,
  primaryMarketCity: p.primaryMarketCity,
  primaryMarketState: p.primaryMarketState,
  phone: p.phone,
  narMember: p.narMember,
  narMemberSince: p.narMemberSince,
});

// The form sends every field, with '' for an empty box and null for an unmade choice; both become null here, so a
// save always writes the whole row. Limits mirror the table's checks; the phone shape is E.164 (plus, then digits).
const blankToNull = <T>(value: T | '' | null | undefined): T | null => (value === '' || value === null || value === undefined ? null : value);
const text = (max: number) => z.string().trim().max(max).nullish().transform(blankToNull);
const choice = <const T extends readonly [string, ...string[]]>(values: T) => z.enum(values).or(z.literal('')).nullish().transform(blankToNull);
const E164 = /^\+[1-9]\d{1,14}$/;

/** The profile form's body, checked at the boundary. Built per request because the latest licence year moves with the clock. */
export const profileInputSchema = (now: Date) =>
  z.object({
    professionalRole: choice(PROFESSIONAL_ROLES),
    brokerageName: text(200),
    teamName: text(200),
    licenseJurisdiction: choice(JURISDICTIONS),
    licenseNumber: text(50),
    licenseStatus: choice(LICENSE_STATUSES),
    yearFirstLicensed: z.number().int().min(FIRST_LICENSE_YEAR).max(lastLicenseYear(now)).or(z.literal('')).nullish().transform(blankToNull),
    primaryMarketCity: text(100),
    primaryMarketState: choice(JURISDICTIONS),
    phone: z.string().trim().max(20).regex(E164, 'an international number, like +12025550123').or(z.literal('')).nullish().transform(blankToNull),
    narMember: z.boolean().nullish().transform(blankToNull),
    narMemberSince: z.iso.date().or(z.literal('')).nullish().transform(blankToNull),
  });
export type ProfileInput = z.infer<ReturnType<typeof profileInputSchema>>;
