// Practice-type tools: checkpoint self-tests, qualifying drill, pitfall cycle and self-score,
// consultation lab, Fair Housing drill, lead-source tools and the pipeline calculator.
// Each one rehearses something the chapter teaches; answers come from the chapter text.

/* ---------- Reusable one-at-a-time drill ---------- */

// items: { tag?, prompt, options[], answer (index), explain }. Picking an option checks it at once.
function choiceDrill(host, { stateKey, noun, items }) {
    const saved = widgetState(stateKey);
    let index = 0;
    let correct = 0;
    let answered = false;

    const frame = el('div', 'drill');
    host.appendChild(frame);

    function renderItem() {
        const item = items[index];
        answered = false;
        frame.replaceChildren();
        const progress = el('div', 'drill-progress', `${noun} ${index + 1} of ${items.length} · ${correct} correct so far`);
        frame.appendChild(progress);
        if (item.tag) frame.appendChild(el('span', 'drill-tag', item.tag));
        const quote = el('blockquote', 'drill-prompt', item.prompt);
        frame.appendChild(quote);
        const group = el('div', 'drill-options');
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', item.question || 'Choose one');
        const feedback = el('div', 'drill-feedback');
        feedback.setAttribute('aria-live', 'polite');
        const buttons = item.options.map((label, i) => {
            const b = el('button', 'btn-mini drill-option', label);
            b.type = 'button';
            b.addEventListener('click', () => {
                if (answered) return;
                answered = true;
                const right = i === item.answer;
                if (right) correct++;
                buttons.forEach((x, j) => {
                    x.disabled = true;
                    if (j === item.answer) x.classList.add('is-right');
                    else if (j === i) x.classList.add('is-wrong');
                });
                feedback.className = `drill-feedback ${right ? 'ok' : 'no'}`;
                feedback.replaceChildren(
                    el('strong', '', right ? '✓ Correct. ' : `✗ Not quite. The answer is "${item.options[item.answer]}". `),
                    document.createTextNode(item.explain)
                );
                const next = el('button', 'btn-mini', index === items.length - 1 ? 'See your result' : `Next ${noun.toLowerCase()} →`);
                next.type = 'button';
                next.addEventListener('click', () => {
                    if (index === items.length - 1) renderDone();
                    else { index++; renderItem(); }
                });
                feedback.appendChild(el('div', 'script-actions')).appendChild(next);
                next.focus();
            });
            group.appendChild(b);
            return b;
        });
        frame.append(group, feedback);
    }

    function renderDone() {
        saved.best = Math.max(saved.best ?? 0, correct);
        saveState();
        frame.replaceChildren();
        frame.appendChild(el('div', 'drill-score', `${correct} of ${items.length} correct`));
        frame.appendChild(el('p', '', correct === items.length
            ? 'Clean sweep. Reread the chapter section if any of these felt like a guess.'
            : 'Reread the explanations for the ones you missed, then run it again.'));
        if (saved.best !== undefined) frame.appendChild(el('p', 'calc-note', `Your best score on this device: ${saved.best} of ${items.length}.`));
        const again = el('button', 'btn-mini', 'Try again');
        again.type = 'button';
        again.addEventListener('click', () => { index = 0; correct = 0; renderItem(); });
        frame.appendChild(el('div', 'script-actions')).appendChild(again);
    }

    renderItem();
}

/* ---------- Checkpoint self-tests (every chapter) ---------- */

