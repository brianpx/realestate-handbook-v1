// On phones the whole page scrolls (so Safari can tuck its toolbars away) and the header sticks to the top;
// on desktop the #main-content panel scrolls. scrollRoot() is whichever one is scrolling right now, and
// viewTop() is where the reading area begins (below the sticky header on phones).
const phoneLayout = window.matchMedia('(max-width: 900px)');
const scrollRoot = () => (phoneLayout.matches ? document.scrollingElement : document.getElementById('main-content'));
// While a phone dropdown is open the page is pinned in place (body fixed at its current offset). Scrolling
// then means moving that saved offset instead of the real scroll position.
let lockedScrollY = 0;
const isScrollLocked = () => document.documentElement.classList.contains('scroll-locked');
function scrollContentBy(delta) {
    if (isScrollLocked()) {
        lockedScrollY += delta;
        document.body.style.top = `-${lockedScrollY}px`;
    } else {
        scrollRoot().scrollTop += delta;
    }
}
const viewTop = () => (phoneLayout.matches
    ? document.getElementById('sidebar').getBoundingClientRect().bottom
    : document.getElementById('main-content').getBoundingClientRect().top);

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

const sectionHtml = (pageId, html) => `<div class="chapter-section" id="${pageId}" data-page="${pageId}">${html}</div>`;
let navLock = 0;
const lockNav = () => { navLock++; };
const unlockNav = () => { navLock = Math.max(0, navLock - 1); };
function pageFromHash() {
    const id = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    return pages.includes(id) ? id : null;
}

function showLoadError(container, pageId, retry) {
    let alert = document.getElementById('loadError');
    if (!alert) {
        alert = document.createElement('p');
        alert.id = 'loadError';
        alert.className = 'load-error';
        alert.setAttribute('role', 'alert');
    }
    alert.replaceChildren(document.createTextNode(`Could not load ${navLabel(pageId)}. `));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-mini';
    button.textContent = 'Try again';
    button.addEventListener('click', () => { alert.remove(); retry(); });
    alert.append(button);
    const first = container.querySelector('.chapter-section');
    if (first) first.before(alert);
    else container.prepend(alert);
}

