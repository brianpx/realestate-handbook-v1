const pages = ['pref', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10', 'ch11', 'ch12', 'ch13', 'app-a', 'app-b', 'app-c', 'app-d'];
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

// Wire up events
document.addEventListener('DOMContentLoaded', async () => {
    // Nav clicks
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.page));
    });

    document.getElementById('prevBtn').addEventListener('click', prevPage);
    document.getElementById('nextBtn').addEventListener('click', nextPage);

    // Load first page
    await loadChapter('pref');
    updateActiveNav();
    updateNavButtons();
});