// Key points for each Checkpoint question, taken from the chapter text. { reflect } = personal question.
const CHECKPOINT_ANSWERS = {
    ch1: [
        ['Leading indicators you control: conversations held, appointments set, follow-up tasks completed (contacts added counts too).',
            'None is a closing because closings lag. They do not respond for 60 to 120 days, and goals set only on closings discourage new agents.'],
        ['Work backward: goal ÷ average commission = closings, then × appointments per closing, × conversations per appointment, ÷ working weeks.',
            'With the book\'s example ($80,000 goal, $6,500 commission) that is about 16 conversations a week, or 3 to 4 a day. The calculator above does it with your numbers.'],
        ['Open your CRM first, every morning, and update it before you stop working.',
            'Chapter 4 adds what to look at first: new leads overnight, tasks due today and Opportunities that moved.']
    ],
    ch2: [
        ['Trust is already built, and the cost is only your time.', 'Sphere contacts convert at five to ten times the rate of a portal lead.',
            'Portal inquirers have no relationship with you and have often inquired with several agents at once.'],
        ['Speed: a fast response to every inquiry.', 'Persistence: a long nurture plan, because most online leads are 6 to 18 months from a transaction.',
            'A follow-up system already built and tested on your sphere.'],
        ['Follow up with every visitor within 24 hours.', 'A text the same evening and a call the next morning is the standard.',
            'Put every visitor on a follow-up plan.']
    ],
    ch3: [
        ['You are the local expert.', 'You are the person who will take care of them.', 'Then check your own recent posts against both.'],
        ['Coming soon.', 'Just listed.', 'Open house.', 'Under contract.', 'Just sold (the best seller-lead post you can make).'],
        ['If a new lead arrived at 9 p.m. tonight, they would get an immediate automated reply, a call before 9 a.m., and a 90-day plan without you having to remember.',
            'If not, buying leads is buying a leak.']
    ],
    ch4: [
        ['Profile and Marketing Profile.', 'Import and tag contacts (deduplicate; tag by relationship and source).', 'Create or download follow-up plans.',
            'Set lead routing rules if you are on a team.', 'Customize the Opportunities pipeline.', 'Install the mobile app and turn on notifications.'],
        ['A lead you already have is worth more than one you have not met yet.'],
        ['An automated first touch (text and email) within one minute.', 'A live call within five minutes when possible, and always the same day.']
    ],
    ch5: [
        ['Front-loaded: four or five touches in the first two weeks.', 'Mixed channel: calls, texts and emails in rotation.',
            'Value every third touch.', 'Long: at least 90 days, then roll into the quarterly plan.'],
        ['Timeline: when do they want to move?', 'Motivation: why now?', 'Financing: pre-approved, cash, or need a lender introduction?',
            'Representation: is another agent already helping them?'],
        ['No real two-way conversation in 14 days and no scheduled next step.']
    ],
    ch6: [
        ['New lead by phone: a 10-minute conversation now, or a scheduled call today.', 'New lead by text: a time for a call.',
            'Sphere referral ask: a name and permission to reach out, or "I\'ll keep you in mind."', 'Buyer consultation opening: their agreement, then your questions.',
            'Seller consultation opening: their goals, then comparables, your marketing plan, then the listing agreement.',
            '"I\'m just looking": their email and a follow-up plan.', 'Post-close referral request: a name, or a review on your Agent Site.'],
        ['Say their name and the specific thing they asked about.', 'Ask one question at the end.', 'Stop talking after the question and wait.'],
        { reflect: 'Use the Practice button on the seller opening to hide the script and say it in your own words. Reading is not rehearsal.' }
    ],
    ch7: [
        { reflect: 'Use the self-score tool in this chapter. Your highest score is where to start, and the table names the chapter that fixes it.' },
        ['Slow follow-up → lost leads → empty pipeline → discouragement → unstructured days → back to slow follow-up.'],
        ['Install your CRM and follow-up plans.', 'Protect a daily prospecting and follow-up block.', 'Track activity, not closings.', 'Review every Friday.']
    ],
    ch8: [
        ['Every contact, note and task lives in your CRM.', 'If a conversation happened and it is not logged, treat it as not having happened and log it now.'],
        ['The morning is the only time of day nobody else wants. Clients, lenders and inspectors will ask for afternoons.',
            'Putting it in the same place every day means it never depends on how you feel.'],
        ['Per Table 8.2: outbound calls 40 to 60, conversations 15 to 25, follow-ups completed 30 to 50, appointments set 3 to 6, open houses or events 1, database updates daily.']
    ],
    ch9: [
        ['Frame, ask, listen, present, agree.', 'Asking and listening (steps 2 and 3) should take at least half the meeting.'],
        ['Acknowledge. Clarify. Respond. Check.'],
        ['The date, who was there, what was discussed, what was decided, and what happens next.']
    ],
    ch10: [
        ['Closing day: handwritten note and small gift; ask for the introduction.', '1 week: a call to catch problems early.',
            '30 days: a call or visit, and ask for a review.', 'Quarterly: a call with a reason.', 'Home anniversary: a card or call with an updated home value.',
            'Annually: a client appreciation event or personal gift.'],
        ['Would the person be glad to receive it if they were never going to move again?'],
        ['Send one useful piece of market information to everyone.', 'Call in small batches with a simple "thinking of you" and one question.',
            'Put everyone you reach back on the quarterly plan.']
    ],
    ch11: [
        ['Usually at first substantive contact, but your state sets the form and the timing.', 'Look both up in your first week and confirm with your broker.'],
        ['Race, color, religion, national origin, sex, familial status and disability.'],
        ['Point them to objective sources on schools, crime statistics and amenities rather than offering your opinion of the people.']
    ],
    ch12: [
        ['Day 30: CRM set up, contacts tagged, follow-up plans live, 50 sphere conversations, 1 open house, speed-to-lead tested.',
            'Day 60: morning block held 4 of 5 days, 15 to 25 conversations a week, first consultations held, buyer agreement signed.',
            'Day 90: 5 or more active opportunities, first contract written, post-close plan built, lead sources evaluated.'],
        ['Conversations held.', 'Appointments set.', 'Follow-ups completed.', 'Pipeline value.'],
        ['Which source produced the most appointments per hour spent?', 'Which follow-up plan got the most replies?', 'Where did leads stall in the pipeline?',
            'What one change will I make this month?']
    ]
};
const CHECKPOINT_TOTAL = Object.values(CHECKPOINT_ANSWERS).reduce((n, list) => n + list.length, 0);

function checkpointConfident() {
    return Object.values(widgetState('checkpoints')).filter(v => v.status === 'got').length;
}

function renderCheckpointRollup() {
    const host = document.querySelector('.progress-item');
    if (!host) return;
    let node = host.querySelector('#checkpointRollup');
    if (!node) {
        node = el('div', 'progress-sub');
        node.id = 'checkpointRollup';
        host.appendChild(node);
    }
    node.textContent = `${checkpointConfident()} of ${CHECKPOINT_TOTAL} checkpoint questions confident`;
}

