const pages = ['cover', 'pref', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10', 'ch11', 'ch12', 'ch13', 'app-a', 'app-b', 'app-c', 'app-d'];
let currentPageIndex = 0;

async function loadChapter(pageId) {
    const container = document.getElementById('content-container');
    try {
        const response = await fetch(`chapters/${pageId}.html`);
        if (!response.ok) throw new Error('Chapter not found');
        const html = await response.text();
        container.innerHTML = html;
        container.scrollTop = 0;
        document.getElementById('main-content').scrollTop = 0;
    } catch (err) {
        container.innerHTML = `<p style="color:#dc2626;">Could not load chapter: ${pageId}</p>`;
        console.error(err);
    }
}

function updateActiveNav() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeId = pages[currentPageIndex];
    const activeItem = document.querySelector(`.nav-item[data-page="${activeId}"]`);
    if (activeItem) activeItem.classList.add('active');
}

function updateNavButtons() {
    document.getElementById('prevBtn').disabled = (currentPageIndex === 0);
    document.getElementById('nextBtn').disabled = (currentPageIndex === pages.length - 1);
}

async function navigateTo(pageId) {
    const idx = pages.indexOf(pageId);
    if (idx === -1) return;
    currentPageIndex = idx;
    await loadChapter(pageId);
    updateActiveNav();
    updateNavButtons();
}

async function nextPage() {
    if (currentPageIndex < pages.length - 1) {
        currentPageIndex++;
        await loadChapter(pages[currentPageIndex]);
        updateActiveNav();
        updateNavButtons();
    }
}

async function prevPage() {
    if (currentPageIndex > 0) {
        currentPageIndex--;
        await loadChapter(pages[currentPageIndex]);
        updateActiveNav();
        updateNavButtons();
    }
}

const mobileQuery = window.matchMedia('(max-width: 900px)');
const SWIPE_THRESHOLD = 80;

// Swiping past the end (or start) of a page moves to the next (or previous) page.
// Edge state is captured at touchstart so a scroll that merely reaches the edge doesn't trigger it.
function setupSwipePaging() {
    const main = document.getElementById('main-content');
    let startY = null;
    let atTop = false;
    let atBottom = false;

    main.addEventListener('touchstart', e => {
        startY = e.touches[0].clientY;
        atTop = main.scrollTop <= 0;
        atBottom = main.scrollTop + main.clientHeight >= main.scrollHeight - 2;
    }, { passive: true });

    main.addEventListener('touchend', e => {
        if (startY === null || !mobileQuery.matches) return;
        const delta = e.changedTouches[0].clientY - startY;
        startY = null;
        if (delta <= -SWIPE_THRESHOLD && atBottom) nextPage();
        else if (delta >= SWIPE_THRESHOLD && atTop) prevPage();
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
}

document.addEventListener('DOMContentLoaded', async () => {
    setupMenuToggle();
    setupSwipePaging();
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.page));
    });

    document.getElementById('prevBtn').addEventListener('click', prevPage);
    document.getElementById('nextBtn').addEventListener('click', nextPage);

    await loadChapter('cover');
    updateActiveNav();
    updateNavButtons();
});
