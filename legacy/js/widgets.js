// Interactive tools layered onto the chapters. Loaded before interactive.js, which calls the
// setup functions from enhanceSection. Uses el / loadState / saveState / navigateTo from the
// other scripts (all classic scripts, so top-level declarations are shared).

/* ---------- Shared helpers ---------- */

function widgetState(name) {
    const state = loadState();
    state.widgets ??= {};
    return (state.widgets[name] ??= {});
}

// The strip that marks something as interactive. It doubles as the jump target for Appendix E.
function interactiveHeader(hint, key, label) {
    const head = el('div', 'interactive-head');
    head.dataset.widget = key;
    head.tabIndex = -1;
    const pill = el('span', 'interactive-pill');
    pill.innerHTML = '<span aria-hidden="true">◉ </span>INTERACTIVE';
    head.append(pill, el('span', 'interactive-hint', hint));
    head.dataset.label = label;
    return head;
}

async function goToWidget(page, key) {
    await navigateTo(page);
    const section = document.querySelector(`.chapter-section[data-page="${page}"]`);
    const target = key ? section?.querySelector(`[data-widget="${key}"]`) : null;
    if (!target) {
        if (key) {
            const off = typeof essentialOnly === 'function' && essentialOnly();
            announce(off
                ? 'That tool is off while Essential tools only is on. Turn it off in Settings to open this one.'
                : `Could not find that tool in ${navLabel(page)}.`);
        }
        return;
    }
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
    target.classList.add('widget-found');
    setTimeout(() => target.classList.remove('widget-found'), 2200);
}

document.addEventListener('click', e => {
    const link = e.target.closest('[data-goto]');
    if (!link) return;
    e.preventDefault();
    goToWidget(link.dataset.goto, link.dataset.widget);
});

const addDays = (date, n) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + n);
    return d;
};
// month arithmetic that clamps to the last day instead of spilling into the next month
const addMonths = (date, n) => {
    const d = new Date(date.getFullYear(), date.getMonth() + n, 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(date.getDate(), last));
    return d;
};
const fmtDate = d => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseIso = value => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