function setupCheckpoints(section) {
    const page = section.dataset.page;
    const answers = CHECKPOINT_ANSWERS[page];
    if (!answers) return;
    const box = [...section.querySelectorAll('.box.checkpoint')]
        .find(b => b.querySelector('.box-title')?.textContent.includes('CHECKPOINT'));
    if (!box) return;
    const questions = box.innerHTML.replace(/<div class="box-title">.*?<\/div>/s, '')
        .split(/<br\s*\/?>/i)
        .map(part => part.replace(/<[^>]+>/g, '').replace(/^[\s•]+/, '').trim())
        .filter(Boolean);
    if (questions.length !== answers.length) return;

    const saved = widgetState('checkpoints');
    const title = box.querySelector('.box-title');
    box.replaceChildren(title);
    box.classList.add('iw');
    const head = interactiveHeader('Answer in your own words first, then check the key points. Your answers save on this device.', 'checkpoint', 'Checkpoint self-test');
    const count = el('span', 'cp-count');
    head.appendChild(count);
    box.appendChild(head);

    const updateCount = () => {
        const got = questions.filter((_, i) => saved[`${page}:${i}`]?.status === 'got').length;
        count.textContent = `${got} of ${questions.length} confident`;
        renderCheckpointRollup();
    };

    questions.forEach((question, i) => {
        const key = `${page}:${i}`;
        const entry = saved[key] ?? (saved[key] = {});
        const answer = answers[i];
        const item = el('div', 'cp-item');
        item.appendChild(el('div', 'cp-q', question));

        const label = el('label', 'practice-label', 'Your answer');
        const text = el('textarea', 'practice-text');
        text.rows = 2;
        text.value = entry.text || '';
        text.addEventListener('input', () => { entry.text = text.value; saveState(); });
        label.appendChild(text);
        item.appendChild(label);

        const keyBox = el('div', 'cp-key');
        keyBox.hidden = true;
        if (Array.isArray(answer)) {
            keyBox.appendChild(el('strong', '', 'Key points from the chapter'));
            const ul = el('ul');
            answer.forEach(point => ul.appendChild(el('li', '', point)));
            keyBox.appendChild(ul);
        } else {
            keyBox.appendChild(el('p', '', answer.reflect));
        }

        const rate = el('div', 'script-actions');
        rate.setAttribute('role', 'group');
        rate.setAttribute('aria-label', 'How did you do?');
        const got = el('button', 'btn-mini', 'I\'ve got it');
        const review = el('button', 'btn-mini', 'Review this');
        got.type = review.type = 'button';
        rate.hidden = !entry.status;
        const paint = () => {
            got.setAttribute('aria-pressed', String(entry.status === 'got'));
            review.setAttribute('aria-pressed', String(entry.status === 'review'));
            updateCount();
        };
        [[got, 'got'], [review, 'review']].forEach(([button, status]) => button.addEventListener('click', () => {
            entry.status = status;
            saveState();
            paint();
        }));
        rate.append(got, review);

        const reveal = el('button', 'btn-mini', Array.isArray(answer) ? 'Check against the book' : 'Show a tip');
        reveal.type = 'button';
        reveal.setAttribute('aria-expanded', 'false');
        reveal.addEventListener('click', () => {
            const open = keyBox.hidden;
            keyBox.hidden = !open;
            reveal.setAttribute('aria-expanded', String(open));
            reveal.textContent = open ? 'Hide key points' : (Array.isArray(answer) ? 'Check against the book' : 'Show a tip');
            if (open) rate.hidden = false;
        });
        const actions = el('div', 'script-actions');
        actions.appendChild(reveal);
        item.append(actions, keyBox, rate);
        box.appendChild(item);
        paint();
    });
    updateCount();
}

/* ---------- Ch. 5: qualifying drill ---------- */

const QUALIFY_FIELDS = ['Timeline', 'Motivation', 'Financing', 'Representation'];
const QUALIFY_SCENARIOS = [
    { quote: '“We\'re pre-approved already. Our lease ends in about 60 days, so we need to be in somewhere by then.”',
        answered: ['Timeline', 'Motivation', 'Financing'], stage: 'active',
        why: 'Pre-approved and moving in 60 days is an active opportunity, and active opportunities get calls this week. Whether another agent is already helping them is still unknown, so ask that next.' },
    { quote: '“Probably sometime next year, no rush. We haven\'t talked to a lender yet, and we\'re not working with anyone.”',
        answered: ['Timeline', 'Financing', 'Representation'], stage: 'nurture',
        why: 'A "maybe next year" lead belongs on a nurture plan. It is still valuable; it just needs different attention this week. You do not yet know why they are thinking about moving, so ask that next.' },
    { quote: '“I\'m relocating for a job that starts in six weeks, and I\'m paying cash. I don\'t have an agent yet.”',
        answered: ['Timeline', 'Motivation', 'Financing', 'Representation'], stage: 'active',
        why: 'All four answers are in: a short timeline, funds ready and no competing agent. Nothing is left to ask. Call and offer a consultation.' },
    { quote: '“I requested a home value report out of curiosity. We might sell in a couple of years, but nothing is definite.”',
        answered: ['Timeline'], stage: 'nurture',
        why: 'A potential seller a couple of years out is a long-term nurture contact (Seller Long-Term Nurture in Table 5.1). Start with motivation, then fill in the rest naturally over later conversations.' }
];

