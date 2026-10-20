import { describe, expect, it } from 'vitest';
import { QUALIFY_SCENARIOS } from '@/content/data/qualify';
import { CONSULT_CASES, CONSULT_DEFAULT, CONSULT_STEPS } from '@/content/data/consult';
import { FAIR_HOUSING_ITEMS } from '@/content/data/fair-housing';
import { allocSummary, cycleStatus, fixChapter, gradeQualify, interruptions, rankErrors } from './drills';

describe('gradeQualify', () => {
  const first = QUALIFY_SCENARIOS[0]!; // Timeline, Motivation, Financing answered; active
  it('is right when the ticks and the stage both match', () => {
    expect(gradeQualify(first, ['Timeline', 'Motivation', 'Financing'], 'active')).toEqual({ right: true, missed: [] });
  });
  it('lists fields marked the wrong way round, and a wrong stage alone fails', () => {
    expect(gradeQualify(first, ['Timeline', 'Representation'], 'active')).toEqual({ right: false, missed: ['Motivation', 'Financing', 'Representation'] });
    expect(gradeQualify(first, ['Timeline', 'Motivation', 'Financing'], 'nurture')).toEqual({ right: false, missed: [] });
  });
  it('has four scenarios with known stages', () => {
    expect(QUALIFY_SCENARIOS.map(s => s.stage)).toEqual(['active', 'nurture', 'active', 'nurture']);
  });
});

describe('rankErrors', () => {
  const errors = [{ name: 'A', cost: '', fix: '' }, { name: 'B', cost: '', fix: '' }, { name: 'C', cost: '', fix: '' }];
  it('drops unrated errors and sorts high to low, keeping table order for ties', () => {
    expect(rankErrors(errors, { 0: 3, 2: 5 }).map(e => e.name)).toEqual(['C', 'A']);
    expect(rankErrors(errors, { 0: 4, 1: 4 }).map(e => e.name)).toEqual(['A', 'B']);
    expect(rankErrors(errors, {})).toEqual([]);
  });
  it('finds the chapter in a Fix cell', () => {
    expect(fixChapter('Speed-to-lead automation and a 90-day plan (Ch. 5)')).toBe('5');
    expect(fixChapter('Work the sphere first')).toBeUndefined();
  });
});

describe('pitfall cycle', () => {
  it('maps tools onto the links they break', () => {
    expect(interruptions(new Set())).toEqual([[], [], [], [], []]);
    const all = interruptions(new Set([0, 1, 2, 3]));
    expect(all[0]).toEqual(['CRM + follow-up plans', 'Protected daily block']);
    expect(all[1]).toEqual(['CRM + follow-up plans', 'Friday review']);
    expect(all.every(x => x.length > 0)).toBe(true);
  });
  it('words the status', () => {
    expect(cycleStatus(new Set())).toMatch(/^With nothing installed/);
    expect(cycleStatus(new Set([2]))).toMatch(/^Interrupted at 1 of 5 links\. Activity tracking:/);
    expect(cycleStatus(new Set([0, 1, 2, 3]))).toMatch(/^Interrupted at 5 of 5 links\./);
  });
});

describe('allocSummary', () => {
  it('fails the default split and passes once asking and listening reach half', () => {
    const start = allocSummary(CONSULT_DEFAULT);
    expect(start).toMatchObject({ total: 60, core: 15, share: 25, ok: false });
    expect(start.text).toBe('Asking and listening: 15 of 60 minutes (25%). ✗ Below half. Move time from presenting into asking and listening.');
    expect(allocSummary([5, 25, 20, 5, 5])).toMatchObject({ share: 75, ok: true });
    expect(allocSummary([5, 15, 15, 20, 5]).ok).toBe(true); // exactly half
  });
  it('asks for some time when every slider is zero', () => {
    expect(allocSummary([0, 0, 0, 0, 0])).toMatchObject({ share: 0, text: 'Give the steps some time.' });
  });
});

describe('drill content', () => {
  it('every question has its answer among the options', () => {
    for (const c of CONSULT_CASES) expect(c.answer).toBeLessThan(c.options.length);
    expect(CONSULT_CASES.map(c => CONSULT_STEPS[c.answer])).toEqual(['Ask', 'Listen', 'Agree', 'Frame']);
    expect(FAIR_HOUSING_ITEMS).toHaveLength(9);
    expect(FAIR_HOUSING_ITEMS.map(i => i.answer)).toEqual([0, 1, 0, 0, 1, 0, 0, 1, 0]);
  });
});
