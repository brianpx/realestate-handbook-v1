// Planning tools: 90-day roadmap dates, weekly time-block planner, post-close scheduler,
// and glossary popovers. The calendar exports use floating local times, so they land at the
// same clock time wherever the reader's calendar is set.

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const shortDate = d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const withTime = (date, minutes) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(minutes / 60), minutes % 60);
const firstOnOrAfter = (date, weekday) => addDays(date, (weekday - date.getDay() + 7) % 7);
const firstWorkingDay = (year, month) => {
    const d = new Date(year, month, 1);
    return d.getDay() === 6 ? addDays(d, 2) : d.getDay() === 0 ? addDays(d, 1) : d;
};

/* ---------- Ch. 12: roadmap with live dates ---------- */

const ROADMAP_PHASES = [
    { startDay: 1, endDay: 30, name: 'Install the system' },
    { startDay: 31, endDay: 60, name: 'Build the rhythm' },
    { startDay: 61, endDay: 90, name: 'Grow the pipeline' }
];

function setupRoadmap(section) {
    if (section.dataset.page !== 'ch12') return;
    const box = [...section.querySelectorAll('.diagram-box')].find(b => b.querySelector('.diagram-title')?.textContent.startsWith('Figure 7'));
    const lists = box ? [...box.querySelectorAll('.checklist')] : [];
    const titles = box ? [...box.querySelectorAll('.checklist-title')] : [];
    if (lists.length !== ROADMAP_PHASES.length || titles.length !== ROADMAP_PHASES.length) return;

    const saved = widgetState('roadmap');
    box.querySelector('.diagram-title').after(
        interactiveHeader('Set your Day 1 to put dates on each phase, tick milestones as you finish them, and add the reviews to your calendar.', 'roadmap', '90-day roadmap')
    );
    const panel = el('div', 'roadmap-panel iw');
    const label = el('label', 'cost-field', 'Day 1 (your start date)');
    const input = el('input', 'calc-input');
    input.type = 'date';
    input.value = saved.start ?? '';
    label.appendChild(input);
    const status = el('p', 'roadmap-status');
    status.setAttribute('aria-live', 'polite');
    const exportBtn = el('button', 'btn-mini', 'Add reviews and milestones to my calendar (.ics)');
    exportBtn.type = 'button';
    panel.append(label, status, el('div', 'script-actions'));
    panel.lastChild.appendChild(exportBtn);
    panel.appendChild(el('p', 'calc-note', 'Monthly reviews land on the first weekday of each month. Move one if it falls on a holiday.'));
    box.querySelector('.interactive-head').after(panel);

    const spans = titles.map(t => { const s = el('span', 'phase-dates'); t.appendChild(s); return s; });
    const startDate = () => parseIso(input.value);

    function refresh() {
        const start = startDate();
        exportBtn.disabled = !start;
        const today = new Date();
        const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (!start) {
            status.textContent = 'Pick a start date to see your three milestone dates.';
            spans.forEach(s => { s.textContent = ''; });
            return;
        }
        const dayNumber = Math.round((todayMid - start) / 86400000) + 1;
        status.textContent = dayNumber < 1 ? `Day 1 is in ${1 - dayNumber} days.`
            : dayNumber <= 90 ? `Today is day ${dayNumber} of 90.` : 'The 90 days are complete. Plan the next 90 from your own ratios.';
        ROADMAP_PHASES.forEach((phase, i) => {
            const from = addDays(start, phase.startDay - 1);
            const to = addDays(start, phase.endDay - 1);
            const boxes = [...lists[i].querySelectorAll('input[type="checkbox"]')];
            const open = boxes.filter(b => !b.checked).length;
            let note = '';
            if (!open) note = 'complete';
            else if (todayMid > to) note = `${open} open, past the target date`;
            else if (todayMid >= from) note = `${open} open, ${Math.round((to - todayMid) / 86400000)} days left`;
            else note = 'not started';
            spans[i].textContent = ` ${shortDate(from)} – ${shortDate(to)} · ${boxes.length - open} of ${boxes.length} done · ${note}`;
        });
    }
    input.addEventListener('input', () => {
        if (input.value) saved.start = input.value; else delete saved.start;
        saveState();
        refresh();
    });
    box.addEventListener('change', e => { if (e.target.matches('input[type="checkbox"]')) refresh(); });

    exportBtn.addEventListener('click', () => {
        const start = startDate();
        if (!start) return;
        const events = ROADMAP_PHASES.map((phase, i) => ({
            summary: `Handbook milestone, day ${phase.endDay}: ${phase.name}`,
            description: [...lists[i].querySelectorAll('.check-item span')].map(s => `- ${s.textContent}`).join('\n'),
            start: addDays(start, phase.endDay - 1), allDay: true
        }));
        const friday = firstOnOrAfter(start, 5);
        events.push({
            summary: 'Friday scorecard and pipeline review',
            description: 'Fill in the Appendix A scorecard and run the weekly pipeline review.',
            start: withTime(friday, 16 * 60), end: withTime(friday, 16 * 60 + 30), rrule: 'FREQ=WEEKLY;BYDAY=FR;COUNT=13'
        });
        for (let m = 1; m <= 3; m++) {
            const day = firstWorkingDay(start.getFullYear(), start.getMonth() + m);
            events.push({
                summary: 'Monthly review (one hour)',
                description: 'Which source produced the most appointments per hour? Which follow-up plan got the most replies? Where did leads stall? What one change will I make this month?',
                start: withTime(day, 9 * 60), end: withTime(day, 10 * 60)
            });
        }
        downloadIcs('handbook-90-day-plan.ics', events);
    });
    refresh();
}