function setupQualifyingDrill(section) {
    if (section.dataset.page !== 'ch5') return;
    const table = [...section.querySelectorAll('.table-wrapper table')].find(t => t.querySelector('th')?.textContent.trim() === 'QUESTION');
    const anchor = [...section.querySelectorAll('p')].find(p => p.textContent.includes('place every lead in an Opportunity stage'));
    if (!table || !anchor) return;
    const phrasing = {};
    table.querySelectorAll('tbody tr').forEach(tr => { phrasing[tr.cells[0].textContent.trim()] = tr.cells[2].textContent.trim(); });

    const saved = widgetState('qualify');
    const card = el('div', 'box try-it iw');
    card.innerHTML = '<div class="box-title">● PRACTICE · QUALIFY AND STAGE A LEAD</div>';
    card.appendChild(interactiveHeader('Read each lead, tick the questions already answered, then choose where the lead belongs.', 'qualifying-drill', 'Qualifying drill'));
    anchor.after(card);
    const body = el('div', 'drill');
    card.appendChild(body);
    let index = 0;

    function render() {
        const s = QUALIFY_SCENARIOS[index];
        const done = Object.keys(saved).length;
        body.replaceChildren();
        body.appendChild(el('div', 'drill-progress', `Lead ${index + 1} of ${QUALIFY_SCENARIOS.length} · ${done} done`));
        body.appendChild(el('blockquote', 'drill-prompt', s.quote));

        const fs1 = el('fieldset', 'drill-fieldset');
        fs1.appendChild(el('legend', '', 'Which questions has this person already answered?'));
        const boxes = QUALIFY_FIELDS.map(name => {
            const label = el('label', 'opt-item');
            const input = el('input');
            input.type = 'checkbox';
            input.value = name;
            label.append(input, el('span', '', name));
            fs1.appendChild(label);
            return input;
        });
        const fs2 = el('fieldset', 'drill-fieldset');
        fs2.appendChild(el('legend', '', 'Where does this lead belong this week?'));
        const radios = [['active', 'Active opportunity (gets calls)'], ['nurture', 'Nurture (follow-up plan)']].map(([value, text]) => {
            const label = el('label', 'opt-item');
            const input = el('input');
            input.type = 'radio';
            input.name = `stage-${index}`;
            input.value = value;
            label.append(input, el('span', '', text));
            fs2.appendChild(label);
            return input;
        });
        const feedback = el('div', 'drill-feedback');
        feedback.setAttribute('aria-live', 'polite');
        const check = el('button', 'btn-mini', 'Check my answer');
        check.type = 'button';
        check.addEventListener('click', () => {
            const stage = radios.find(r => r.checked)?.value;
            if (!stage) { feedback.className = 'drill-feedback no'; feedback.textContent = 'Choose a stage first.'; return; }
            const picked = boxes.filter(b => b.checked).map(b => b.value);
            const missed = QUALIFY_FIELDS.filter(f => s.answered.includes(f) !== picked.includes(f));
            const right = !missed.length && stage === s.stage;
            saved[index] = right;
            saveState();
            feedback.className = `drill-feedback ${right ? 'ok' : 'no'}`;
            feedback.replaceChildren(el('strong', '', right ? '✓ Correct. ' : '✗ Not quite. '));
            const lines = el('ul');
            QUALIFY_FIELDS.forEach(f => {
                const known = s.answered.includes(f);
                const flag = missed.includes(f) ? ' (you marked this the other way)' : '';
                lines.appendChild(el('li', '', `${f}: ${known ? 'answered' : 'still to ask'}${flag}`));
            });
            feedback.append(lines, el('p', '', `Stage: ${s.stage === 'active' ? 'active opportunity' : 'nurture'}. ${s.why}`));
            const open = QUALIFY_FIELDS.filter(f => !s.answered.includes(f));
            if (open.length) feedback.appendChild(el('p', 'nurture-sample', `Ask next (${open[0]}): ${phrasing[open[0]] || ''}`));
            const nav = el('div', 'script-actions');
            const next = el('button', 'btn-mini', index === QUALIFY_SCENARIOS.length - 1 ? 'Start over' : 'Next lead →');
            next.type = 'button';
            next.addEventListener('click', () => { index = (index + 1) % QUALIFY_SCENARIOS.length; render(); });
            nav.appendChild(next);
            feedback.appendChild(nav);
            check.disabled = true;
        });
        const actions = el('div', 'script-actions');
        actions.appendChild(check);
        body.append(fs1, fs2, actions, feedback);
    }
    render();
}

/* ---------- Ch. 7: pitfall cycle and self-score ---------- */

const CYCLE_NODES = [
    { name: 'Slow follow-up', text: 'Leads answered the next day, plans never launched, "I\'ll call them later."' },
    { name: 'Lost leads', text: 'The leads that would have converted go to the agent who called first.' },
    { name: 'Empty pipeline', text: 'Few active opportunities, so there is little to work and the weeks feel empty.' },
    { name: 'Discouragement', text: 'No visible progress, so the wait feels pointless and activity drops.' },
    { name: 'Unstructured days', text: 'Busy all day with errands, social media and email, but no conversations.' }
];
const CYCLE_TOOLS = [
    { name: 'CRM + follow-up plans', breaks: [0, 1], why: 'Follow-up becomes automatic, so leads are answered fast and nothing depends on memory.' },
    { name: 'Protected daily block', breaks: [4, 0], why: 'Structure replaces willpower: the block is on the calendar before the day fills up.' },
    { name: 'Activity tracking', breaks: [3], why: 'You see progress every week, so the 90-day wait is bearable.' },
    { name: 'Friday review', breaks: [1, 2], why: 'Quiet leads and a thin pipeline are caught while they are small drifts, not habits.' }
];

function setupPitfallCycle(section) {
    if (section.dataset.page !== 'ch7') return;
    const box = [...section.querySelectorAll('.diagram-box')].find(b => b.querySelector('.diagram-title')?.textContent.startsWith('Figure 6'));
    if (!box) return;
    box.querySelectorAll('p').forEach(p => p.remove());
    box.querySelector('.diagram-title').after(interactiveHeader('Switch the four parts of the one correction on and off to see which links of the loop each one interrupts.', 'pitfall-cycle', 'Pitfall cycle explorer'));

    const widget = el('div', 'cycle-widget iw');
    const toolHost = el('div', 'cycle-tools');
    toolHost.setAttribute('role', 'group');
    toolHost.setAttribute('aria-label', 'Parts of the one correction');
    const list = el('ol', 'cycle-list');
    const status = el('p', 'cycle-status');
    status.setAttribute('aria-live', 'polite');
    const active = new Set();

    const toolButtons = CYCLE_TOOLS.map((tool, i) => {
        const b = el('button', 'btn-mini', tool.name);
        b.type = 'button';
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => {
            if (active.has(i)) active.delete(i); else active.add(i);
            render();
        });
        toolHost.appendChild(b);
        return b;
    });
    const nodeEls = CYCLE_NODES.map(node => {
        const li = el('li', 'cycle-node');
        li.append(el('strong', '', node.name), el('span', 'cycle-text', node.text), el('span', 'cycle-badge'));
        list.appendChild(li);
        return li;
    });
    widget.append(toolHost, list, el('p', 'cycle-loop', '↺ …and back to Slow follow-up'), status);
    box.appendChild(widget);

    function render() {
        toolButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(active.has(i))));
        const interrupted = CYCLE_NODES.map(() => []);
        active.forEach(i => CYCLE_TOOLS[i].breaks.forEach(n => interrupted[n].push(CYCLE_TOOLS[i].name)));
        nodeEls.forEach((li, n) => {
            const badge = li.querySelector('.cycle-badge');
            li.classList.toggle('is-broken', interrupted[n].length > 0);
            badge.textContent = interrupted[n].length ? `Interrupted by ${interrupted[n].join(' and ')}` : '';
        });
        const count = interrupted.filter(x => x.length).length;
        if (!active.size) {
            status.textContent = 'With nothing installed, the loop runs on its own: each link causes the next.';
        } else {
            const reasons = [...active].map(i => `${CYCLE_TOOLS[i].name}: ${CYCLE_TOOLS[i].why}`).join(' ');
            status.textContent = `Interrupted at ${count} of ${CYCLE_NODES.length} links. ${reasons} Installing all four makes the loop hard to restart.`;
        }
    }
    render();
}