async function loadChapter(pageId) {
    const container = document.getElementById('content-container');
    lockNav();
    try {
        const html = await fetchChapter(pageId);
        container.innerHTML = sectionHtml(pageId, html);
        container.scrollTop = 0;
        scrollRoot().scrollTop = 0;
        document.getElementById('loadError')?.remove();
        await fillContinuous();
        // Neighbours load above and below. Pin this chapter before the scroll spy may rewrite the hash.
        const opened = container.querySelector(`.chapter-section[data-page="${pageId}"]`);
        if (opened) {
            const delta = opened.getBoundingClientRect().top - viewTop();
            if (Math.abs(delta) > 1) scrollContentBy(delta);
        }
    } catch (err) {
        console.error(err);
        showLoadError(container, pageId, () => loadChapter(pageId));
    } finally {
        unlockNav();
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

async function navigateTo(pageId, options = {}) {
    const idx = pages.indexOf(pageId);
    if (idx === -1) return;
    lockNav();
    currentPageIndex = idx;
    if (!options.fromHistory && location.hash !== `#${pageId}`) history.pushState({ pageId }, '', `#${pageId}`);
    try {
        await loadChapter(pageId);
    } finally {
        unlockNav();
    }
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
    if (extending || isScrollLocked()) return false; // never reshuffle content under a pinned page
    extending = true;
    let loadingId = '';
    try {
        const main = scrollRoot();
        const container = document.getElementById('content-container');
        const sections = container.querySelectorAll('.chapter-section');
        if (!sections.length) return false;

        const lastIdx = pages.indexOf(sections[sections.length - 1].dataset.page);
        if (main.scrollTop + main.clientHeight >= main.scrollHeight - 600 && lastIdx < pages.length - 1) {
            const id = pages[lastIdx + 1];
            loadingId = id;
            container.insertAdjacentHTML('beforeend', sectionHtml(id, await fetchChapter(id)));
            return true;
        }

        const firstIdx = pages.indexOf(sections[0].dataset.page);
        if (main.scrollTop < 300 && firstIdx > 0) {
            const id = pages[firstIdx - 1];
            loadingId = id;
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
        showLoadError(document.getElementById('content-container'), loadingId || pages[0], () => fillContinuous());
        return false;
    } finally {
        extending = false;
    }
}

async function fillContinuous() {
    while (await extendContinuous());
}

function updateCurrentFromScroll() {
    const mainTop = viewTop();
    let current = null;
    document.querySelectorAll('.chapter-section').forEach(sec => {
        if (sec.getBoundingClientRect().top <= mainTop + 80) current = sec.dataset.page;
    });
    const idx = pages.indexOf(current);
    if (navLock || idx === -1 || idx === currentPageIndex) return;
    currentPageIndex = idx;
    updateActiveNav();
    const url = `#${current}`;
    if (location.hash !== url) history.replaceState({ pageId: current }, '', url);
}

function setupContinuousScroll() {
    let queued = false;
    const onScroll = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(async () => {
            queued = false;
            updateCurrentFromScroll();
            await fillContinuous();
        });
    };
    // only one of the two actually scrolls at a given width
    document.getElementById('main-content').addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
}

// Scrolling the main page slides the logo header out of the sidebar; back at the top it returns.
// Two thresholds so it does not flicker around a single scroll position.
function setupHeaderCollapse() {
    const sidebar = document.getElementById('sidebar');
    const header = sidebar.querySelector('.sidebar-header');
    const main = document.getElementById('main-content');
    // how far the header must slide up to be fully out of view; remeasured whenever its size can change
    const measure = () => sidebar.style.setProperty('--header-h', `${header.offsetHeight}px`);
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    header.querySelector('img')?.addEventListener('load', measure);
    document.fonts?.ready.then(measure);
    main.addEventListener('scroll', () => {
        if (phoneLayout.matches) return; // on phones the header scrolls away with the page by itself (sticky)
        const top = main.scrollTop;
        if (top > 60) sidebar.classList.add('header-collapsed');
        else if (top < 8) sidebar.classList.remove('header-collapsed');
    }, { passive: true });
}

// The menu button is a hamburger, or a cross while it has something to close: the open menu or the open
// search results.
function syncMenuIcon() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('menuToggle');
    const searching = sidebar.classList.contains('searching');
    const open = searching || sidebar.classList.contains('menu-open');
    toggle.textContent = open ? '\u2715' : '\u2630';
    toggle.setAttribute('aria-label', searching ? 'Close search results' : 'Table of contents');
    // On phones an open menu or search dropdown pins the page behind it: the body is fixed at the current
    // scroll offset (the one method iOS Safari honours), and the offset is restored when the dropdown closes.
    const lock = open && phoneLayout.matches;
    if (lock && !isScrollLocked()) {
        // a fixed body would drag the sticky header with it, so the header is fixed at the spot it occupies
        // now and the body gets padding for the room it took, leaving every pixel where it was
        lockedScrollY = window.scrollY;
        sidebar.style.top = `${sidebar.getBoundingClientRect().top}px`;
        document.body.style.paddingTop = `${sidebar.getBoundingClientRect().height}px`; // fractional on purpose: rounding shifts the page 1px
        document.body.style.top = `-${lockedScrollY}px`;
        document.documentElement.classList.add('scroll-locked');
    } else if (!lock && isScrollLocked()) {
        document.documentElement.classList.remove('scroll-locked');
        sidebar.style.top = '';
        document.body.style.paddingTop = '';
        document.body.style.top = '';
        window.scrollTo(0, lockedScrollY);
    }
}

function setupMenuToggle() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('menuToggle');
    const setOpen = open => {
        sidebar.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        syncMenuIcon();
    };
    toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('menu-open')));
    phoneLayout.addEventListener('change', syncMenuIcon);

    // Covers the page while a dropdown is open: taps land here instead of on the content underneath, and
    // tapping it dismisses whatever is open.
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    backdrop.addEventListener('click', e => {
        e.preventDefault();
        if (sidebar.classList.contains('searching')) toggle.click(); // the cross: closes the search results
        if (sidebar.classList.contains('menu-open')) setOpen(false);
    });
    document.body.append(backdrop);

    // Touch-scrolling is blocked everywhere except inside the dropdown lists, and there only while the list can
    // still move in the swipe direction, so a swipe never leaks through to the page (older iOS ignores
    // overscroll-behavior). These listeners must be non-passive to be allowed to cancel the scroll.
    let touchStartY = 0;
    document.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
    document.addEventListener('touchmove', e => {
        if (!isScrollLocked()) return;
        const list = e.target.closest('.nav-list, .search-results');
        if (!list) { e.preventDefault(); return; }
        const swipingDown = e.touches[0].clientY > touchStartY; // content moves down, so the list scrolls toward its top
        const atTop = list.scrollTop <= 0;
        const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 1;
        const scrollable = list.scrollHeight > list.clientHeight;
        if (!scrollable || (swipingDown && atTop) || (!swipingDown && atBottom)) e.preventDefault();
    }, { passive: false });

    // A Close bar pinned to the bottom of the phone dropdown, so the menu can be dismissed without choosing
    // anything. Hidden on desktop, where the list is always visible.
    const closeItem = document.createElement('li');
    closeItem.className = 'menu-close';
    closeItem.innerHTML = '<button type="button">Close menu</button>';
    closeItem.querySelector('button').addEventListener('click', () => { setOpen(false); toggle.focus(); });
    document.getElementById('navList').appendChild(closeItem);
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
const GATE_ATTEMPTS_KEY = 'handbookGateAttempts';
const GATE_MIN_GAP_MS = 1000;            // at least this long between submissions
const GATE_MAX_PER_HOUR = 5;             // and no more than this many in any hour
const HOUR_MS = 60 * 60 * 1000;

// Client-side throttle for the email form. It stops accidental double sends and casual hammering from one
// browser; it cannot stop a determined bot, which is what Formspree's own spam filtering and the honeypot are for.
let gateAttemptsInMemory = [];

