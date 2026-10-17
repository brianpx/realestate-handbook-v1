// Sidebar search: indexes the headings and glossary terms of every chapter and lists jump links
// as the reader types. Loaded after interactive.js; uses pages / fetchChapter / navigateTo /
// navLabel / announce / el from the other (classic) scripts.

const SEARCH_SELECTOR = 'h2, h3, h4, dt, .diagram-title';
const SEARCH_MAX_RESULTS = 12;
// headings inside a closed dialog (the sample document) are not reachable by scrolling
const searchable = root => [...root.querySelectorAll(SEARCH_SELECTOR)].filter(node => !node.closest('dialog'));

let searchIndex = null;
let searchIndexLoading = null;

function buildSearchIndex() {
    searchIndexLoading ??= Promise.all(pages.map(async pageId => {
        const doc = new DOMParser().parseFromString(await fetchChapter(pageId), 'text/html');
        const seen = {};
        return searchable(doc).map(node => {
            const text = node.textContent.replace(/\s+/g, ' ').trim();
            // the nth heading with this exact text on the page, so repeated titles jump to the right one
            const occurrence = seen[text] = (seen[text] ?? -1) + 1;
            return { pageId, text, occurrence, lower: text.toLowerCase(), isTerm: node.tagName === 'DT' };
        }).filter(entry => entry.text);
    })).then(perPage => { searchIndex = perPage.flat(); });
    return searchIndexLoading;
}

function searchEntries(query) {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return searchIndex
        .filter(entry => words.every(w => entry.lower.includes(w)))
        .map(entry => ({ entry, rank: entry.lower.startsWith(words[0]) ? 0 : 1 }))
        .sort((a, b) => a.rank - b.rank)
        .slice(0, SEARCH_MAX_RESULTS)
        .map(r => r.entry);
}

async function jumpToEntry(entry) {
    await navigateTo(entry.pageId);
    const section = document.querySelector(`.chapter-section[data-page="${entry.pageId}"]`);
    const matches = searchable(section)
        .filter(node => node.textContent.replace(/\s+/g, ' ').trim() === entry.text);
    const target = matches[entry.occurrence];
    if (!target) return;
    target.scrollIntoView({ block: 'start' });
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
    target.classList.add('widget-found');
    setTimeout(() => target.classList.remove('widget-found'), 2200);
}

function setupSearch() {
    const sidebar = document.getElementById('sidebar');
    const box = el('div', 'nav-search');
    box.innerHTML = '<label class="visually-hidden" for="navSearch">Search the handbook</label>' +
        '<input type="search" id="navSearch" class="nav-search-input" placeholder="Search the handbook" aria-keyshortcuts="Control+K Meta+K" autocomplete="off" spellcheck="false">' +
        '<ul class="search-results" id="searchResults" aria-label="Search results" hidden></ul>' +
        '<div class="visually-hidden" id="searchStatus" role="status" aria-live="polite"></div>';
    document.querySelector('.sidebar-header').after(box);
    // on phones the menu button always sits to the right of the search field (it is hidden on desktop)
    box.append(document.getElementById('menuToggle'));

    const input = box.querySelector('input');
    const list = box.querySelector('#searchResults');
    const status = box.querySelector('#searchStatus');

    const closeResults = () => {
        list.hidden = true;
        list.textContent = '';
        sidebar.classList.remove('searching');
    };

    async function render() {
        const query = input.value.trim();
        if (!query) {
            closeResults();
            status.textContent = '';
            return;
        }
        sidebar.classList.add('searching');
        list.hidden = false;
        if (!searchIndex) {
            list.innerHTML = '<li class="search-empty">Loading…</li>';
            try {
                await buildSearchIndex();
            } catch (err) {
                console.error(err);
                searchIndexLoading = null;
                list.innerHTML = '<li class="search-empty">Search could not load. Try again.</li>';
                return;
            }
            if (input.value.trim() !== query) return; // reader kept typing; a later render wins
        }
        const results = searchEntries(query);
        list.textContent = '';
        if (!results.length) {
            list.innerHTML = '<li class="search-empty">No matches.</li>';
        }
        results.forEach(entry => {
            const li = el('li');
            const a = el('a', 'search-result');
            a.href = `#${entry.pageId}`;
            a.append(el('span', 'search-result-title', entry.text), el('span', 'search-result-where', `${entry.isTerm ? 'Glossary term · ' : ''}${navLabel(entry.pageId)}`));
            a.addEventListener('click', e => {
                e.preventDefault();
                input.value = '';
                closeResults();
                status.textContent = '';
                sidebar.classList.remove('menu-open');
                document.getElementById('menuToggle').setAttribute('aria-expanded', 'false');
                jumpToEntry(entry);
            });
            li.appendChild(a);
            list.appendChild(li);
        });
        status.textContent = results.length ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'No matches';
    }

    input.addEventListener('input', render);
    input.addEventListener('focus', () => { if (!searchIndexLoading) buildSearchIndex().catch(() => { searchIndexLoading = null; }); });
    input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {
            list.querySelector('a')?.focus();
            e.preventDefault();
        } else if (e.key === 'Escape' && input.value) {
            input.value = '';
            closeResults();
            e.stopPropagation(); // keeps the mobile menu's own Escape handler from also firing
        }
    });
    list.addEventListener('keydown', e => {
        const links = [...list.querySelectorAll('a')];
        const i = links.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') links[Math.min(i + 1, links.length - 1)]?.focus();
        else if (e.key === 'ArrowUp') (i > 0 ? links[i - 1] : input).focus();
        else if (e.key === 'Escape') { input.focus(); return; }
        else return;
        e.preventDefault();
    });
}

// Cmd+K (Mac) or Ctrl+K (elsewhere) jumps to the search box from anywhere on the page
document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
    const input = document.getElementById('navSearch');
    if (input.closest('[inert]')) return; // the email gate is up
    e.preventDefault();
    input.focus();
    input.select();
});

setupSearch();