function setupErrorSelfScore(section) {
    if (section.dataset.page !== 'ch7') return;
    const table = [...section.querySelectorAll('.table-wrapper table')].find(t => t.querySelector('th')?.textContent.trim() === 'ERROR');
    const anchor = [...section.querySelectorAll('.box.try-it')].find(b => b.textContent.includes('Score yourself'));
    if (!table || !anchor) return;
    const errors = [...table.querySelectorAll('tbody tr')].map(tr => ({
        name: tr.cells[0].textContent.trim(), cost: tr.cells[2].textContent.trim(), fix: tr.cells[3].textContent.trim()
    }));
    const saved = widgetState('selfscore');

    const card = el('div', 'box try-it iw');
    card.innerHTML = '<div class="box-title">● SELF-SCORE · THE SIX ERRORS</div>';
    card.appendChild(interactiveHeader('Rate how often each error shows up in your week, from 1 (never) to 5 (every day).', 'error-self-score', 'Six-errors self-score'));
    const rows = el('div', 'score-rows');
    const result = el('div', 'score-result');
    result.setAttribute('aria-live', 'polite');
    errors.forEach((err, i) => {
        const fs = el('fieldset', 'score-row');
        fs.appendChild(el('legend', '', err.name));
        const options = el('div', 'score-options');
        for (let v = 1; v <= 5; v++) {
            const label = el('label', 'score-opt');
            const input = el('input');
            input.type = 'radio';
            input.name = `err-${i}`;
            input.value = String(v);
            input.checked = saved[i] === v;
            input.addEventListener('change', () => { saved[i] = v; saveState(); renderResult(); });
            label.append(input, el('span', '', String(v)));
            options.appendChild(label);
        }
        fs.appendChild(options);
        rows.appendChild(fs);
    });
    card.append(rows, el('p', 'calc-note', '1 = never, 5 = every day'), result);
    anchor.after(card);

    function renderResult() {
        result.replaceChildren();
        const scored = errors.map((e, i) => ({ ...e, score: saved[i] })).filter(e => e.score);
        if (!scored.length) { result.appendChild(el('p', 'calc-empty', 'Rate at least one error to see where to start.')); return; }
        const ranked = [...scored].sort((a, b) => b.score - a.score);
        const bars = el('div', 'score-bars');
        ranked.forEach(e => {
            const row = el('div', 'score-bar-row');
            const track = el('span', 'score-bar-track');
            const fill = el('span', 'score-bar-fill');
            fill.style.width = `${(e.score / 5) * 100}%`;
            track.appendChild(fill);
            row.append(el('span', 'score-bar-name', e.name), track, el('span', 'score-bar-num', String(e.score)));
            bars.appendChild(row);
        });
        const top = ranked[0];
        const chapter = /\(Ch\. (\d+)\)/.exec(top.fix)?.[1];
        const start = el('div', 'drill-feedback ok');
        start.appendChild(el('strong', '', `Start with: ${top.name}`));
        start.appendChild(el('p', '', `What it costs: ${top.cost}`));
        const fix = el('p', '', `Fix: ${top.fix} `);
        if (chapter) {
            const link = el('a', 'goto', `Go to Chapter ${chapter}`);
            link.href = '#';
            link.dataset.goto = `ch${chapter}`;
            fix.appendChild(link);
        }
        start.appendChild(fix);
        if (scored.length < errors.length) start.appendChild(el('p', 'calc-note', `You have rated ${scored.length} of ${errors.length} so far.`));
        result.append(bars, start);
    }
    renderResult();
}

/* ---------- Ch. 9: consultation lab ---------- */

const CONSULT_STEPS = ['Frame', 'Ask', 'Listen', 'Present', 'Agree'];
const CONSULT_DEFAULT = [5, 10, 5, 30, 10];
const CONSULT_CASES = [
    { tag: 'Buyer consultation', prompt: 'The agent opens by spreading out a stack of listings and explaining how offers work. She asks about budget around minute 40.',
        options: CONSULT_STEPS, answer: 1, question: 'Which step did the agent skip or rush?',
        explain: 'She went straight to presenting. The chapter warns that agents who skip the asking lose the client\'s trust before they have earned it. Timeline, motivation, financing and must-haves come first.' },
    { tag: 'Seller consultation', prompt: 'The agent asks about the sellers\' goals, nods, and moves straight to a price recommendation without saying anything back to them.',
        options: CONSULT_STEPS, answer: 2, question: 'Which step was missing?',
        explain: 'Listening means repeating back what you heard, such as "You need to be in the new city by August, and net proceeds matter more than top-line price." It shows you understood before you present.' },
    { tag: 'Buyer consultation', prompt: 'The meeting goes well. The agent ends with, "Think it over and call me if you have questions."',
        options: CONSULT_STEPS, answer: 4, question: 'Which step was missing?',
        explain: 'Agreeing means leaving with a next step: a buyer representation agreement, a lender introduction, a first showing date. "Call me" leaves the next move to the client.' },
    { tag: 'Seller consultation', prompt: 'The agent sits down and says, "Let me tell you why I\'m the best choice for your home." No agenda was mentioned.',
        options: CONSULT_STEPS, answer: 0, question: 'Which step was missing?',
        explain: 'Framing sets the agenda before anything else: say what you will cover and agree that it works for them (the opening scripts in Chapter 6).' }
];

