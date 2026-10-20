// Illustrative conversion ranges for Figure 2, copied unchanged from legacy/js/widgets-practice.js.
export type LeadSource = { key: string; name: string; lo: number; hi: number; open?: boolean; label: string };
export const LEAD_SOURCES: LeadSource[] = [
    { key: 'sphere', name: 'Sphere of influence and referrals', lo: 15, hi: 30, open: true, label: '15–30%+' },
    { key: 'zillow', name: 'Zillow Premier Agent', lo: 1, hi: 5, label: '1–5%' },
    { key: 'idx', name: 'Own IDX website and ads', lo: 2, hi: 6, label: '2–6%' },
    { key: 'open', name: 'Open houses', lo: 5, hi: 15, label: '5–15%' },
    { key: 'expired', name: 'Expired listings and FSBOs', lo: 3, hi: 8, label: '3–8%' }
];