const icsDate = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
const icsDateTime = d => `${icsDate(d)}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
const icsEscape = text => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

// events: { summary, description?, start: Date, end?: Date, allDay?: boolean, rrule?: string }
function downloadIcs(filename, events) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Handbook//Interactive tools//EN', 'CALSCALE:GREGORIAN'];
    events.forEach((e, i) => {
        lines.push('BEGIN:VEVENT', `UID:${Date.now()}-${i}@handbook.local`, `DTSTAMP:${stamp}`);
        if (e.allDay) lines.push(`DTSTART;VALUE=DATE:${icsDate(e.start)}`, `DTEND;VALUE=DATE:${icsDate(addDays(e.start, 1))}`);
        else lines.push(`DTSTART:${icsDateTime(e.start)}`, `DTEND:${icsDateTime(e.end)}`);
        if (e.rrule) lines.push(`RRULE:${e.rrule}`);
        lines.push(`SUMMARY:${icsEscape(e.summary)}`);
        if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
        lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const link = el('a');
    link.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/* ---------- Ch. 1: income goal calculator ---------- */

const CALC_DEFAULTS = { apc: 3, cpa: 20, weeks: 48 };
const WORKDAYS_PER_WEEK = 5;
// Table 8.2: conversations per week for a full-time new agent
const TARGET_CONVERSATIONS = { low: 15, high: 25 };
const CALC_SCENARIOS = [
    { label: 'Ratios as entered', factor: 1 },
    { label: '25% more conversations', factor: 1.25 },
    { label: '50% more conversations', factor: 1.5 }
];

// Accepts "80000", "80,000", "$80,000" and "1 500.50"; anything else is undefined.
const parseAmount = text => {
    const cleaned = String(text).replace(/[$,\s]/g, '');
    return /^(\d+\.?\d*|\.\d+)$/.test(cleaned) ? Number(cleaned) : undefined;
};
const fmtNum = n => Math.round(n).toLocaleString('en-US');
const fmtMoney = n => `$${fmtNum(n)}`;

// A text input that tolerates "$1,500". number inputs drop or blank those characters in some
// browsers, so the tool sat on its empty state with no explanation. onValue gets a number, or
// undefined when the field is empty or invalid; an inline message explains invalid input.
let amountInputCount = 0;
function amountInput({ label, value, min = 0, max, format, hint = 'Numbers only, for example 1500.', onValue }) {
    const input = el('input', 'calc-input');
    input.type = 'text';
    input.inputMode = 'decimal';
    input.autocomplete = 'off';
    if (label) input.setAttribute('aria-label', label);
    const error = el('div', 'calc-error');
    error.id = `amount-error-${++amountInputCount}`;
    let current = value;
    input.value = value === undefined ? '' : (format ? format(value) : String(value));
    input.addEventListener('input', () => {
        const raw = input.value.trim();
        const n = parseAmount(raw);
        let message = '';
        if (raw !== '' && n === undefined) message = hint;
        else if (n !== undefined && n < min) message = `Enter ${min} or more.`;
        else if (n !== undefined && max !== undefined && n > max) message = `Enter ${max} or fewer.`;
        current = message || raw === '' ? undefined : n;
        error.textContent = message;
        input.setAttribute('aria-invalid', String(Boolean(message)));
        if (message) input.setAttribute('aria-describedby', error.id); else input.removeAttribute('aria-describedby');
        onValue(current);
    });
    if (format) input.addEventListener('blur', () => { if (current !== undefined) input.value = format(current); });
    return { input, error };
}
const fmtPerDay = n => {
    if (n < 1) return n.toFixed(1);
    const lo = Math.floor(n);
    const hi = Math.ceil(n);
    return lo === hi ? String(lo) : `${lo} to ${hi}`;
};

// The example column is fixed, so the dialog explains how those figures were reached and what they assume.
function calcFootnote() {
    const dialog = el('dialog', 'note-dialog');
    dialog.id = 'calc-footnote';
    dialog.setAttribute('aria-labelledby', 'calc-footnote-title');
    dialog.innerHTML =
        '<div class="note-dialog-head"><h4 id="calc-footnote-title">How the example numbers were derived</h4>' +
        '<button type="button" class="btn-mini" data-close-note>Close</button></div>' +
        '<p>Each row feeds the next. Using the example goal of $80,000:</p>' +
        '<ol>' +
        '<li><strong>Closings:</strong> $80,000 ÷ $6,500 = 12.3, rounded <em>up</em> to 13, because you cannot close part of a sale.</li>' +
        '<li><strong>Appointments:</strong> 13 closings × 3 appointments per closing = 39.</li>' +
        '<li><strong>Conversations:</strong> 39 appointments × 20 conversations per appointment = 780.</li>' +
        '<li><strong>Per week:</strong> 780 ÷ 48 working weeks = 16.25, shown as about 16.</li>' +
        '<li><strong>Per day:</strong> 16.25 ÷ ' + WORKDAYS_PER_WEEK + ' working days = 3.25, shown as 3 to 4.</li>' +
        '</ol>' +
        '<p><strong>Assumptions</strong></p>' +
        '<ul>' +
        '<li>The income goal and the $6,500 average are both what you keep from a closed side <em>after</em> your broker split. Business expenses and taxes are not subtracted, so set your goal with those in mind.</li>' +
        '<li>Three appointments per closing and 20 conversations per appointment are rules of thumb for a new agent, blended across lead sources. They are not measured results. Your own ratios will differ and should replace these as soon as you have a few months of data.</li>' +
        '<li>48 working weeks is 52 less about four for vacation, holidays and illness. A working week is ' + WORKDAYS_PER_WEEK + ' days.</li>' +
        '<li>Every closing is assumed to come from the work counted here. Referrals and repeat clients would lower the conversations you need.</li>' +
        '<li>Closings trail conversations by roughly 60 to 120 days, so income lags the work.</li>' +
        '</ul>' +
        '<p class="note-dialog-foot">Change any input in the table and the whole ladder recalculates with your numbers.</p>';
    dialog.addEventListener('click', e => {
        // a click on the backdrop targets the dialog itself
        if (e.target === dialog || e.target.closest('[data-close-note]')) dialog.close();
    });
    return dialog;
}

function setupGoalCalculator(section) {
    if (section.dataset.page !== 'ch1') return;
    const table = [...section.querySelectorAll('.table-wrapper table')]
        .find(t => t.querySelector('th:last-child')?.textContent.trim() === 'YOUR NUMBER');
    const rows = table ? [...table.querySelectorAll('tbody tr')] : [];
    if (rows.length !== 8) return;

    const saved = loadState().calc;
    const cells = rows.map(r => r.cells[2]);
    let factor = 1;

    const addInput = (rowIdx, key, { prefix, placeholder, min, max }) => {
        const fallback = CALC_DEFAULTS[key];
        if (saved[key] === undefined && fallback !== undefined) saved[key] = fallback;
        const { input, error } = amountInput({
            label: rows[rowIdx].cells[0].textContent.trim(), value: saved[key], min, max,
            format: prefix ? fmtNum : undefined,
            onValue: n => {
                if (n === undefined) delete saved[key]; else saved[key] = n;
                saveState();
                refresh();
            }
        });
        input.placeholder = placeholder;
        const wrap = el('span', 'calc-field');
        if (prefix) wrap.appendChild(el('span', 'calc-prefix', prefix));
        wrap.appendChild(input);
        cells[rowIdx].append(wrap, error);
    };
    const addSub = rowIdx => {
        const sub = el('div', 'calc-sub');
        cells[rowIdx].appendChild(sub);
        return sub;
    };

    addInput(0, 'goal', { prefix: '$', placeholder: '80,000', min: 1 });
    addInput(1, 'commission', { prefix: '$', placeholder: '6,500', min: 1 });
    addInput(3, 'apc', { placeholder: '3', min: 0.1 });
    addInput(4, 'cpa', { placeholder: '20', min: 0.1 });
    addInput(5, 'weeks', { placeholder: '48', min: 1, max: 52 });
    const apptSub = addSub(3);
    const convSub = addSub(4);

    const panel = el('div', 'box try-it calc-panel iw');
    panel.innerHTML = '<div class="box-title">● CALCULATOR · YOUR DAILY TARGET</div>' +
        '<div class="calc-stats" role="status"></div>' +
        '<p class="calc-verdict"></p>' +
        '<div class="calc-stress"><span class="calc-stress-label">Stress test: what if it takes more work than the example?</span>' +
        '<div class="script-actions" role="group" aria-label="Stress test"></div></div>' +
        '<p class="calc-note">Conversations are real two-way talks. A working week is counted as ' + WORKDAYS_PER_WEEK +
        ' days. Closings lag conversations by roughly 60 to 120 days, so judge yourself on the conversations.</p>';
    const caption = table.closest('.table-wrapper').nextElementSibling;
    caption.after(panel);
    const noteDialog = calcFootnote();
    const marker = el('button', 'footnote-ref', '1');
    marker.type = 'button';
    marker.setAttribute('aria-haspopup', 'dialog');
    marker.setAttribute('aria-label', 'Footnote: how these numbers were derived');
    marker.addEventListener('click', () => noteDialog.showModal());
    const sup = el('sup');
    sup.appendChild(marker);
    const note = el('p', 'footnote');
    note.append(sup, ' How these numbers were derived, and what they assume. ');
    const open = el('button', 'link-btn', 'Read the footnote');
    open.type = 'button';
    open.setAttribute('aria-haspopup', 'dialog');
    open.addEventListener('click', () => noteDialog.showModal());
    note.appendChild(open);
    caption.after(note, noteDialog);
    table.closest('.table-wrapper').before(interactiveHeader('Type your own numbers in the "Your number" column. Your daily target appears below the table and saves on this device.', 'goal-calculator', 'Income goal calculator'));

    const stats = panel.querySelector('.calc-stats');
    const verdict = panel.querySelector('.calc-verdict');
    const scenarioButtons = CALC_SCENARIOS.map(s => {
        const b = el('button', 'btn-mini', s.label);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(s.factor === factor));
        b.addEventListener('click', () => {
            factor = s.factor;
            scenarioButtons.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
            refresh();
        });
        return b;
    });
    panel.querySelector('.script-actions').append(...scenarioButtons);

    const valid = key => (Number.isFinite(saved[key]) && saved[key] > 0 ? saved[key] : NaN);

    function plan(scale) {
        const closings = Math.ceil(valid('goal') / valid('commission'));
        const appts = closings * valid('apc');
        const convs = appts * valid('cpa') * scale;
        const perWeek = convs / valid('weeks');
        return { closings, appts, convs, perWeek, perDay: perWeek / WORKDAYS_PER_WEEK };
    }

    function stat(value, label) {
        const tile = el('div', 'calc-stat');
        tile.append(el('div', 'calc-stat-value', value), el('div', 'calc-stat-label', label));
        return tile;
    }

    function refresh() {
        const ready = ![valid('goal'), valid('commission'), valid('apc'), valid('cpa'), valid('weeks')].some(Number.isNaN);
        const outputs = [2, 6, 7].map(i => cells[i]);
        apptSub.textContent = '';
        convSub.textContent = '';
        stats.replaceChildren();
        verdict.textContent = '';
        if (!ready) {
            outputs.forEach(c => { c.textContent = '—'; });
            stats.appendChild(el('p', 'calc-empty', 'Enter your income goal and average commission to see your daily conversation target.'));
            return;
        }
        const shown = plan(factor);
        cells[2].textContent = fmtNum(shown.closings);
        apptSub.textContent = `= ${fmtNum(shown.appts)} appointments`;
        convSub.textContent = `≈ ${fmtNum(shown.convs)} conversations`;
        cells[6].textContent = `≈ ${fmtNum(shown.perWeek)}`;
        cells[7].textContent = fmtPerDay(shown.perDay);

        stats.append(
            stat(fmtNum(shown.closings), shown.closings === 1 ? 'closing needed' : 'closings needed'),
            stat(fmtNum(shown.perWeek), 'conversations a week'),
            stat(fmtPerDay(shown.perDay), 'conversations a day')
        );

        const week = Math.round(shown.perWeek);
        let text;
        if (week < TARGET_CONVERSATIONS.low) {
            text = `Table 8.2 asks a new agent for ${TARGET_CONVERSATIONS.low} to ${TARGET_CONVERSATIONS.high} conversations a week. Your goal needs fewer, so that range leaves you a cushion if your ratios start out weak.`;
        } else if (week <= TARGET_CONVERSATIONS.high) {
            text = `That sits inside the ${TARGET_CONVERSATIONS.low} to ${TARGET_CONVERSATIONS.high} conversations a week that Table 8.2 sets for a new agent.`;
        } else {
            text = `That is above the top of Table 8.2's range (${TARGET_CONVERSATIONS.low} to ${TARGET_CONVERSATIONS.high} a week). Check whether the goal, commission and ratios are realistic for year one, or plan to ramp up over several months.`;
        }
        if (factor !== 1) text = `At ${Math.round((factor - 1) * 100)}% more conversations than planned you would need ${fmtNum(shown.perWeek)} a week, up from ${fmtNum(plan(1).perWeek)}. ${text}`;
        verdict.textContent = text;
    }

    refresh();
}

