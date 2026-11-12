import { describe, expect, it } from 'vitest';
import { COUNTRY_CODES, COUNTRY_NAMES, isCountryCode } from './billing-countries';
import { billingInfoInputSchema, TAX_ID_TYPES, US_REGIONS, type TaxIdType } from './billing-info';

const parse = (input: unknown) => billingInfoInputSchema.safeParse(input);
const ok = (input: unknown) => {
  const result = parse(input);
  if (!result.success) throw new Error(`rejected: ${result.error.issues.map(i => i.path.join('.')).join(',')}`);
  return result.data;
};
const rejectedFields = (input: unknown) => {
  const result = parse(input);
  return result.success ? null : [...new Set(result.error.issues.map(i => String(i.path[0] ?? '')))];
};
const ADDRESS = { addressCountry: 'US', addressLine1: '1 Main St', addressLine2: '', addressCity: 'Austin', addressRegion: 'TX', addressPostalCode: '78701' };

describe('the country list', () => {
  it('has the 249 ISO 3166-1 alpha-2 codes, each with a name', () => {
    expect(COUNTRY_CODES).toHaveLength(249);
    expect(COUNTRY_CODES.every(code => /^[A-Z]{2}$/.test(code) && COUNTRY_NAMES[code])).toBe(true);
    expect(new Set(Object.values(COUNTRY_NAMES)).size).toBe(249);
    expect(isCountryCode('US') && isCountryCode('GB') && isCountryCode('IN')).toBe(true);
    expect(isCountryCode('XX') || isCountryCode('us') || isCountryCode('toString')).toBe(false);
  });
});

