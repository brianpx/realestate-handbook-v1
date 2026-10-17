const pages = ['cover', 'pref', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10', 'ch11', 'ch12', 'ch13', 'app-a', 'app-b', 'app-c', 'app-d', 'app-e', 'app-f'];
let currentPageIndex = 0;
const BASE_TITLE = document.title;

// Polite screen-reader message via the #pageStatus live region. Clearing first lets a
// repeated message be announced again.
function announce(message) {
    const region = document.getElementById('pageStatus');
    if (!region) return;
    region.textContent = '';
    setTimeout(() => { region.textContent = message; }, 50);
}

const navLabel = pageId => document.querySelector(`.nav-item[data-page="${pageId}"]`)?.textContent.trim() || pageId;

async function fetchChapter(pageId) {
    const response = await fetch(`chapters/${pageId}.html`);
    if (!response.ok) throw new Error('Chapter not found');
    return response.text();
}

const sectionHtml = (pageId, html) => `<div class="chapter-section" data-page="${pageId}">${html}</div>`;

async function loadChapter(pageId) {
    const container = document.getElementById('content-container');
    try {
        const html = await fetchChapter(pageId);
        container.innerHTML = sectionHtml(pageId, html);
        container.scrollTop = 0;
        document.getElementById('main-content').scrollTop = 0;
        await fillContinuous();
    } catch (err) {
        container.innerHTML = `<p role="alert" style="color:#dc2626;">Could not load chapter: ${pageId}</p>`;
        console.error(err);
    }
}

function updateActiveNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
    });
    const activeId = pages[currentPageIndex];
    const activeItem = document.querySelector(`.nav-item[data-page="${activeId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        activeItem.setAttribute('aria-current', 'page');
        document.title = `${activeItem.textContent.trim()} - ${BASE_TITLE}`;
    }
}

async function navigateTo(pageId) {
    const idx = pages.indexOf(pageId);
    if (idx === -1) return;
    currentPageIndex = idx;
    await loadChapter(pageId);
    updateActiveNav();
    announce(`Showing ${navLabel(pageId)}`);
    // move keyboard / screen-reader position to the new chapter instead of leaving it on the nav link
    const section = document.querySelector(`.chapter-section[data-page="${pageId}"]`);
    const target = section?.querySelector('h1, h2') || section;
    if (target) {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
    }
}

let extending = false;

// Adds one neighbouring chapter when the reader is near an edge. Returns true if it added one.
async function extendContinuous() {
    if (extending) return false;
    extending = true;
    try {
        const main = document.getElementById('main-content');
        const container = document.getElementById('content-container');
        const sections = container.querySelectorAll('.chapter-section');
        if (!sections.length) return false;

        const lastIdx = pages.indexOf(sections[sections.length - 1].dataset.page);
        if (main.scrollTop + main.clientHeight >= main.scrollHeight - 600 && lastIdx < pages.length - 1) {
            const id = pages[lastIdx + 1];
            container.insertAdjacentHTML('beforeend', sectionHtml(id, await fetchChapter(id)));
            return true;
        }

        const firstIdx = pages.indexOf(sections[0].dataset.page);
        if (main.scrollTop < 300 && firstIdx > 0) {
            const id = pages[firstIdx - 1];
            const html = await fetchChapter(id);
            const heightBefore = main.scrollHeight;
            container.insertAdjacentHTML('afterbegin', sectionHtml(id, html));
            // keep the reader's place when content is inserted above
            main.scrollTop += main.scrollHeight - heightBefore;
            return true;
        }
        return false;
    } catch (err) {
        console.error(err);
        return false;
    } finally {
        extending = false;
    }
}

async function fillContinuous() {
    while (await extendContinuous());
}

function updateCurrentFromScroll() {
    const mainTop = document.getElementById('main-content').getBoundingClientRect().top;
    let current = null;
    document.querySelectorAll('.chapter-section').forEach(sec => {
        if (sec.getBoundingClientRect().top <= mainTop + 80) current = sec.dataset.page;
    });
    const idx = pages.indexOf(current);
    if (idx !== -1 && idx !== currentPageIndex) {
        currentPageIndex = idx;
        updateActiveNav();
    }
}

function setupContinuousScroll() {
    const main = document.getElementById('main-content');
    let queued = false;
    main.addEventListener('scroll', () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(async () => {
            queued = false;
            updateCurrentFromScroll();
            await fillContinuous();
        });
    }, { passive: true });
}

function setupMenuToggle() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('menuToggle');
    const setOpen = open => {
        sidebar.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('menu-open')));
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => setOpen(false));
    });
    document.addEventListener('click', e => {
        if (!sidebar.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape' || !sidebar.classList.contains('menu-open')) return;
        setOpen(false);
        toggle.focus();
    });
}

// Formspree endpoint, e.g. 'https://formspree.io/f/xxxxxxxx'. While empty the gate stays off.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xoejragy';
const GATE_KEY = 'handbookAccess';

// This is lead capture, not security: chapter files remain publicly fetchable.
function setupGate() {
    const gate = document.getElementById('gate');
    if (!FORMSPREE_ENDPOINT) {
        console.warn('Email gate disabled: set FORMSPREE_ENDPOINT in js/app-with-cover.js');
        return;
    }
    try {
        if (localStorage.getItem(GATE_KEY)) return;
    } catch (err) {
        // storage blocked: fall through and show the gate
    }

    const form = document.getElementById('gateForm');
    const input = document.getElementById('gateEmail');
    const error = document.getElementById('gateError');
    const submit = document.getElementById('gateSubmit');
    const showError = msg => { error.textContent = msg; error.hidden = false; };

    // aria-modal alone doesn't stop Tab reaching the page behind the dialog
    const behind = document.querySelectorAll('.skip-link, #sidebar, #main-content');
    const setBehindInert = inert => behind.forEach(node => { node.inert = inert; });

    gate.hidden = false;
    setBehindInert(true);
    input.focus();

    form.addEventListener('submit', async e => {
        e.preventDefault();
        error.hidden = true;
        if (!input.checkValidity() || !input.value.trim()) {
            showError('Please enter a valid email address.');
            return;
        }
        submit.disabled = true;
        submit.textContent = 'Submitting…';
        try {
            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ email: input.value.trim(), _gotcha: form.elements._gotcha.value })
            });
            if (!response.ok) throw new Error(`Formspree responded ${response.status}`);
            try { localStorage.setItem(GATE_KEY, '1'); } catch (err) { /* unlocks for this visit only */ }
            gate.hidden = true;
            setBehindInert(false);
            document.getElementById('main-content').focus({ preventScroll: true });
        } catch (err) {
            console.error(err);
            showError('Something went wrong. Please try again.');
            submit.disabled = false;
            submit.textContent = 'Get Access';
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    setupGate();
    setupMenuToggle();
    setupContinuousScroll();
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });

    await loadChapter('cover');
    updateActiveNav();
});
