// Learner features layered on top of the chapter pages: progress tracking, checklists,
// the weekly scorecard, and script / objection practice. Everything is stored in the
// reader's browser (localStorage), so it is per-device.

const STATE_KEY = 'handbookState';
const TRACKED_PAGES = pages.filter(id => id !== 'cover');

let memoryState = null;

function loadState() {
    if (memoryState) return memoryState;
    let parsed = null;
    try {
        parsed = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
    } catch (err) {
        // storage blocked or corrupt: start fresh
    }
    memoryState = Object.assign({ read: {}, checks: {}, scorecard: {}, scripts: {}, objections: {}, calc: {} }, parsed);
    return memoryState;
}

function saveState() {
    try {
        localStorage.setItem(STATE_KEY, JSON.stringify(loadState()));
    } catch (err) {
        // keeps working for this visit only
    }
}

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};

/* ---------- 1. Progress ---------- */

const readObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        markRead(entry.target.dataset.page);
        readObserver.unobserve(entry.target);
    });
}, { root: document.getElementById('main-content') });

function markRead(pageId) {
    const state = loadState();
    if (state.read[pageId]) return;
    state.read[pageId] = true;
    saveState();
    renderProgress();
}

function setupProgressUi() {
    const navList = document.getElementById('navList');
    const item = el('li', 'progress-item');
    item.innerHTML = '<div class="progress-head"><div class="progress-label" id="progressLabel"></div>' +
        '<button type="button" class="progress-reset" id="progressReset" title="Mark every section unread" aria-label="Reset sections read">Reset</button></div>' +
        '<div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" id="progressBar"><span id="progressFill"></span></div>';
    navList.insertBefore(item, navList.firstChild);
    item.querySelector('#progressReset').addEventListener('click', resetProgress);
    renderProgress();
}

function resetProgress() {
    const state = loadState();
    if (!Object.keys(state.read).length) return;
    state.read = {};
    saveState();
    renderProgress();
    // sentinels were unobserved once read; re-arm them so scrolling marks sections read again
    document.querySelectorAll('.read-sentinel').forEach(s => readObserver.observe(s));
}

function renderProgress() {
    const read = loadState().read;
    const done = TRACKED_PAGES.filter(id => read[id]).length;
    const pct = Math.round((done / TRACKED_PAGES.length) * 100);
    document.getElementById('progressLabel').textContent = `${done} of ${TRACKED_PAGES.length} sections read`;
    document.getElementById('progressFill').style.width = `${pct}%`;
    document.getElementById('progressBar').setAttribute('aria-valuenow', String(pct));
    document.querySelectorAll('.nav-item[data-page]').forEach(navItem => {
        navItem.classList.toggle('read', Boolean(read[navItem.dataset.page]));
    });
    renderResume();
    renderCheckpointRollup();
}

function nextUnreadPage() {
    const read = loadState().read;
    if (!TRACKED_PAGES.some(id => read[id])) return null;
    return TRACKED_PAGES.find(id => !read[id]) || null;
}

function renderResume() {
    const cover = document.querySelector('.chapter-section[data-page="cover"]');
    if (!cover) return;
    cover.querySelector('.resume-btn')?.remove();
    const target = nextUnreadPage();
    if (!target) return;
    const label = document.querySelector(`.nav-item[data-page="${target}"]`)?.textContent.trim() || target;
    const button = el('button', 'btn-nav resume-btn', `Continue: ${label} →`);
    button.addEventListener('click', () => navigateTo(target));
    const start = cover.querySelector('.btn-nav');
    start.parentElement.insertBefore(button, start);
    start.classList.add('btn-secondary');
}

function trackReading(section) {
    if (section.dataset.page === 'cover') return;
    const sentinel = el('div', 'read-sentinel');
    sentinel.dataset.page = section.dataset.page;
    section.appendChild(sentinel);
    readObserver.observe(sentinel);
}

/* ---------- 2. Checklists ---------- */

