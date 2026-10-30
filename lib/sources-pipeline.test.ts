import { describe, expect, it } from 'vitest';
import { callFlag, isActive, needsCall, pipelineStats } from './pipeline';
import { sourceResults, sourceSummary } from './sources';

describe('sourceResults', () => {
  it('prices time at the hourly rate and divides by closings', () => {
    const r = sourceResults({ zillow: { spend: 1000, hours: 10, closings: 2 }, sphere: { hours: 20, closings: 4 } }, 25);
    expect(r.find(x => x.key === 'zillow')).toMatchObject({ total: 1250, per: 625, text: '$1,250 invested → $625 per closed deal' });
    expect(r.find(x => x.key === 'sphere')).toMatchObject({ total: 500, per: 125 });
  });
  it('says no closings yet, and stays blank for untouched sources', () => {
    const r = sourceResults({ idx: { spend: 300 } }, 0);
    expect(r.find(x => x.key === 'idx')!.text).toBe('$300 invested, no closings yet');
    expect(r.find(x => x.key === 'open')).toMatchObject({ entered: false, text: '' });
  });
  it('compares only sources that closed a deal, and nudges for a time rate', () => {
    const none = sourceResults({}, 0);
    expect(sourceSummary(none, 0)).toBe('');
    const one = sourceResults({ zillow: { spend: 100, closings: 1 } }, 0);
    expect(sourceSummary(one, 0)).toBe('Enter a second source to compare.');
    const two = sourceResults({ zillow: { spend: 1000, closings: 1 }, sphere: { spend: 100, closings: 1 } }, 0);
    expect(sourceSummary(two, 0)).toBe('Lowest cost per closed deal: Sphere of influence and referrals ($100). Highest: Zillow Premier Agent ($1,000). Add a rate for your time to see the true comparison.');
    expect(sourceSummary(two, 25)).not.toContain('Add a rate');
  });
});

describe('pipeline', () => {
  it('sums commission of active opportunities only; a row defaults to active', () => {
    const rows = [{ commission: 5000 }, { type: 'Nurture', commission: 9000 }, { type: 'Active opportunity', commission: 2500 }];
    expect(pipelineStats(rows)).toEqual({ value: 7500, active: 2, calls: 0 });
    expect(isActive({})).toBe(true);
    expect(isActive({ type: 'Nurture' })).toBe(false);
  });
  it('flags a Monday call at 14 quiet days with no next step', () => {
    expect(needsCall({ days: 14 })).toBe(true);
    expect(needsCall({ days: 13 })).toBe(false);
    expect(needsCall({ days: 30, next: true })).toBe(false);
    expect(needsCall({})).toBe(false);
    expect(callFlag({ days: 20 })).toBe('⚑ Call Monday: 20 days quiet, no next step');
    expect(callFlag({ days: 3 })).toBe('');
    expect(pipelineStats([{ days: 14 }, { days: 20, next: true }, { type: 'Nurture', days: 99 }]).calls).toBe(2);
  });
});