function setupConsultationLab(section) {
    if (section.dataset.page !== 'ch9') return;
    const anchor = [...section.querySelectorAll('p')].find(p => p.textContent.startsWith('Table 9.1.'));
    if (!anchor) return;

    const card = el('div', 'box try-it iw');
    card.innerHTML = '<div class="box-title">● LAB · THE FIVE-STEP CONSULTATION</div>';
    card.appendChild(interactiveHeader('Rebalance a meeting, then spot where four sample consultations went wrong.', 'consultation-lab', 'Consultation lab'));
    anchor.after(card);

    const alloc = el('div', 'alloc');
    alloc.appendChild(el('h4', 'lab-title', '1. Spend the meeting well'));
    alloc.appendChild(el('p', '', 'Table 9.1 says asking and listening should take at least half the meeting. Drag the sliders until they do.'));
    const minutes = [...CONSULT_DEFAULT];
    const bar = el('div', 'alloc-bar');
    bar.setAttribute('role', 'img');
    const sliders = el('div', 'alloc-sliders');
    const verdict = el('p', 'alloc-verdict');
    verdict.setAttribute('aria-live', 'polite');
    const outputs = CONSULT_STEPS.map((name, i) => {
        const row = el('div', 'alloc-row');
        const id = `alloc-${i}`;
        const label = el('label', '', name);
        label.htmlFor = id;
        const input = el('input');
        input.type = 'range';
        input.id = id;
        input.min = '0';
        input.max = '60';
        input.step = '1';
        input.value = String(minutes[i]);
        const out = el('output', 'alloc-out');
        out.htmlFor = id;
        input.addEventListener('input', () => { minutes[i] = Number(input.value); render(); });
        row.append(label, input, out);
        sliders.appendChild(row);
        return out;
    });
    alloc.append(bar, sliders, verdict);

    function render() {
        const total = minutes.reduce((a, b) => a + b, 0);
        bar.replaceChildren();
        minutes.forEach((m, i) => {
            const seg = el('span', `alloc-seg seg-${i}`, m / (total || 1) > 0.12 ? CONSULT_STEPS[i] : '');
            seg.style.flexGrow = String(m);
            bar.appendChild(seg);
            outputs[i].textContent = `${m} min`;
        });
        const core = minutes[1] + minutes[2];
        const share = total ? Math.round((core / total) * 100) : 0;
        bar.setAttribute('aria-label', `Meeting of ${total} minutes. Asking and listening take ${share} percent.`);
        verdict.className = `alloc-verdict ${share >= 50 ? 'ok' : 'no'}`;
        verdict.textContent = total === 0
            ? 'Give the steps some time.'
            : `Asking and listening: ${core} of ${total} minutes (${share}%). ` +
              (share >= 50 ? '✓ That meets the "at least half" rule.' : '✗ Below half. Move time from presenting into asking and listening.');
    }
    render();
    card.appendChild(alloc);

    const spot = el('div', 'spot');
    spot.appendChild(el('h4', 'lab-title', '2. Spot the misstep'));
    card.appendChild(spot);
    choiceDrill(spot, { stateKey: 'consultMisstep', noun: 'Case', items: CONSULT_CASES });
}

/* ---------- Ch. 11: Fair Housing drill ---------- */

const FAIR_HOUSING_ITEMS = [
    { tag: 'In marketing', prompt: '"Great for families"', answer: 0,
        explain: 'It describes the ideal buyer, not the property, and points at familial status. Describe what the home has instead.' },
    { tag: 'In marketing', prompt: '"Four bedrooms, fenced yard, two blocks from the park"', answer: 1,
        explain: 'It describes the property itself. This is the chapter\'s own example of acceptable wording.' },
    { tag: 'In marketing', prompt: '"Perfect for young professionals"', answer: 0,
        explain: 'Another ideal-buyer description. The chapter names it alongside "great for families" as a problem.' },
    { tag: 'In marketing', prompt: '"Ideal for empty-nesters"', answer: 0,
        explain: 'It names who the home is for. Say what the home offers, such as a main-floor bedroom or a low-maintenance yard, and let buyers decide.' },
    { tag: 'In marketing', prompt: '"Step-free entry, wide doorways and a roll-in shower"', answer: 1,
        explain: 'These are features of the property, so describing them is describing the home. As always, confirm wording with your broker.' },
    { tag: 'In marketing', prompt: '"A safe, exclusive neighborhood with people just like you"', answer: 0,
        explain: 'It characterizes the neighborhood by who lives there, which the chapter says not to do.' },
    { tag: 'In conversation', prompt: 'A client asks, "Is this a good area?" You answer: "Oh, it\'s mostly young families. Really nice crowd."', answer: 0,
        explain: 'That is your opinion of the people. Point to objective sources on schools, crime statistics and amenities.' },
    { tag: 'In conversation', prompt: 'A client asks, "Is this a good area?" You answer: "Here are the school information, crime statistics and a list of nearby amenities from objective sources. Want me to pull them?"', answer: 1,
        explain: 'This is the chapter\'s approach: objective sources instead of a view of the residents.' },
    { tag: 'In service', prompt: 'You call back some inquiries within minutes with a full listing package, but send only an automated text to the ones you assume cannot afford much.', answer: 0,
        explain: 'Every inquiry should get the same response time, the same information and the same options.' }
];