function setupChecklists(section) {
    const lists = section.querySelectorAll('.checklist[data-checklist]');
    if (!lists.length) return;
    const checks = loadState().checks;

    const updateAll = () => {
        let done = 0;
        let total = 0;
        lists.forEach(list => {
            const boxes = list.querySelectorAll('input[type="checkbox"]');
            const checked = [...boxes].filter(b => b.checked).length;
            done += checked;
            total += boxes.length;
            list.querySelector('.checklist-count').textContent = `${checked} of ${boxes.length} complete`;
            list.querySelector('.checklist-fill').style.width = `${(checked / boxes.length) * 100}%`;
        });
        const totalNode = section.querySelector('.checklist-total');
        if (totalNode) totalNode.textContent = `Overall: ${done} of ${total} complete (${Math.round((done / total) * 100)}%)`;
    };

    lists.forEach(list => {
        list.querySelectorAll('input[type="checkbox"]').forEach((box, i) => {
            const key = `${list.dataset.checklist}:${i}`;
            box.checked = Boolean(checks[key]);
            box.addEventListener('change', () => {
                checks[key] = box.checked;
                saveState();
                updateAll();
            });
        });
        const meter = el('div', 'checklist-meter');
        meter.innerHTML = '<div class="meter-bar"><span class="checklist-fill"></span></div><span class="checklist-count" role="status"></span>';
        list.appendChild(meter);
    });

    if (lists.length > 1) {
        const totalLine = el('p', 'checklist-total');
        totalLine.setAttribute('role', 'status');
        lists[0].parentElement.insertBefore(totalLine, lists[0].previousElementSibling);
    }
    if (section.dataset.page !== 'ch12') {
        const lead = section.querySelector('.checklist-total') || lists[0].previousElementSibling || lists[0];
        lead.parentElement.insertBefore(interactiveHeader('Tap items to check them off. Your progress saves on this device.', 'crm-checklists', 'CRM setup checklists'), lead);
    }
    updateAll();
}

/* ---------- 3. Weekly scorecard ---------- */

const WEEKS = 4;

function setupScorecard(section) {
    const table = section.querySelector('table.scorecard');
    if (!table) return;
    const data = loadState().scorecard;
    const rows = [...table.querySelectorAll('tbody tr[data-row]')];

    rows.forEach(row => {
        const cells = [...row.querySelectorAll('td')].slice(2);
        cells.forEach((cell, w) => {
            const input = el('input', 'score-input');
            input.type = 'number';
            input.min = '0';
            input.inputMode = 'decimal';
            input.dataset.label = `${row.firstElementChild.textContent}, week ${w + 1}`;
            input.setAttribute('aria-label', input.dataset.label);
            const key = `${row.dataset.row}:${w}`;
            if (data[key] !== undefined) input.value = data[key];
            input.addEventListener('input', () => {
                if (input.value === '') delete data[key];
                else data[key] = Number(input.value);
                saveState();
                refresh(true);
            });
            const badge = el('span', 'score-status');
            badge.setAttribute('aria-hidden', 'true');
            cell.append(input, badge);
        });
    });

    const footRow = el('tr', 'score-total');
    footRow.innerHTML = '<td>Targets hit</td><td></td>' + '<td></td>'.repeat(WEEKS);
    table.querySelector('tbody').appendChild(footRow);

    const toolbar = el('div', 'scorecard-tools');
    const chartHost = el('div', 'score-chart');
    const summary = el('div', 'visually-hidden');
    summary.setAttribute('aria-live', 'polite');
    let summaryTimer;
    const reset = el('button', 'btn-nav btn-secondary', 'Clear scorecard');
    reset.addEventListener('click', () => {
        if (!confirm('Clear every number on the scorecard?')) return;
        Object.keys(data).forEach(k => delete data[k]);
        saveState();
        table.querySelectorAll('.score-input').forEach(i => { i.value = ''; });
        refresh(true);
    });
    const print = el('button', 'btn-nav btn-secondary', 'Print');
    print.addEventListener('click', () => window.print());
    toolbar.append(reset, print);
    table.closest('.table-wrapper').after(chartHost, summary, toolbar);
    table.closest('.table-wrapper').before(interactiveHeader('Type your weekly numbers. Cells change colour against each target and the chart updates as you type. Saved on this device.', 'scorecard', 'Weekly activity scorecard'));

    function statusFor(row, w) {
        const value = data[`${row.dataset.row}:${w}`];
        if (value === undefined) return '';
        const mode = row.dataset.mode;
        if (mode === 'min') {
            const min = Number(row.dataset.min);
            if (value >= min) return 'hit';
            return value >= min / 2 ? 'close' : 'miss';
        }
        if (mode === 'growing' && w > 0) {
            const prev = data[`${row.dataset.row}:${w - 1}`];
            if (prev === undefined) return '';
            return value > prev ? 'hit' : 'miss';
        }
        return '';
    }

    const STATUS_TEXT = { hit: '✓ Hit', close: '~ Close', miss: '✗ Miss' };

    function refresh(announceChange = false) {
        const measurable = rows.filter(r => r.dataset.mode === 'min').length;
        const hitsPerWeek = [];
        for (let w = 0; w < WEEKS; w++) {
            let hits = 0;
            let entered = 0;
            rows.forEach(row => {
                const cell = row.querySelectorAll('td')[2 + w];
                const status = statusFor(row, w);
                cell.dataset.status = status;
                cell.querySelector('.score-status').textContent = STATUS_TEXT[status] ?? '';
                const input = cell.querySelector('.score-input');
                input.setAttribute('aria-label', status ? `${input.dataset.label}, ${STATUS_TEXT[status].slice(2).toLowerCase()}` : input.dataset.label);
                if (row.dataset.mode === 'min' && data[`${row.dataset.row}:${w}`] !== undefined) {
                    entered++;
                    if (status === 'hit') hits++;
                }
            });
            const total = footRow.querySelectorAll('td')[2 + w];
            total.textContent = entered ? `${hits} of ${measurable}` : '';
            hitsPerWeek.push(entered ? hits : null);
        }
        renderChart(hitsPerWeek, measurable);
        if (announceChange) {
            // debounced so typing "12" doesn't announce for "1" and then "12"
            clearTimeout(summaryTimer);
            summaryTimer = setTimeout(() => {
                const parts = hitsPerWeek.map((h, w) => (h === null ? null : `week ${w + 1}: ${h} of ${measurable} targets hit`)).filter(Boolean);
                summary.textContent = parts.length ? parts.join('. ') : 'Scorecard cleared';
            }, 700);
        }
    }

    function renderChart(hitsPerWeek, measurable) {
        if (hitsPerWeek.every(h => h === null)) {
            chartHost.textContent = 'Enter your numbers to see how many weekly targets you hit.';
            return;
        }
        const barW = 56;
        const gap = 24;
        const height = 120;
        const width = WEEKS * (barW + gap) + gap;
        let svg = `<svg viewBox="0 0 ${width} ${height + 40}" role="img" aria-label="Weekly targets hit out of ${measurable}" class="score-svg">`;
        hitsPerWeek.forEach((hits, w) => {
            const x = gap + w * (barW + gap);
            const h = hits === null ? 0 : Math.round((hits / measurable) * height);
            svg += `<rect x="${x}" y="${height - h + 10}" width="${barW}" height="${h}" rx="4" class="score-bar"/>`;
            svg += `<text x="${x + barW / 2}" y="${height - h + 4}" text-anchor="middle" class="score-label">${hits === null ? '' : hits}</text>`;
            svg += `<text x="${x + barW / 2}" y="${height + 30}" text-anchor="middle" class="score-axis">Wk ${w + 1}</text>`;
        });
        svg += '</svg>';
        chartHost.innerHTML = `<div class="score-chart-title">Weekly targets hit (out of ${measurable})</div>${svg}`;
    }

    refresh();
}