/* ---------- Ch. 8: time-block planner ---------- */

const toMinutes = value => { const [h, m] = (value || '0:0').split(':').map(Number); return h * 60 + m; };
const fmtClock = minutes => {
    const h = Math.floor(minutes / 60) % 24;
    return `${((h + 11) % 12) + 1}:${String(minutes % 60).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
};
const fmtSpan = minutes => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
const nextMonday = () => { const d = new Date(); return firstOnOrAfter(addDays(d, 1), 1); };

function setupTimeBlockPlanner(section) {
    if (section.dataset.page !== 'ch8') return;
    const anchor = [...section.querySelectorAll('p')].find(p => p.textContent.startsWith('Table 8.1.'));
    if (!anchor) return;

    const saved = widgetState('timeblock');
    const defaults = { start: '08:00', followUps: 60, prospecting: 90, endOfDay: '17:30', days: [1, 2, 3, 4, 5], friday: true };
    const cfg = { ...defaults, ...saved, days: saved.days ?? defaults.days };
    const persist = () => { Object.assign(saved, cfg); saveState(); };

    const card = el('div', 'box try-it iw');
    card.innerHTML = '<div class="box-title">● PLANNER · YOUR WEEKLY TIME BLOCKS</div>';
    card.appendChild(interactiveHeader('Set your own start time and block lengths, check that lead generation lands before noon, then add the blocks to your calendar.', 'timeblock-planner', 'Weekly time-block planner'));
    anchor.after(card);

    const field = (text, control) => { const l = el('label', 'cost-field', text); l.appendChild(control); return l; };
    const timeInput = (key) => {
        const i = el('input', 'calc-input'); i.type = 'time'; i.value = cfg[key];
        i.addEventListener('input', () => { if (i.value) { cfg[key] = i.value; persist(); render(); } });
        return i;
    };
    const rangeInput = (key, min, max) => {
        const i = el('input'); i.type = 'range'; i.min = String(min); i.max = String(max); i.step = '5'; i.value = String(cfg[key]);
        i.addEventListener('input', () => { cfg[key] = Number(i.value); persist(); render(); });
        return i;
    };
    const fuOut = el('output', 'alloc-out');
    const prOut = el('output', 'alloc-out');
    const fuRange = rangeInput('followUps', 45, 60);
    const prRange = rangeInput('prospecting', 60, 90);
    const controls = el('div', 'planner-controls');
    controls.append(
        field('Day starts', timeInput('start')),
        field('End-of-day CRM update', timeInput('endOfDay')),
        field('Follow-up tasks (45 to 60 min)', fuRange), fuOut,
        field('Prospecting (60 to 90 min)', prRange), prOut
    );
    const daySet = el('fieldset', 'planner-days');
    daySet.appendChild(el('legend', '', 'Days to block'));
    [1, 2, 3, 4, 5].forEach(d => {
        const l = el('label', 'opt-item');
        const c = el('input'); c.type = 'checkbox'; c.checked = cfg.days.includes(d);
        c.addEventListener('change', () => {
            cfg.days = [1, 2, 3, 4, 5].filter(x => (x === d ? c.checked : cfg.days.includes(x)));
            persist(); render();
        });
        l.append(c, el('span', '', WEEKDAY_NAMES[d]));
        daySet.appendChild(l);
    });
    const fri = el('label', 'opt-item');
    const friBox = el('input'); friBox.type = 'checkbox'; friBox.checked = cfg.friday;
    friBox.addEventListener('change', () => { cfg.friday = friBox.checked; persist(); });
    fri.append(friBox, el('span', '', 'Add a 30-minute pipeline review after Friday prospecting'));

    const bar = el('div', 'alloc-bar planner-bar');
    bar.setAttribute('role', 'img');
    const legend = el('ul', 'planner-legend');
    const verdict = el('p', 'alloc-verdict');
    verdict.setAttribute('aria-live', 'polite');
    const weekLabel = el('label', 'cost-field', 'Start the week of');
    const weekInput = el('input', 'calc-input'); weekInput.type = 'date'; weekInput.value = isoDate(nextMonday());
    weekLabel.appendChild(weekInput);
    const exportBtn = el('button', 'btn-mini', 'Add these blocks to my calendar (.ics, 12 weeks)');
    exportBtn.type = 'button';
    const actions = el('div', 'script-actions');
    actions.appendChild(exportBtn);
    card.append(controls, daySet, fri, bar, legend, verdict, weekLabel, actions);

    let blocks = [];
    function render() {
        fuOut.textContent = `${cfg.followUps} min`;
        prOut.textContent = `${cfg.prospecting} min`;
        const start = toMinutes(cfg.start);
        const prosStart = start + 15 + cfg.followUps;
        const prosEnd = prosStart + cfg.prospecting;
        const eod = toMinutes(cfg.endOfDay);
        blocks = [
            { name: 'CRM dashboard', from: start, mins: 15, cls: 0 },
            { name: 'Follow-up plan tasks', from: start + 15, mins: cfg.followUps, cls: 1 },
            { name: 'Prospecting', from: prosStart, mins: cfg.prospecting, cls: 2 },
            { name: 'Appointments and client work', from: prosEnd, mins: Math.max(eod - prosEnd, 0), cls: 3 },
            { name: 'End-of-day CRM update', from: eod, mins: 15, cls: 4 }
        ];
        bar.replaceChildren();
        legend.replaceChildren();
        const valid = eod >= prosEnd;
        exportBtn.disabled = !valid || !cfg.days.length;
        blocks.forEach(b => {
            if (!b.mins) return;
            const seg = el('span', `alloc-seg pseg-${b.cls}`);
            seg.style.flexGrow = String(b.mins);
            bar.appendChild(seg);
            legend.appendChild(el('li', `pleg-${b.cls}`, `${fmtClock(b.from)}: ${b.name} (${b.mins} min)`));
        });
        bar.setAttribute('aria-label', `Day from ${fmtClock(start)} to ${fmtClock(eod + 15)}`);
        if (!valid) {
            verdict.className = 'alloc-verdict no';
            verdict.textContent = `✗ Your end-of-day update (${fmtClock(eod)}) comes before prospecting ends (${fmtClock(prosEnd)}). Move it later.`;
            return;
        }
        const protectedMins = prosEnd - start;
        const beforeNoon = prosEnd <= 12 * 60;
        verdict.className = `alloc-verdict ${beforeNoon ? 'ok' : 'no'}`;
        verdict.textContent = `${fmtSpan(protectedMins)} protected, finishing at ${fmtClock(prosEnd)}. ` +
            (beforeNoon ? '✓ Lead generation is done before noon. Clients, lenders and inspectors will ask for afternoons: give them afternoons.'
                : '✗ Prospecting runs past noon. The morning is the only time nobody else wants, so start earlier or shorten the blocks.');
    }

    exportBtn.addEventListener('click', () => {
        const weekStart = parseIso(weekInput.value) ?? nextMonday();
        const days = cfg.days;
        const first = days.map(d => firstOnOrAfter(weekStart, d)).sort((a, b) => a - b)[0];
        const byday = days.map(d => WEEKDAYS[d]).join(',');
        const rrule = `FREQ=WEEKLY;BYDAY=${byday};COUNT=${12 * days.length}`;
        const events = blocks.filter(b => b.mins && b.cls !== 3).map(b => ({
            summary: b.name, start: withTime(first, b.from), end: withTime(first, b.from + b.mins), rrule
        }));
        if (cfg.friday && days.includes(5)) {
            const prosEnd = blocks[2].from + blocks[2].mins;
            const friday = firstOnOrAfter(weekStart, 5);
            events.push({
                summary: 'Weekly pipeline review', description: 'No conversation in 14 days and no next step: that contact gets a call on Monday.',
                start: withTime(friday, prosEnd), end: withTime(friday, prosEnd + 30), rrule: 'FREQ=WEEKLY;BYDAY=FR;COUNT=12'
            });
        }
        downloadIcs('handbook-weekly-time-blocks.ics', events);
    });
    render();
}

/* ---------- Ch. 10: post-close scheduler ---------- */

const POST_CLOSE_STEPS = [
    { key: 'Closing day', label: 'Closing day', at: d => d },
    { key: '1 week', label: '1 week', at: d => addDays(d, 7) },
    { key: '30 days', label: '30 days', at: d => addDays(d, 30) },
    { key: 'Quarterly', label: 'Quarter 1 (3 months)', at: d => addMonths(d, 3) },
    { key: 'Quarterly', label: 'Quarter 2 (6 months)', at: d => addMonths(d, 6) },
    { key: 'Quarterly', label: 'Quarter 3 (9 months)', at: d => addMonths(d, 9) },
    { key: 'Home anniversary', label: 'Home anniversary', at: d => addMonths(d, 12) }
];

function setupPostCloseScheduler(section) {
    if (section.dataset.page !== 'ch10') return;
    const table = [...section.querySelectorAll('.table-wrapper table')].find(t => t.querySelector('th')?.textContent.trim() === 'WHEN');
    const anchor = [...section.querySelectorAll('p')].find(p => p.textContent.startsWith('Table 10.1.'));
    if (!table || !anchor) return;
    const rows = {};
    table.querySelectorAll('tbody tr').forEach(tr => { rows[tr.cells[0].textContent.trim()] = { touch: tr.cells[1].textContent.trim(), purpose: tr.cells[2].textContent.trim() }; });
    if (POST_CLOSE_STEPS.some(s => !rows[s.key])) return;

    const saved = widgetState('postClose');
    const card = el('div', 'box try-it iw');
    card.innerHTML = '<div class="box-title">● SCHEDULER · YOUR POST-CLOSE DATES</div>';
    card.appendChild(interactiveHeader('Enter a closing date to see every touch in the first year with its date, then add them to your calendar.', 'postclose-scheduler', 'Post-close scheduler'));
    anchor.after(card);

    const closeLabel = el('label', 'cost-field', 'Closing date');
    const closeInput = el('input', 'calc-input'); closeInput.type = 'date'; closeInput.value = saved.date ?? '';
    closeLabel.appendChild(closeInput);
    const nameLabel = el('label', 'cost-field', 'Client name (optional, not saved)');
    const nameInput = el('input', 'calc-input'); nameInput.type = 'text'; nameInput.maxLength = 40;
    nameLabel.appendChild(nameInput);
    const countLabel = el('label', 'cost-field', 'Closings you expect this year');
    const countField = amountInput({
        value: saved.closings, min: 1,
        onValue: n => { if (n === undefined) delete saved.closings; else saved.closings = n; saveState(); render(); }
    });
    countLabel.append(countField.input, countField.error);
    const controls = el('div', 'planner-controls');
    controls.append(closeLabel, nameLabel, countLabel);

    const result = el('div', 'postclose-result');
    result.setAttribute('aria-live', 'polite');
    const exportBtn = el('button', 'btn-mini', 'Add these touches to my calendar (.ics)');
    exportBtn.type = 'button';
    const actions = el('div', 'script-actions');
    actions.appendChild(exportBtn);
    const note = el('p', 'calc-note');
    card.append(controls, result, actions, note);

    const schedule = () => {
        const d = parseIso(closeInput.value);
        return d ? POST_CLOSE_STEPS.map(s => ({ ...s, date: s.at(d), ...rows[s.key] })) : [];
    };
    function render() {
        const plan = schedule();
        exportBtn.disabled = !plan.length;
        result.replaceChildren();
        if (!plan.length) result.appendChild(el('p', 'calc-empty', 'Enter a closing date to see your schedule.'));
        else {
            const list = el('ol', 'postclose-list');
            plan.forEach(p => {
                const li = el('li', 'postclose-item');
                const head = el('div', 'postclose-head');
                head.append(el('strong', '', fmtDate(p.date)), el('span', 'nurture-tag', p.label));
                li.append(head, el('div', '', p.touch), el('div', 'postclose-purpose', p.purpose));
                list.appendChild(li);
            });
            result.append(list, el('p', 'calc-note', `After the first year: ${rows.Annually.touch} ${rows.Annually.purpose}`));
        }
        const n = Number(saved.closings);
        const shape = 'Months 3, 6 and 9 are the quarterly touches. Month 12 is the home anniversary, which takes the place of a fourth quarter. The annual appreciation event is not a separate dated row.';
        note.textContent = n > 0
            ? `${POST_CLOSE_STEPS.length} dated touches per client in the first year × ${n} closings = ${POST_CLOSE_STEPS.length * n} touches. ${shape}`
            : shape;
    }
    closeInput.addEventListener('input', () => { if (closeInput.value) saved.date = closeInput.value; else delete saved.date; saveState(); render(); });
    exportBtn.addEventListener('click', () => {
        const who = nameInput.value.trim();
        downloadIcs('handbook-post-close-plan.ics', schedule().map(p => ({
            summary: `Post-close${who ? ` (${who})` : ''}: ${p.label}`, description: `${p.touch} ${p.purpose}`, start: p.date, allDay: true
        })));
    });
    render();
}

/* ---------- Glossary popovers (every chapter) ---------- */

const GLOSSARY_TERMS = [
    { term: '8x8', exact: true }, { term: 'Agency disclosure' }, { term: 'Client App' }, { term: 'Cost per closed deal' },
    { term: 'CRM', exact: true }, { term: 'Expired listing', plural: true }, { term: 'Fair Housing' }, { term: 'Farming' },
    { term: 'Follow-up plan', plural: true }, { term: 'FSBO', exact: true }, { term: 'IDX', exact: true },
    { term: 'Lagging indicator', plural: true }, { term: 'Lead routing' }, { term: 'Leading indicator', plural: true },
    { term: 'Opportunities', alt: 'Opportunit(?:y|ies)' }, { term: 'Pipeline value' }, { term: 'Speed-to-lead' },
    { term: 'Sphere of influence' }, { term: 'Value piece', plural: true }
];
const GLOSSARY_SKIP = 'h1,h2,h3,h4,h5,button,textarea,input,select,label,a,th,.box-title,.iw,.term,[data-widget],.interactive-head,dl.glossary,.part-label,.diagram-title,.checklist,.read-sentinel,table.scorecard';
const glossaryPatterns = GLOSSARY_TERMS.map(t => ({
    ...t,
    regex: new RegExp(`(^|[^\\w-])(${t.alt ?? t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${t.plural ? 's?' : ''})(?![\\w-])`, t.exact ? 'g' : 'gi')
}));

let glossaryPromise = null;
function loadGlossary() {
    glossaryPromise ??= fetch('chapters/app-d.html').then(r => (r.ok ? r.text() : '')).then(html => {
        const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
        const defs = new Map();
        doc.querySelectorAll('dt').forEach(dt => { defs.set(dt.textContent.trim().toLowerCase(), dt.nextElementSibling?.textContent.trim() ?? ''); });
        return defs;
    }).catch(() => new Map());
    return glossaryPromise;
}

let termPop = null;
let termOwner = null;
let termCloseTimer = null;
function closeTermPop() {
    clearTimeout(termCloseTimer);
    if (!termPop) return;
    termPop.hidden = true;
    termOwner?.setAttribute('aria-expanded', 'false');
    termOwner?.removeAttribute('aria-describedby');
    termOwner = null;
}
// WCAG 1.4.13: a hover popover must stay open while the pointer moves onto it
function scheduleCloseTermPop(owner) {
    clearTimeout(termCloseTimer);
    termCloseTimer = setTimeout(() => { if (termOwner === owner) closeTermPop(); }, 250);
}
function openTermPop(button, name, definition) {
    if (!termPop) {
        termPop = el('div', 'term-pop');
        termPop.id = 'termPop';
        termPop.setAttribute('role', 'tooltip');
        document.body.appendChild(termPop);
        termPop.addEventListener('mouseenter', () => clearTimeout(termCloseTimer));
        termPop.addEventListener('mouseleave', () => { if (termOwner) scheduleCloseTermPop(termOwner); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && termOwner) { const owner = termOwner; closeTermPop(); owner.focus(); } });
        document.addEventListener('click', e => { if (termOwner && !e.target.closest('.term') && !e.target.closest('.term-pop')) closeTermPop(); });
        document.getElementById('main-content').addEventListener('scroll', closeTermPop, { passive: true });
        window.addEventListener('scroll', closeTermPop, { passive: true });
        window.addEventListener('resize', closeTermPop);
    }
    clearTimeout(termCloseTimer);
    termOwner?.setAttribute('aria-expanded', 'false');
    termOwner?.removeAttribute('aria-describedby');
    termOwner = button;
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-describedby', 'termPop');
    termPop.replaceChildren(el('strong', '', name), el('span', '', definition), el('span', 'term-more', 'Full list: Appendix D'));
    termPop.hidden = false;
    const rect = button.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    termPop.style.width = `${width}px`;
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    termPop.style.left = `${left}px`;
    const below = rect.bottom + 8;
    termPop.style.top = `${below}px`;
    const popHeight = termPop.offsetHeight;
    if (below + popHeight > window.innerHeight - 8) termPop.style.top = `${Math.max(8, rect.top - popHeight - 8)}px`;
}

function findGlossaryMatch(text, pattern) {
    pattern.regex.lastIndex = 0;
    const m = pattern.regex.exec(text);
    return m ? { index: m.index + m[1].length, length: m[2].length } : null;
}

async function setupGlossary(section) {
    if (['cover', 'app-d'].includes(section.dataset.page)) return;
    const defs = await loadGlossary();
    if (!defs.size || !section.isConnected) return;
    const used = new Set();
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, {
        acceptNode: n => (n.nodeValue.trim() && !n.parentElement.closest(GLOSSARY_SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(start => {
        let node = start;
        for (;;) {
            let best = null;
            glossaryPatterns.forEach(p => {
                if (used.has(p.term)) return;
                const m = findGlossaryMatch(node.nodeValue, p);
                if (m && (!best || m.index < best.index)) best = { ...m, p };
            });
            if (!best) break;
            const definition = defs.get(best.p.term.toLowerCase());
            if (!definition) { used.add(best.p.term); continue; }
            const matched = node.splitText(best.index);
            const rest = matched.splitText(best.length);
            const button = el('button', 'term', matched.nodeValue);
            button.type = 'button';
            button.setAttribute('aria-expanded', 'false');
            const name = best.p.term;
            button.addEventListener('click', () => {
                if (termOwner === button) { closeTermPop(); return; }
                openTermPop(button, name, definition);
                // the tooltip is not in the reading flow, so say the definition when it is opened on purpose
                announce(`${name}: ${definition}`);
            });
            button.addEventListener('mouseenter', () => { if (window.matchMedia('(hover: hover)').matches) openTermPop(button, name, definition); });
            button.addEventListener('mouseleave', () => { if (window.matchMedia('(hover: hover)').matches && termOwner === button) scheduleCloseTermPop(button); });
            matched.replaceWith(button);
            used.add(best.p.term);
            node = rest;
        }
    });
}