describe('the billing input', () => {
  it('trims, turns a blank into null, and keeps only the fields it names', () => {
    expect(ok({ companyName: '  Example Realty LLC ' })).toEqual({ companyName: 'Example Realty LLC' });
    expect(ok({ companyName: '   ' })).toEqual({ companyName: null });
    expect(ok({ purchaseOrder: ' PO-1 ' })).toEqual({ purchaseOrder: 'PO-1' });
    expect(ok({ invoiceLanguage: 'en' })).toEqual({ invoiceLanguage: 'en' });
  });
  it('refuses an empty body, an unknown key, an account id and a non-object', () => {
    for (const body of [{}, { companyName: 'A', userId: 'u' }, { company: 'A' }, { companyName: 7 }, { companyName: null }, [], 'x', null]) expect(parse(body).success).toBe(false);
  });
  it('limits the lengths', () => {
    expect(parse({ companyName: 'x'.repeat(64) }).success).toBe(true);
    expect(rejectedFields({ companyName: 'x'.repeat(65) })).toEqual(['companyName']);
    expect(parse({ purchaseOrder: 'x'.repeat(64) }).success).toBe(true);
    expect(rejectedFields({ purchaseOrder: 'x'.repeat(65) })).toEqual(['purchaseOrder']);
    expect(parse({ invoiceEmail: `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(61)}.com` }).success).toBe(false);
  });
  it('rejects control and format characters in every text field', () => {
    for (const bad of ['a\u0000b', 'a‮b', 'a\nb', 'a​b']) {
      for (const field of ['companyName', 'purchaseOrder', 'addressLine1', 'addressCity']) {
        const body = field.startsWith('address') ? { ...ADDRESS, [field]: bad } : { [field]: bad };
        expect(rejectedFields(body), `${field} ${JSON.stringify(bad)}`).toEqual([field]);
      }
      expect(rejectedFields({ ...ADDRESS, addressCountry: 'DE', addressRegion: bad })).toEqual(['addressRegion']);
      expect(rejectedFields({ taxIdType: 'other', taxIdValue: bad })).toEqual(['taxIdValue']);
      expect(rejectedFields({ invoiceEmail: bad })).toEqual(['invoiceEmail']);
    }
  });

  describe('the invoice email', () => {
    it('is lower-cased, and blank means use the account address', () => {
      expect(ok({ invoiceEmail: ' Billing@Example.COM ' })).toEqual({ invoiceEmail: 'billing@example.com' });
      expect(ok({ invoiceEmail: '' })).toEqual({ invoiceEmail: null });
    });
    it('must be an address', () => {
      for (const bad of ['nope', 'a@', '@b.co', 'a b@c.co']) expect(rejectedFields({ invoiceEmail: bad })).toEqual(['invoiceEmail']);
    });
  });

  describe('the address', () => {
    it('is saved whole, with blanks as null', () => {
      expect(ok(ADDRESS)).toEqual({ ...ADDRESS, addressLine2: null });
      expect(ok({ addressCountry: '', addressLine1: '', addressLine2: '', addressCity: '', addressRegion: '', addressPostalCode: '' })).toEqual({ addressCountry: null, addressLine1: null, addressLine2: null, addressCity: null, addressRegion: null, addressPostalCode: null });
    });
    it('arrives together: naming one field of the card without the rest is refused', () => {
      expect(rejectedFields({ addressCity: 'Austin' })).toEqual(['addressCountry', 'addressLine1', 'addressLine2', 'addressRegion', 'addressPostalCode']);
    });
    it('needs a country from the list once anything else is given', () => {
      expect(rejectedFields({ ...ADDRESS, addressCountry: '' })).toEqual(['addressCountry']);
      expect(rejectedFields({ ...ADDRESS, addressCountry: 'XX' })).toEqual(['addressCountry']);
      expect(rejectedFields({ ...ADDRESS, addressCountry: 'us' })).toEqual(['addressCountry']);
    });
    it('takes a state code for the United States and free text elsewhere', () => {
      expect(US_REGIONS).toContain('DC');
      expect(US_REGIONS).not.toContain('other');
      expect(rejectedFields({ ...ADDRESS, addressRegion: 'Texas' })).toEqual(['addressRegion']);
      expect(rejectedFields({ ...ADDRESS, addressRegion: 'other' })).toEqual(['addressRegion']);
      expect(ok({ ...ADDRESS, addressCountry: 'CA', addressRegion: 'Ontario', addressPostalCode: 'K1A 0B1' })).toMatchObject({ addressRegion: 'Ontario', addressPostalCode: 'K1A 0B1' });
      expect(parse({ ...ADDRESS, addressCountry: 'CA', addressRegion: 'x'.repeat(100) }).success).toBe(true);
      expect(rejectedFields({ ...ADDRESS, addressCountry: 'CA', addressRegion: 'x'.repeat(101) })).toEqual(['addressRegion']);
    });
    it('limits the postal code to 20 plausible characters', () => {
      for (const good of ['78701', 'SW1A 1AA', '1010-AB', 'K1A 0B1']) expect(parse({ ...ADDRESS, addressPostalCode: good }).success, good).toBe(true);
      for (const bad of ['x'.repeat(21), '<script>', '78701;', ' -12']) expect(rejectedFields({ ...ADDRESS, addressPostalCode: bad }), bad).toEqual(['addressPostalCode']);
    });
  });

  describe('the tax ID', () => {
    const accepts: Record<TaxIdType, string[]> = {
      us_ein: ['12-3456789', '123456789', '12 3456789'],
      eu_vat: ['DE123456789', 'de 123 456 789', 'FR12345678901', 'NL123456789B01'],
      gb_vat: ['GB123456789', '123 4567 89', 'GB 123456789012', 'GBGD001'],
      ca_gst: ['123456789', '123456789RT0001', '123456789 RT 0001'],
      au_abn: ['51824753556', '51 824 753 556'],
      in_gst: ['22AAAAA0000A1Z5'],
      other: ['anything goes 123'],
    };
    const rejects: Record<TaxIdType, string[]> = {
      us_ein: ['12-345678', '1234567890', 'ab-cdefghi'],
      eu_vat: ['1', '12345678', 'DE'],
      gb_vat: ['GB12345', '12345678'],
      ca_gst: ['12345', 'RT0001'],
      au_abn: ['1234567890', '5182475355a'],
      in_gst: ['22AAAAA0000A1Y5', '22aaaaa'],
      other: [],
    };
    it.each(Object.keys(TAX_ID_TYPES) as TaxIdType[])('checks %s leniently', type => {
      for (const good of accepts[type]) expect(parse({ taxIdType: type, taxIdValue: good }).success, `${type} ${good}`).toBe(true);
      for (const bad of rejects[type]) expect(rejectedFields({ taxIdType: type, taxIdValue: bad }), `${type} ${bad}`).toEqual(['taxIdValue']);
    });
    it('is a pair: both given or both blank, and the type is from the list', () => {
      expect(ok({ taxIdType: '', taxIdValue: '' })).toEqual({ taxIdType: null, taxIdValue: null });
      expect(ok({ taxIdType: 'us_ein', taxIdValue: ' 12-3456789 ' })).toEqual({ taxIdType: 'us_ein', taxIdValue: '12-3456789' });
      expect(rejectedFields({ taxIdType: 'us_ein', taxIdValue: '' })).toEqual(['taxIdValue']);
      expect(rejectedFields({ taxIdType: '', taxIdValue: '12-3456789' })).toEqual(['taxIdType']);
      expect(rejectedFields({ taxIdType: 'us_ein' })).toEqual(['taxIdValue']);
      expect(rejectedFields({ taxIdValue: '12-3456789' })).toEqual(['taxIdType']);
      expect(rejectedFields({ taxIdType: 'ssn', taxIdValue: '123-45-6789' })).toEqual(['taxIdType']);
    });
    it('limits the number to 64 characters', () => {
      expect(parse({ taxIdType: 'other', taxIdValue: 'x'.repeat(64) }).success).toBe(true);
      expect(rejectedFields({ taxIdType: 'other', taxIdValue: 'x'.repeat(65) })).toEqual(['taxIdValue']);
    });
    it('never carries the rejected value in its issues', () => {
      const result = parse({ taxIdType: 'us_ein', taxIdValue: 'SECRET-VALUE' });
      expect(JSON.stringify(result.error?.issues)).not.toContain('SECRET-VALUE');
    });
  });

  it('accepts only English as the invoice language', () => {
    expect(rejectedFields({ invoiceLanguage: 'fr' })).toEqual(['invoiceLanguage']);
    expect(rejectedFields({ invoiceLanguage: '' })).toEqual(['invoiceLanguage']);
  });
});