/* ---------- 4. Script and objection practice ---------- */

function setupScriptPractice(section) {
    const saved = loadState().scripts;
    section.querySelectorAll('.box.script').forEach(box => {
        const title = box.querySelector('.box-title');
        const key = title.textContent.trim();

        const body = el('div', 'script-body');
        [...box.childNodes].filter(n => n !== title).forEach(n => body.appendChild(n));
        box.appendChild(body);

        const actions = el('div', 'script-actions');
        const pill = el('span', 'interactive-pill');
        pill.innerHTML = '<span aria-hidden="true">◉ </span>INTERACTIVE';
        if (!section.querySelector('[data-widget="script-practice"]')) {
            box.dataset.widget = 'script-practice';
            box.tabIndex = -1;
        }
        const copy = el('button', 'btn-mini', 'Copy script');
        const practice = el('button', 'btn-mini', 'Practice');
        actions.append(pill, copy, practice);

        const area = el('div', 'practice-area');
        area.hidden = true;
        const prompt = el('label', 'practice-label', 'Say it in your own words (the script is hidden):');
        const text = el('textarea', 'practice-text');
        text.rows = 4;
        text.value = saved[key] || '';
        text.addEventListener('input', () => { saved[key] = text.value; saveState(); });
        prompt.appendChild(text);
        const reveal = el('button', 'btn-mini', 'Reveal script to compare');
        area.append(prompt, reveal);
        box.append(actions, area);

        copy.addEventListener('click', async () => {
            const scriptText = body.innerText.split('Purpose:')[0].trim();
            try {
                await navigator.clipboard.writeText(scriptText);
                copy.textContent = 'Copied';
                announce('Script copied to clipboard');
            } catch (err) {
                copy.textContent = 'Copy failed';
                announce('Copy failed');
            }
            setTimeout(() => { copy.textContent = 'Copy script'; }, 1500);
        });
        practice.addEventListener('click', () => {
            const hide = !box.classList.contains('practicing');
            box.classList.toggle('practicing', hide);
            area.hidden = !hide;
            practice.textContent = hide ? 'Stop practicing' : 'Practice';
            reveal.hidden = !hide;
            if (hide) text.focus();
        });
        reveal.addEventListener('click', () => {
            box.classList.remove('practicing');
            reveal.hidden = true;
            area.hidden = false;
            practice.textContent = 'Practice again';
        });
    });
}