function setupFairHousingDrill(section) {
    if (section.dataset.page !== 'ch11') return;
    const heading = [...section.querySelectorAll('h3')].find(h => h.textContent.trim() === 'Fair Housing');
    const list = heading?.nextElementSibling?.nextElementSibling;
    if (!list || list.tagName !== 'UL') return;

    const card = el('div', 'box try-it iw');
    card.innerHTML = '<div class="box-title">● PRACTICE · PROBLEM OR FINE?</div>';
    card.appendChild(interactiveHeader('Judge each phrase against the three rules above. Practice only: not legal advice, so ask your broker.', 'fair-housing-drill', 'Fair Housing drill'));
    list.after(card);
    choiceDrill(card, {
        stateKey: 'fairHousing', noun: 'Phrase',
        items: FAIR_HOUSING_ITEMS.map(item => ({ ...item, options: ['Problem', 'Fine as written'], question: 'Problem or fine?' }))
    });
}

/* ---------- Ch. 2: lead source range chart and cost calculator ---------- */

const LEAD_SOURCES = [
    { key: 'sphere', name: 'Sphere of influence and referrals', lo: 15, hi: 30, open: true, label: '15–30%+' },
    { key: 'zillow', name: 'Zillow Premier Agent', lo: 1, hi: 5, label: '1–5%' },
    { key: 'idx', name: 'Own IDX website and ads', lo: 2, hi: 6, label: '2–6%' },
    { key: 'open', name: 'Open houses', lo: 5, hi: 15, label: '5–15%' },
    { key: 'expired', name: 'Expired listings and FSBOs', lo: 3, hi: 8, label: '3–8%' }
];

function setupLeadSources(section) {
    if (section.dataset.page !== 'ch2') return;
    const anchor = [...section.querySelectorAll('p')].find(p => p.textContent.startsWith('Figure 2.'));
    if (!anchor) return;

    const card = el('div', 'box try-it iw');
    card.innerHTML = '<div class="box-title">● EXPLORE · COMPARE YOUR LEAD SOURCES</div>';
    card.appendChild(interactiveHeader('See the typical conversion ranges side by side, then enter your own spend, time and closings to find your cost per closed deal.', 'lead-sources', 'Lead source comparison'));
    anchor.after(card);

    const scale = 30;
    const chart = el('div', 'range-chart');
    chart.appendChild(el('h4', 'lab-title', 'Typical conversion rate (Figure 2)'));
    LEAD_SOURCES.forEach(s => {
        const row = el('div', 'range-row');
        const track = el('span', 'range-track');
        const fill = el('span', `range-fill${s.open ? ' is-open' : ''}`);
        fill.style.left = `${(s.lo / scale) * 100}%`;
        fill.style.width = `${((s.hi - s.lo) / scale) * 100}%`;
        track.appendChild(fill);
        row.append(el('span', 'range-name', s.name), track, el('span', 'range-label', s.label));
        chart.appendChild(row);
    });
    const axis = el('div', 'range-axis');
    ['0%', '10%', '20%', '30%+'].forEach(t => axis.appendChild(el('span', '', t)));
    chart.append(axis, el('p', 'calc-note', 'Typical industry figures that vary by market and by how well you follow up. Replace them with your own numbers after a few months.'));
    card.appendChild(chart);

    const saved = widgetState('sourceCost');
    saved.rows ??= {};
    const calc = el('div', 'cost-calc');
    calc.appendChild(el('h4', 'lab-title', 'Your cost per closed deal'));
    calc.appendChild(el('p', '', 'Pick a period (a month or a quarter) and use the same one for every source. Time counts: it is priced at a rate you choose.'));
    const rateLabel = el('label', 'cost-rate', 'Value of your time, $ per hour ');
    const rateField = amountInput({
        value: saved.rate, format: fmtNum,
        onValue: n => { if (n === undefined) delete saved.rate; else saved.rate = n; saveState(); refresh(); }
    });
    rateField.input.placeholder = '25';
    rateLabel.append(rateField.input, rateField.error);
    calc.appendChild(rateLabel);
    const rowsHost = el('div', 'cost-rows');
    calc.appendChild(rowsHost);
    const outputs = {};

    LEAD_SOURCES.forEach(s => {
        const rowData = saved.rows[s.key] ??= {};
        const row = el('fieldset', 'cost-row');
        row.appendChild(el('legend', '', s.name));
        [['spend', 'Money spent ($)', fmtNum], ['hours', 'Hours spent'], ['closings', 'Closings']].forEach(([field, text, format]) => {
            const label = el('label', 'cost-field', text);
            const { input, error } = amountInput({
                value: rowData[field], format,
                onValue: n => { if (n === undefined) delete rowData[field]; else rowData[field] = n; saveState(); refresh(); }
            });
            label.append(input, error);
            row.appendChild(label);
        });
        const out = el('div', 'cost-out');
        out.setAttribute('aria-live', 'polite');
        outputs[s.key] = out;
        row.appendChild(out);
        rowsHost.appendChild(row);
    });
    const summary = el('p', 'cost-summary');
    summary.setAttribute('aria-live', 'polite');
    calc.appendChild(summary);
    card.appendChild(calc);

    function refresh() {
        const hourly = saved.rate ?? 0;
        const results = [];
        LEAD_SOURCES.forEach(s => {
            const r = saved.rows[s.key];
            const out = outputs[s.key];
            const entered = r.spend !== undefined || r.hours !== undefined || r.closings !== undefined;
            if (!entered) { out.textContent = ''; return; }
            const total = (r.spend ?? 0) + (r.hours ?? 0) * hourly;
            if (r.closings > 0) {
                const per = total / r.closings;
                out.textContent = `${fmtMoney(total)} invested → ${fmtMoney(per)} per closed deal`;
                results.push({ name: s.name, per });
            } else {
                out.textContent = `${fmtMoney(total)} invested, no closings yet`;
            }
        });
        if (results.length < 2) {
            summary.textContent = results.length === 1 ? 'Enter a second source to compare.' : '';
            return;
        }
        results.sort((a, b) => a.per - b.per);
        summary.textContent = `Lowest cost per closed deal: ${results[0].name} (${fmtMoney(results[0].per)}). Highest: ${results[results.length - 1].name} (${fmtMoney(results[results.length - 1].per)}). ` +
            (hourly ? '' : 'Add a rate for your time to see the true comparison.');
    }
    refresh();
}