function recentGateAttempts(now) {
    let stored = [];
    try {
        stored = JSON.parse(localStorage.getItem(GATE_ATTEMPTS_KEY) || '[]');
    } catch (err) {
        // storage blocked or corrupt: fall back to what this page load has seen
    }
    // an attempt lives in both places when storage works, so merge as a set rather than counting it twice
    return [...new Set([...stored, ...gateAttemptsInMemory])].filter(t => Number.isFinite(t) && now - t < HOUR_MS);
}

function recordGateAttempt(now) {
    const attempts = [...recentGateAttempts(now), now];
    gateAttemptsInMemory = attempts;
    try { localStorage.setItem(GATE_ATTEMPTS_KEY, JSON.stringify(attempts)); } catch (err) { /* memory copy still applies */ }
}

// Returns a message if the reader must wait before submitting again, otherwise null.
function gateThrottleMessage(now) {
    const attempts = recentGateAttempts(now);
    if (attempts.length >= GATE_MAX_PER_HOUR) {
        const minutes = Math.ceil((Math.min(...attempts) + HOUR_MS - now) / 60000);
        return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
    }
    const gap = attempts.length ? GATE_MIN_GAP_MS - (now - Math.max(...attempts)) : 0;
    const seconds = Math.ceil(gap / 1000);
    return gap > 0 ? `Please wait ${seconds} second${seconds === 1 ? '' : 's'} before trying again.` : null;
}

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

    const dismissGate = () => {
        try { localStorage.setItem(GATE_KEY, String(Date.now())); } catch (err) { /* unlocks for this visit only */ }
        gate.hidden = true;
        setBehindInert(false);
        document.getElementById('main-content').focus({ preventScroll: true });
    };
    document.getElementById('gateSkip').addEventListener('click', dismissGate);

    let sending = false;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (sending) return; // Enter key can submit even while the button is disabled
        error.hidden = true;
        if (!input.checkValidity() || !input.value.trim()) {
            showError('Please enter a valid email address.');
            return;
        }
        const wait = gateThrottleMessage(Date.now());
        if (wait) {
            showError(wait);
            return;
        }
        recordGateAttempt(Date.now()); // counts failures too, so retrying a broken request cannot spam either
        sending = true;
        submit.disabled = true;
        submit.textContent = 'Submitting…';
        try {
            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ email: input.value.trim(), _gotcha: form.elements._gotcha.value })
            });
            if (!response.ok) throw new Error(`Formspree responded ${response.status}`);
            dismissGate();
        } catch (err) {
            console.error(err);
            sending = false;
            submit.disabled = false;
            submit.textContent = 'Send me a note';
            if (gate.hidden) return;
            showError('Something went wrong. Please try again in a moment, or continue without email.');
            document.getElementById('gateSkip').focus();
        }
    });
}

// Keeps the reader's place while content is rebuilt. The anchor is the first heading on screen plus how
// far below the top edge it sits, which survives anything above it changing height.
const ANCHOR_HEADINGS = 'h2, h3, h4';
const headingText = node => node.textContent.replace(/\s+/g, ' ').trim();

function captureScrollAnchor() {
    const mainTop = viewTop();
    for (const section of document.querySelectorAll('.chapter-section')) {
        const seen = {};
        for (const node of section.querySelectorAll(ANCHOR_HEADINGS)) {
            const text = headingText(node);
            const occurrence = seen[text] = (seen[text] ?? -1) + 1;
            const top = node.getBoundingClientRect().top;
            if (node.closest('dialog') || top + node.offsetHeight <= mainTop) continue;
            return { page: section.dataset.page, text, occurrence, offset: top - mainTop };
        }
    }
    return null;
}

function applyScrollAnchor(anchor) {
    const section = anchor && document.querySelector(`.chapter-section[data-page="${anchor.page}"]`);
    const target = section && [...section.querySelectorAll(ANCHOR_HEADINGS)].filter(n => headingText(n) === anchor.text)[anchor.occurrence];
    if (!target) return;
    scrollContentBy(target.getBoundingClientRect().top - viewTop() - anchor.offset);
}

document.addEventListener('DOMContentLoaded', async () => {
    setupGate();
    setupMenuToggle();
    setupContinuousScroll();
    setupHeaderCollapse();
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });
    window.addEventListener('popstate', () => {
        const id = pageFromHash() || 'cover';
        if (pages[currentPageIndex] === id) return;
        navigateTo(id, { fromHistory: true });
    });

    const start = pageFromHash() || 'cover';
    currentPageIndex = pages.indexOf(start);
    await loadChapter(start);
    updateActiveNav();
    if (location.hash !== `#${start}`) history.replaceState({ pageId: start }, '', `#${start}`);
    // A shared link opens its chapter. The email field keeps focus while the gate is up.
    if (document.getElementById('gate').hidden) {
        const section = document.querySelector(`.chapter-section[data-page="${start}"]`);
        const target = section?.querySelector('h1, h2') || section;
        if (target) {
            target.tabIndex = -1;
            target.focus({ preventScroll: true });
        }
    }
});