function setupObjectionTrainer(section) {
    if (section.dataset.page !== 'ch9') return;
    const table = [...section.querySelectorAll('.table-wrapper table')]
        .find(t => t.querySelector('th')?.textContent.trim() === 'OBJECTION');
    if (!table) return;
    const items = [...table.querySelectorAll('tbody tr')].map(tr => {
        const cells = tr.querySelectorAll('td');
        return { objection: cells[0].textContent.trim(), response: cells[1].textContent.trim(), goal: cells[2].textContent.trim() };
    });
    const mastered = loadState().objections;

    const card = el('div', 'box try-it objection-trainer');
    card.innerHTML = '<div class="box-title">● PRACTICE · OBJECTION TRAINER</div>' +
        '<p class="trainer-prompt" aria-live="polite"></p>' +
        '<label class="practice-label">Your response (acknowledge, clarify, respond, check):<textarea class="practice-text" rows="3"></textarea></label>' +
        '<div class="trainer-answer" tabindex="-1" hidden></div>' +
        '<div class="script-actions"></div>' +
        '<p class="trainer-score" role="status"></p>';
    table.closest('.table-wrapper').after(card);
    card.classList.add('iw');
    card.querySelector('.box-title').after(interactiveHeader('Read the objection, answer in your own words, reveal the framework, then rate yourself.', 'objection-trainer', 'Objection trainer'));

    const promptEl = card.querySelector('.trainer-prompt');
    const area = card.querySelector('.practice-text');
    const answer = card.querySelector('.trainer-answer');
    const actions = card.querySelector('.script-actions');
    const score = card.querySelector('.trainer-score');
    const showBtn = el('button', 'btn-mini', 'Show framework');
    const gotIt = el('button', 'btn-mini', 'Nailed it');
    const again = el('button', 'btn-mini', 'Needs work');
    const skip = el('button', 'btn-mini', 'Next objection');
    gotIt.hidden = again.hidden = true;
    actions.append(showBtn, gotIt, again, skip);

    let current = null;

    function pick(moveFocus = false) {
        const pool = items.filter(i => !mastered[i.objection]);
        const source = pool.length ? pool : items;
        const choices = source.filter(i => i !== current);
        current = (choices.length ? choices : source)[Math.floor(Math.random() * (choices.length || source.length))];
        promptEl.textContent = `Client says: ${current.objection}`;
        area.value = '';
        answer.hidden = true;
        gotIt.hidden = again.hidden = true;
        showBtn.hidden = false;
        score.textContent = `${items.filter(i => mastered[i.objection]).length} of ${items.length} objections mastered`;
        // the button that was clicked is now hidden, so keep focus on a visible control
        if (moveFocus) showBtn.focus();
    }

    showBtn.addEventListener('click', () => {
        answer.innerHTML = '';
        const resp = el('p'); resp.innerHTML = '<strong>Framework:</strong> ';
        resp.append(document.createTextNode(current.response));
        const goal = el('p'); goal.innerHTML = '<strong>Goal:</strong> ';
        goal.append(document.createTextNode(current.goal));
        answer.append(resp, goal);
        answer.hidden = false;
        showBtn.hidden = true;
        gotIt.hidden = again.hidden = false;
        answer.focus();
    });
    gotIt.addEventListener('click', () => { mastered[current.objection] = true; saveState(); pick(true); });
    again.addEventListener('click', () => { delete mastered[current.objection]; saveState(); pick(true); });
    skip.addEventListener('click', () => pick(true));
    pick();
}

/* ---------- Wiring ---------- */

function enhanceSection(section) {
    if (section.dataset.enhanced) return;
    section.dataset.enhanced = '1';
    trackReading(section);
    setupChecklists(section);
    setupScorecard(section);
    setupScriptPractice(section);
    setupObjectionTrainer(section);
    setupGoalCalculator(section);
    setupSpeedToLead(section);
    setupNurtureTimeline(section);
    setupCheckpoints(section);
    setupQualifyingDrill(section);
    setupPitfallCycle(section);
    setupErrorSelfScore(section);
    setupConsultationLab(section);
    setupFairHousingDrill(section);
    setupLeadSources(section);
    setupPipelineCalculator(section);
    setupRoadmap(section);
    setupTimeBlockPlanner(section);
    setupPostCloseScheduler(section);
    setupGlossary(section);
    if (section.dataset.page === 'cover') renderResume();
}

const contentObserver = new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.classList.contains('chapter-section')) enhanceSection(node);
    }));
});
contentObserver.observe(document.getElementById('content-container'), { childList: true });

setupProgressUi();