/* ---------- Ch. 4: speed-to-lead explorer ---------- */

// y is a relative height for drawing only. The handbook gives three bands, not percentages.
const SPEED_STOPS = [
    { label: '1 min', minutes: 1, y: 100 },
    { label: '3 min', minutes: 3, y: 94 },
    { label: '10 min', minutes: 10, y: 74 },
    { label: '20 min', minutes: 20, y: 62 },
    { label: '30 min', minutes: 30, y: 52 },
    { label: '1 hr', minutes: 60, y: 28 },
    { label: '3 hr', minutes: 180, y: 14 },
    { label: '8 hr', minutes: 480, y: 7 },
    { label: '24 hr', minutes: 1440, y: 4 }
];

const SPEED_BANDS = {
    top: {
        name: 'Highest conversion window',
        detail: 'You are inside five minutes. An automated first touch plus an immediate live call is what keeps you here, even when you are with a client.'
    },
    strong: {
        name: 'Strong conversion',
        detail: 'Still a good window, but you are racing agents who answered first. The handbook standard is a live call within five minutes.'
    },
    drop: {
        name: 'Sharp drop-off',
        detail: 'The person has probably sent the same inquiry to two or three other agents, and someone has likely answered. Most agents respond in hours; top producers respond in minutes.'
    }
};