/* ---------- Ch. 12: pipeline value calculator ---------- */

const PIPELINE_TYPES = ['Active opportunity', 'Nurture'];
const QUIET_DAYS = 14;

function setupPipelineCalculator(section) {
    if (section.dataset.page !== 'ch12') return;
    const heading = [...section.querySelectorAll('h3')].find(h => h.textContent.trim() === 'Measure every week');
    const list = heading?.nextElementSibling?.nextElementSibling;
    if (!list || list.tagName !== 'UL') return;

    const saved = widgetState('pipeline');
    saved.rows ??= [{}];
    const card = el('div', 'box try-it iw');
    card.innerHTML = '<div class="box-title">● CALCULATOR · YOUR PIPELINE VALUE</div>';
    card.appendChild(interactiveHeader('List your contacts to total your pipeline value and see who needs a Monday call. Use initials if you prefer. Saved on this device only.', 'pipeline-calculator', 'Pipeline value calculator'));
    list.after(card);

    const stats = el('div', 'calc-stats');
    stats.setAttribute('role', 'status');
    const rowsHost = el('div', 'pipe-rows');
    const add = el('button', 'btn-mini', '+ Add a contact');
    add.type = 'button';
    add.addEventListener('click', () => { saved.rows.push({}); saveState(); renderRows(); });
    card.append(stats, rowsHost, el('div', 'script-actions'));
    card.lastChild.appendChild(add);
    card.appendChild(el('p', 'calc-note', `Pipeline value is the sum of likely commission across active opportunities. A contact with no real two-way conversation in ${QUIET_DAYS} days and no scheduled next step gets a call on Monday (Chapter 5).`));
    const flags = new Map();

    function renderRows() {
        rowsHost.replaceChildren();
        flags.clear();
        saved.rows.forEach((row, i) => {
            const fs = el('fieldset', 'pipe-row');
            fs.appendChild(el('legend', '', `Contact ${i + 1}`));
            const name = el('input', 'calc-input pipe-name');
            name.type = 'text';
            name.maxLength = 40;
            name.value = row.name ?? '';
            name.addEventListener('input', () => { row.name = name.value; saveState(); });
            const type = el('select', 'calc-input');
            PIPELINE_TYPES.forEach(t => { const o = el('option', '', t); o.value = t; type.appendChild(o); });
            type.value = row.type ?? PIPELINE_TYPES[0];
            let commissionValue = row.commission;
            let daysValue = row.days;
            const commission = amountInput({ value: row.commission, format: fmtNum, onValue: n => { commissionValue = n; update(); } });
            const days = amountInput({ value: row.days, onValue: n => { daysValue = n; update(); } });
            const next = el('input');
            next.type = 'checkbox';
            next.checked = Boolean(row.next);
            const flag = el('div', 'pipe-flag');
            flags.set(row, flag);
            const field = (text, ...controls) => { const l = el('label', 'cost-field', text); l.append(...controls); return l; };
            const nextLabel = el('label', 'opt-item');
            nextLabel.append(next, el('span', '', 'Next step scheduled'));
            const remove = el('button', 'btn-mini', 'Remove');
            remove.type = 'button';
            remove.setAttribute('aria-label', `Remove contact ${i + 1}`);
            remove.addEventListener('click', () => {
                saved.rows.splice(i, 1);
                if (!saved.rows.length) saved.rows.push({});
                saveState();
                renderRows();
            });
            const update = () => {
                row.type = type.value;
                if (commissionValue === undefined) delete row.commission; else row.commission = commissionValue;
                if (daysValue === undefined) delete row.days; else row.days = daysValue;
                row.next = next.checked;
                saveState();
                refresh();
            };
            [type, next].forEach(c => c.addEventListener('change', update));
            fs.append(field('Contact (initials ok)', name), field('Type', type), field('Likely commission ($)', commission.input, commission.error),
                field('Days since a real conversation', days.input, days.error), nextLabel, flag, remove);
            rowsHost.appendChild(fs);
        });
        refresh();
    }

    function refresh() {
        let value = 0;
        let activeCount = 0;
        let calls = 0;
        saved.rows.forEach(row => {
            const active = (row.type ?? PIPELINE_TYPES[0]) === PIPELINE_TYPES[0];
            if (active) { activeCount++; value += row.commission ?? 0; }
            const quiet = (row.days ?? 0) >= QUIET_DAYS && !row.next;
            if (quiet) calls++;
            const flag = flags.get(row);
            if (flag) {
                flag.textContent = quiet ? `⚑ Call Monday: ${row.days} days quiet, no next step` : '';
                flag.classList.toggle('is-flag', quiet);
            }
        });
        stats.replaceChildren(
            stat(fmtMoney(value), 'pipeline value'),
            stat(String(activeCount), `active ${activeCount === 1 ? 'opportunity' : 'opportunities'} (aim for 5+ by day 90)`),
            stat(String(calls), `${calls === 1 ? 'contact needs' : 'contacts need'} a Monday call`)
        );
    }
    function stat(value, label) {
        const tile = el('div', 'calc-stat');
        tile.append(el('div', 'calc-stat-value', value), el('div', 'calc-stat-label', label));
        return tile;
    }
    renderRows();
}