function speedBand(minutes) {
    if (minutes < 5) return 'top';
    if (minutes <= 30) return 'strong';
    return 'drop';
}

function formatElapsed(ms) {
    const total = Math.floor(ms / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function setupSpeedToLead(section) {
    if (section.dataset.page !== 'ch4') return;
    const box = [...section.querySelectorAll('.diagram-box')]
        .find(b => b.querySelector('.diagram-title')?.textContent.startsWith('Figure 4'));
    if (!box) return;
    box.querySelector('p')?.remove();
    box.querySelector('.diagram-title').after(interactiveHeader('Drag the slider to see where your response time lands.', 'speed-to-lead', 'Speed-to-lead explorer'));

    const W = 360;
    const H = 170;
    const left = 24;
    const right = W - 16;
    const top = 28;
    const bottom = 128;
    const xAt = i => left + (i / (SPEED_STOPS.length - 1)) * (right - left);
    const yAt = v => bottom - (v / 100) * (bottom - top);
    const points = SPEED_STOPS.map((s, i) => [xAt(i), yAt(s.y)]);
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let path = `M${points[0][0]},${points[0][1]}`;
    for (let i = 1; i < points.length - 1; i++) {
        const m = mid(points[i], points[i + 1]);
        path += ` Q${points[i][0]},${points[i][1]} ${m[0]},${m[1]}`;
    }
    path += ` L${points[points.length - 1][0]},${points[points.length - 1][1]}`;

    // band edges sit halfway between the stops either side of 5 and 30 minutes
    const edge1 = (xAt(1) + xAt(2)) / 2;
    const edge2 = (xAt(4) + xAt(5)) / 2;
    const ticks = SPEED_STOPS.map((s, i) =>
        `<text x="${xAt(i)}" y="${bottom + 16}" text-anchor="middle" class="speed-tick" data-i="${i}">${s.label}</text>`).join('');
    const svg = `<svg viewBox="0 0 ${W} ${H}" class="speed-svg" role="img" aria-label="Illustrative curve: the chance of winning the conversation falls as response time grows">` +
        `<rect x="${left}" y="${top - 14}" width="${edge1 - left}" height="${bottom - top + 14}" class="speed-zone zone-top"/>` +
        `<rect x="${edge1}" y="${top - 14}" width="${edge2 - edge1}" height="${bottom - top + 14}" class="speed-zone zone-strong"/>` +
        `<rect x="${edge2}" y="${top - 14}" width="${right - edge2}" height="${bottom - top + 14}" class="speed-zone zone-drop"/>` +
        `<text x="${(left + edge1) / 2}" y="${top - 3}" text-anchor="middle" class="speed-zone-label">Under 5 min</text>` +
        `<text x="${(edge1 + edge2) / 2}" y="${top - 3}" text-anchor="middle" class="speed-zone-label">5 to 30 min</text>` +
        `<text x="${(edge2 + right) / 2}" y="${top - 3}" text-anchor="middle" class="speed-zone-label">After 30 min</text>` +
        `<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" class="speed-axis"/>` +
        `<path d="${path}" class="speed-curve"/>` +
        `<line class="speed-guide" y1="${top}" y2="${bottom}"/>` +
        `<circle class="speed-dot" r="7"/>${ticks}</svg>`;

    const widget = el('div', 'speed-widget iw');
    widget.innerHTML = '<label class="speed-label" for="speedSlider">Drag to set how long you take to respond to a new online lead</label>' +
        `<input type="range" id="speedSlider" class="speed-slider" min="0" max="${SPEED_STOPS.length - 1}" step="1" value="2">` +
        svg +
        '<div class="speed-readout" aria-live="polite"><div class="speed-when"></div><div class="speed-band"></div><p class="speed-detail"></p></div>' +
        '<p class="speed-caption">Illustrative shape only. The handbook defines three bands, not exact percentages.</p>';
    box.appendChild(widget);

    const slider = widget.querySelector('.speed-slider');
    const dot = widget.querySelector('.speed-dot');
    const guide = widget.querySelector('.speed-guide');
    const when = widget.querySelector('.speed-when');
    const bandEl = widget.querySelector('.speed-band');
    const detail = widget.querySelector('.speed-detail');

    function render() {
        const i = Number(slider.value);
        const stop = SPEED_STOPS[i];
        const key = speedBand(stop.minutes);
        dot.setAttribute('cx', xAt(i));
        dot.setAttribute('cy', yAt(stop.y));
        dot.setAttribute('data-band', key);
        guide.setAttribute('x1', xAt(i));
        guide.setAttribute('x2', xAt(i));
        widget.querySelectorAll('.speed-tick').forEach(t => t.classList.toggle('active', Number(t.dataset.i) === i));
        slider.setAttribute('aria-valuetext', `${stop.label}: ${SPEED_BANDS[key].name}`);
        when.textContent = `If you respond in ${stop.label}`;
        bandEl.textContent = SPEED_BANDS[key].name;
        bandEl.dataset.band = key;
        detail.textContent = SPEED_BANDS[key].detail;
    }
    slider.addEventListener('input', render);
    render();

    if (!essentialOnly()) setupResponseTimer(section);
}

// Backs the Field Note: a friend submits an inquiry, and the reader times each reply.
function setupResponseTimer(section) {
    const note = [...section.querySelectorAll('.box.field-note')]
        .find(b => b.textContent.includes('Test your own speed-to-lead'));
    if (!note) return;

    const card = el('div', 'box try-it speed-timer iw');
    card.innerHTML = '<div class="box-title">● TRY IT · TIME YOUR OWN RESPONSE</div>' +
        '<p>Press Start the moment your friend submits the inquiry, then press each button as the reply arrives.</p>' +
        '<div class="timer-clock" role="timer">0:00</div>' +
        '<div class="script-actions timer-actions"></div>' +
        '<ul class="timer-results"></ul>';
    note.after(card);
    card.querySelector('.box-title').after(interactiveHeader('Start the timer, then tap each button as the reply arrives.', 'response-timer', 'Response-time stopwatch'));

    const clock = card.querySelector('.timer-clock');
    const results = card.querySelector('.timer-results');
    const actions = card.querySelector('.timer-actions');
    const touches = [
        { key: 'text', label: 'Text arrived', name: 'Text', limitMin: 1, standard: 'automated first touch within 1 minute' },
        { key: 'email', label: 'Email arrived', name: 'Email', limitMin: 1, standard: 'automated first touch within 1 minute' },
        { key: 'call', label: 'Call arrived', name: 'Call', limitMin: 5, standard: 'live call within 5 minutes' }
    ];
    const start = el('button', 'btn-mini', 'Start');
    const reset = el('button', 'btn-mini', 'Reset');
    start.type = reset.type = 'button';
    const stampButtons = touches.map(t => {
        const b = el('button', 'btn-mini', t.label);
        b.type = 'button';
        b.disabled = true;
        b.addEventListener('click', () => stamp(t, b));
        return b;
    });
    actions.append(start, ...stampButtons, reset);

    let startedAt = null;
    let timerId = null;

    function stop() {
        clearInterval(timerId);
        timerId = null;
    }
    function tick() {
        if (!card.isConnected) { stop(); return; }
        clock.textContent = formatElapsed(performance.now() - startedAt);
    }
    function stamp(t, button) {
        const ms = performance.now() - startedAt;
        const minutes = ms / 60000;
        const meets = minutes <= t.limitMin;
        const item = el('li', meets ? 'timer-ok' : 'timer-slow');
        item.textContent = `${t.name}: ${formatElapsed(ms)}. ` +
            (meets ? `Meets the standard (${t.standard}).` : `Slower than the standard (${t.standard}). ${SPEED_BANDS[speedBand(minutes)].name}.`);
        results.appendChild(item);
        button.disabled = true;
        if (stampButtons.every(b => b.disabled)) stop();
    }
    start.addEventListener('click', () => {
        stop();
        results.replaceChildren();
        startedAt = performance.now();
        stampButtons.forEach(b => { b.disabled = false; });
        clock.textContent = '0:00';
        timerId = setInterval(tick, 500);
        start.textContent = 'Restart';
    });
    reset.addEventListener('click', () => {
        stop();
        startedAt = null;
        results.replaceChildren();
        stampButtons.forEach(b => { b.disabled = true; });
        clock.textContent = '0:00';
        start.textContent = 'Start';
    });
}

/* ---------- Ch. 5: nurture timeline explorer ---------- */

// Mirrors Appendix B.1 (new online lead, 90 days). Every third touch gives value, per the chapter.
const NURTURE_TOUCHES = [
    { n: 1, day: 0, channels: ['text', 'email'], label: 'Text + email', role: 'Respond', value: false,
        plan: 'Automated. Thanks for the inquiry about [property]. One easy question.',
        sample: 'Hi Jordan, it\'s Sam with [Brokerage]. Thanks for asking about 14 Maple Street. Are you thinking of buying soon, or just starting to look?' },
    { n: 2, day: 0, channels: ['call'], label: 'Call', role: 'Connect', value: false,
        plan: 'You call. Speed-to-lead script. Leave a short voicemail if no answer.',
        sample: 'Hi Jordan, Sam with [Brokerage]. I saw you asked about 14 Maple Street and wanted to say hello. What caught your eye about it?' },
    { n: 3, day: 1, channels: ['email'], label: 'Email', role: 'Give value', value: true,
        plan: 'Three similar homes and an offer to set up a search.',
        sample: 'Here are three homes like 14 Maple Street, with prices and photos. Want me to set up a search so new ones reach you as they list?' },
    { n: 4, day: 3, channels: ['text'], label: 'Text', role: 'Check in', value: false,
        plan: '"Did any of those catch your eye?"',
        sample: 'Did any of those homes catch your eye, Jordan?' },
    { n: 5, day: 7, channels: ['call'], label: 'Call', role: 'Qualify', value: false,
        plan: 'Qualify: timeline, motivation, financing, representation.',
        sample: 'So I can send the right things: when are you hoping to be settled in? And what\'s prompting the move?' },
    { n: 6, day: 10, channels: ['email'], label: 'Email', role: 'Give value', value: true,
        plan: 'Value piece: buyer guide or neighborhood report.',
        sample: 'I pulled together a short guide to the Maple Street area: what homes sold for and how fast. Hope it helps.' },
    { n: 7, day: 14, channels: ['text'], label: 'Text', role: 'Stay visible', value: false,
        plan: 'Market note with one number.',
        sample: 'Homes near Maple Street are selling in a median of [X] days this month. Want the full picture?' },
    { n: 8, day: 21, channels: ['call'], label: 'Call', role: 'Offer a consultation', value: false,
        plan: 'Check in; offer a consultation.',
        sample: 'Just checking in. If it would help to talk through your options, I can set aside 20 minutes. No pressure.' },
    { n: 9, day: 30, channels: ['email'], label: 'Email', role: 'Give value', value: true,
        plan: 'Monthly market update.',
        sample: 'Here is this month\'s update for your area: median price, days on market and months of inventory.' },
    { n: 10, day: 45, channels: ['text'], label: 'Text', role: 'Match their search', value: false,
        plan: 'New listing or price change that fits their search.',
        sample: 'A new listing just came up that fits what you described: [address]. Want to see it?' },
    { n: 11, day: 60, channels: ['call'], label: 'Call', role: 'Check in', value: false,
        plan: '"Where are things at for you?"',
        sample: 'Hi Jordan, Sam here. Where are things at for you? Has your timeline changed?' },
    { n: 12, day: 75, channels: ['email'], label: 'Email', role: 'Give value', value: true,
        plan: 'Value piece: case study of a recent client.',
        sample: 'A recent client was in a spot like yours. Here is a short story of how it went and what they would do again.' },
    { n: 13, day: 90, channels: ['call'], label: 'Call', role: 'Final check-in', value: false,
        plan: 'Final check-in, then move to the quarterly database plan.',
        sample: 'I will keep sending the occasional update. Is there anything you would like more of, or less?' }
];

const ZONE = { first: 5, last: 12 };
const STOP_TOUCH = 2;
const NURTURE_FILTERS = [
    { key: 'all', label: 'All touches', test: () => true },
    { key: 'call', label: 'Calls', test: t => t.channels.includes('call') },
    { key: 'text', label: 'Texts', test: t => t.channels.includes('text') },
    { key: 'email', label: 'Emails', test: t => t.channels.includes('email') },
    { key: 'value', label: 'Value touches', test: t => t.value }
];

function touchNote(t) {
    if (t.n === NURTURE_TOUCHES.length) return 'After touch 13 the lead rolls into the Quarterly Call Plan. Nobody leaves your database unless they ask to.';
    if (t.n <= STOP_TOUCH) return 'This is where most new agents stop. The handbook says most conversions happen between touches 5 and 12.';
    if (t.n < ZONE.first) return 'Early touches build familiarity. Keep going: the conversions come later in the plan.';
    return 'Inside touches 5 to 12, where the handbook says most conversions happen.';
}

function setupNurtureTimeline(section) {
    if (section.dataset.page !== 'ch5') return;
    const box = [...section.querySelectorAll('.diagram-box')]
        .find(b => b.querySelector('.diagram-title')?.textContent.startsWith('Figure 5'));
    if (!box) return;
    box.querySelector('.nurture-static')?.remove();
    box.querySelector('.diagram-title').after(interactiveHeader('Tap any touch to see what to send. Use the filters to highlight a channel.', 'nurture-timeline', 'Nurture timeline explorer'));

    const lastDay = NURTURE_TOUCHES[NURTURE_TOUCHES.length - 1].day;
    const frontLoaded = NURTURE_TOUCHES.filter(t => t.day <= 14).length;
    const W = 600;
    const padX = 20;
    const xDay = d => padX + (d / lastDay) * (W - padX * 2);
    const stacked = {};
    const dots = NURTURE_TOUCHES.map(t => {
        const slot = stacked[t.day] = (stacked[t.day] ?? -1) + 1;
        return `<circle class="nurture-dot${t.value ? ' value' : ''}" data-n="${t.n}" cx="${xDay(t.day)}" cy="${34 + slot * 14}" r="${t.value ? 6.5 : 5}"/>`;
    }).join('');
    const marks = [0, 14, 30, 60, 90].map(d =>
        `<text x="${xDay(d)}" y="82" text-anchor="middle" class="nurture-tick">Day ${d}</text>`).join('');
    const ruler = `<svg viewBox="0 0 ${W} 90" class="nurture-ruler" role="img" aria-label="${frontLoaded} of ${NURTURE_TOUCHES.length} touches fall in the first 14 days of the 90-day plan">` +
        `<rect x="${xDay(0) - 8}" y="14" width="${xDay(14) - xDay(0) + 16}" height="54" rx="6" class="nurture-front"/>` +
        `<text x="${xDay(0) - 2}" y="10" class="nurture-front-label">${frontLoaded} of ${NURTURE_TOUCHES.length} touches in the first 14 days</text>` +
        `<line x1="${xDay(0)}" y1="62" x2="${xDay(lastDay)}" y2="62" class="nurture-axis"/>${dots}${marks}</svg>`;

    const widget = el('div', 'nurture-widget iw');
    widget.innerHTML = '<div class="nurture-filters" role="group" aria-label="Highlight touches"></div>' +
        ruler +
        '<div class="nurture-touches" role="group" aria-label="Touches in the 90-day plan"></div>' +
        '<p class="nurture-legend">Shaded, heavy-bordered touches (5 to 12) are where the handbook says most conversions happen. ' +
        'Touch 2 is where most new agents stop. Touches marked <strong>Value</strong> (amber underline, larger dot) give before they ask.</p>' +
        '<div class="nurture-detail" aria-live="polite"></div>';
    box.appendChild(widget);

    const filterHost = widget.querySelector('.nurture-filters');
    const touchHost = widget.querySelector('.nurture-touches');
    const detail = widget.querySelector('.nurture-detail');
    let selected = 5;
    let filter = NURTURE_FILTERS[0];

    const filterButtons = NURTURE_FILTERS.map(f => {
        const b = el('button', 'btn-mini', f.label);
        b.type = 'button';
        b.addEventListener('click', () => { filter = f; render(); });
        filterHost.appendChild(b);
        return b;
    });

    const touchButtons = NURTURE_TOUCHES.map(t => {
        const b = el('button', 'touch-btn');
        b.type = 'button';
        b.dataset.n = String(t.n);
        if (t.n >= ZONE.first && t.n <= ZONE.last) b.classList.add('in-zone');
        if (t.value) b.classList.add('value');
        b.setAttribute('aria-label', `Touch ${t.n}, day ${t.day}, ${t.label}${t.value ? ', value touch' : ''}${b.classList.contains('in-zone') ? ', in the conversion zone' : ''}`);
        b.append(
            el('span', 'touch-num', String(t.n)),
            el('span', 'touch-ch', t.label),
            el('span', 'touch-day', `Day ${t.day}`)
        );
        b.addEventListener('click', () => { selected = t.n; render(); });
        touchHost.appendChild(b);
        return b;
    });

    function renderDetail() {
        const t = NURTURE_TOUCHES[selected - 1];
        detail.replaceChildren();
        const head = el('div', 'nurture-head');
        head.append(el('strong', '', `Touch ${t.n} of ${NURTURE_TOUCHES.length} · Day ${t.day}`));
        const tags = el('span', 'nurture-tags');
        [t.label, t.role, t.value ? 'Value touch' : null].filter(Boolean).forEach(x => tags.appendChild(el('span', 'nurture-tag', x)));
        head.appendChild(tags);

        const planP = el('p');
        planP.append(el('strong', '', 'In the plan (Appendix B.1): '), document.createTextNode(t.plan));
        const sampleP = el('p', 'nurture-sample');
        sampleP.append(el('strong', '', 'Sample wording: '), document.createTextNode(`"${t.sample}"`));
        const noteP = el('p', 'nurture-note', touchNote(t));

        const nav = el('div', 'script-actions');
        const prev = el('button', 'btn-mini', '← Previous touch');
        const next = el('button', 'btn-mini', 'Next touch →');
        prev.type = next.type = 'button';
        prev.disabled = selected === 1;
        next.disabled = selected === NURTURE_TOUCHES.length;
        prev.addEventListener('click', () => { selected--; render(); });
        next.addEventListener('click', () => { selected++; render(); });
        nav.append(prev, next);

        detail.append(head, planP, sampleP, noteP, nav);
    }

    function render() {
        filterButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(NURTURE_FILTERS[i] === filter)));
        touchButtons.forEach((b, i) => {
            const t = NURTURE_TOUCHES[i];
            b.classList.toggle('dim', !filter.test(t));
            b.setAttribute('aria-pressed', String(t.n === selected));
        });
        widget.querySelectorAll('.nurture-dot').forEach(d => {
            const t = NURTURE_TOUCHES[Number(d.dataset.n) - 1];
            d.classList.toggle('selected', t.n === selected);
            d.classList.toggle('dim', !filter.test(t));
        });
        renderDetail();
    }
    render();
}
