import { expect, test } from './fixtures';
import { LEGACY_PAGE_SLUGS } from '../lib/routes';

const PUBLIC = ['/', '/preview', '/about', '/support', '/pricing', '/privacy', '/terms', '/refunds', '/updates', '/signup', '/signin', '/subscribe/confirm'];
const PRODUCT = ['/handbook', '/handbook/start', '/account', '/account/authentication', '/account/billing'];

test.describe('public pages', () => {
  for (const path of PUBLIC) {
    test(`${path} loads with one h1, the public header and no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      expect((await page.goto(path))?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
      await expect(page.locator('#sidebar')).toHaveCount(0); // the handbook menu stays out of the marketing site
      expect(errors).toEqual([]);
    });
  }

  for (const path of ['/', '/pricing']) {
    test(`${path} lists every tool from Appendix E as what is inside`, async ({ page }) => {
      await page.goto(path);
      const index = page.locator('.pub-tool-index');
      await index.locator('summary').click();
      await expect(index.locator('summary')).toHaveText(/^Every interactive tool \(\d+\)$/);
      await expect(index.getByRole('rowheader', { name: 'Objection trainer' })).toBeVisible();
      await expect(index.getByRole('cell', { name: 'Chapter 9', exact: true })).toHaveCount(2); // consultation lab and objection trainer
      expect(await index.locator('tbody tr').count()).toBeGreaterThanOrEqual(18);
    });
  }

  test('the sales page has no purchase button until a price and checkout are configured', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'See plans and pricing' }).first()).toHaveAttribute('href', '/pricing');
    await expect(page.getByRole('link', { name: 'Try a sample lesson' }).first()).toHaveAttribute('href', '/preview');
    await expect(page.getByText('Purchase is not open yet').first()).toBeVisible();
    // the suite runs signed in: the hero welcomes the reader back instead of asking for the address again
    await expect(page.locator('[data-welcome-back]').getByRole('link', { name: 'Open the handbook' })).toHaveAttribute('href', '/handbook');
    await expect(page.locator('form[data-source="hero"]')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: /^Account menu for/ })).toBeVisible();
    await expect(page.locator('.pub-nav-cta')).toHaveCount(0);
  });

  test('the header avatar opens the account menu, and Escape closes it and returns focus', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.goto('/');
    const avatar = page.getByRole('button', { name: /^Account menu for/ });
    await avatar.click();
    const menu = page.getByRole('menu');
    await expect(menu).toContainText('reader@e2e.test');
    for (const [name, href] of [['Feedback', '/support?topic=feedback'], ['Home Page', '/'], ['Help', '/support'], ['Docs', '/handbook'], ['Changelog', '/updates']] as const) {
      await expect(menu.getByRole('menuitem', { name })).toHaveAttribute('href', href);
    }
    await menu.getByRole('menuitemradio', { name: 'Dark' }).click();
    await expect(menu).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(avatar).toBeFocused();
  });

  test.describe('signed out', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('the hero asks for an address, with the sample and pricing as text links, and the form returns at the end', async ({ page }) => {
      await page.goto('/');
      const hero = page.locator('form[data-source="hero"]');
      await expect(hero.getByRole('button', { name: 'Send me the free chapters' })).toBeVisible();
      await expect(hero.getByLabel(/Also email me occasional notes/)).not.toBeChecked(); // marketing is a separate choice (OD-22)
      await expect(page.getByRole('link', { name: 'Try the sample lesson without an email' }).first()).toHaveAttribute('href', '/preview');
      await expect(page.getByRole('link', { name: 'Pricing and availability' }).first()).toHaveAttribute('href', '/pricing');
      await expect(page.locator('form[data-source="final"]')).toBeVisible();
      await expect(page.locator('[data-welcome-back]')).toHaveCount(0);
      await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin');
    });

    test('editing the calculator offers the form once, after the effort', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('form[data-source="hero"]')).toHaveAttribute('data-ready', 'true');
      await expect(page.locator('[data-calculator-prompt]')).toHaveCount(0);
      await page.getByLabel('Yearly income goal').fill('120000');
      const prompt = page.locator('[data-calculator-prompt]');
      await expect(prompt).toContainText('Keep this number.');
      await expect(prompt.locator('form[data-source="calculator"]').getByRole('button', { name: 'Open Chapter 1' })).toBeVisible();
    });
  });

  // The comparison grid is shown from 768px up and the per-plan tabs below it; both come from lib/tiers.ts.
  test('the pricing page compares Free, Basic and Pro and sells nothing while purchase is closed', async ({ page }) => {
    await page.goto('/pricing');
    const table = page.locator('section[aria-labelledby="plansTitle"]');
    await expect(table.getByRole('heading', { name: 'Free', level: 3 })).toBeVisible();
    await expect(table.getByRole('heading', { name: 'Basic', level: 3 })).toBeVisible();
    await expect(table.getByRole('heading', { name: 'Pro', level: 3 })).toBeVisible();
    await expect(table.getByText('Not on sale yet').first()).toBeVisible();
    await expect(table.getByRole('button', { name: 'Not on sale yet' })).toHaveCount(2);
    await expect(table.locator('a[href^="https://"]')).toHaveCount(0);
    await expect(table.getByRole('link', { name: 'Try the sample lesson' })).toHaveAttribute('href', '/preview');
    // the update and support rows carry the owner's terms (lib/offer.ts, OD-20, OD-23, 11 Nov 2026): both plans get
    // corrections, only Pro is promised new chapters, tools and editions
    await expect(table.getByText('Not published yet')).toHaveCount(0);
    await expect(table.getByText('Corrections and improvements to edition 1.0').first()).toBeVisible();
    await expect(table.getByText('Discount on a new edition').first()).toBeVisible();
    await expect(table.getByText('This edition and the next')).toHaveCount(0);
    // email support is the same plain cell on both paid plans: no priority tier was decided (decision log, 9 Nov)
    await expect(table.getByText('Priority')).toHaveCount(0);
    const terms = page.locator('section[aria-labelledby="termsTitle"]');
    await expect(terms).toContainText('Lifetime access to edition 1.0 for one person, on their own devices; not transferable. Pro also covers later editions.');
    await expect(terms).toContainText('14 days from each purchase, for any reason');
    await expect(terms.getByRole('link', { name: 'support@findnurturekeep.com' })).toHaveAttribute('href', 'mailto:support@findnurturekeep.com');
    await expect(terms).toContainText('Price');
    await expect(terms).toContainText('Not published yet'); // the price

    await page.setViewportSize({ width: 390, height: 800 });
    await expect(table.getByRole('tab', { name: 'Basic' })).toHaveAttribute('aria-selected', 'true');
    await table.getByRole('tab', { name: 'Pro' }).click();
    const pro = table.getByRole('tabpanel', { name: 'Pro' }); // the Basic panel stays mounted, inert, while it animates out
    await expect(pro).toContainText('Every tool');
    await expect(pro.getByRole('button', { name: 'Not on sale yet' })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  });

  test('the hero calculator uses the Chapter 1 arithmetic and flags bad input', async ({ page }) => {
    await page.goto('/');
    const stats = page.locator('.pub-stats');
    await expect(stats.locator('b')).toHaveText(['13', '16', '3–4']); // 3.25 a day is shown as a range
    await expect(page.locator('.pub-device-note')).toContainText('48 working weeks of 5 days each');
    const breakdown = page.locator('.pub-calc-details');
    await expect(breakdown.locator('table')).toBeHidden();
    const toggle = page.getByRole('button', { name: 'How it’s calculated' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(breakdown.locator('table')).toBeVisible();
    await expect(breakdown.locator('tbody tr td:last-child')).toHaveText(['13', '39', '780', '16.25', '3.25']);
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await page.getByLabel('Yearly income goal').fill('120000');
    await expect(stats.locator('b')).toHaveText(['19', '24', '4–5']); // 19 closings; 23.75 a week and 4.75 a day
    await expect(breakdown.locator('tbody tr td:last-child')).toHaveText(['19', '57', '1,140', '23.75', '4.75']);
    await page.getByLabel('Yearly income goal').fill('');
    await expect(stats).toContainText('Enter both numbers');
    await expect(breakdown).toHaveCount(0);
    // a signed-in reader is pointed at the chapter, not asked for an address
    await expect(page.locator('.pub-device-prompt').getByRole('link', { name: 'Chapter 1' })).toHaveAttribute('href', '/handbook/ch1');
    await expect(page.locator('form[data-source="calculator"]')).toHaveCount(0);
  });

  test('hero amount fields focus as a whole without including validation text', async ({ page }) => {
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      for (const id of ['heroGoal', 'heroCommission']) {
        const input = page.locator(`#${id}`);
        await input.focus();
        await expect(input).toHaveCSS('outline-style', 'none');
        await expect(input).toHaveCSS('box-shadow', 'none');
        await input.fill('invalid');
        await expect(input).toHaveAttribute('aria-invalid', 'true');
        const field = input.locator('..');
        await expect(field.locator('.calc-error')).toBeVisible();
        const ring = await field.evaluate(el => {
          const style = getComputedStyle(el, '::after');
          return {
            content: style.content,
            border: style.borderTopStyle,
            width: parseFloat(style.width),
            height: parseFloat(style.height),
            fieldWidth: el.getBoundingClientRect().width,
            inputHeight: el.querySelector('input')!.getBoundingClientRect().height,
          };
        });
        expect(ring.content).toBe('""');
        expect(ring.border).toBe('solid');
        expect(ring.width).toBeCloseTo(ring.fieldWidth, 0);
        expect(ring.height).toBeCloseTo(ring.inputHeight, 0);
      }
    }
  });

  test('the sample lesson runs the real calculator and links to pricing', async ({ page }) => {
    await page.goto('/preview');
    await expect(page.locator('.calc-panel')).toBeVisible();
    await page.getByLabel('Income goal for the year').fill('90000');
    await page.getByLabel(/Average commission per closed side/).fill('6500');
    await expect(page.locator('.calc-stat-value').first()).toHaveText('14'); // 90,000 / 6,500 = 13.8, rounded up
    await expect(page.getByRole('link', { name: 'Pricing and availability' }).last()).toHaveAttribute('href', '/pricing');
  });

  test('the sample carries Chapters 1 and 7 in full, with their tools, checkpoints and quizzes', async ({ page }) => {
    await page.goto('/preview');
    await expect(page.getByRole('heading', { name: '1. Mindset and business foundations', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '7. Common errors and pitfalls of new agents', level: 2 })).toBeVisible();
    await expect(page.locator('.box.checkpoint')).toHaveCount(2);
    await expect(page.locator('.box.checkpoint').last()).toBeVisible();
    await expect(page.locator('.box.quiz')).toHaveCount(2);
    await expect(page.locator('.box.quiz').last()).toBeVisible();
    await expect(page.locator('[data-widget="pitfall-cycle"]')).toBeVisible();
    await expect(page.locator('[data-widget="error-self-score"]')).toBeVisible();
    await expect(page.locator('[data-widget="knowledge-check"]')).toHaveCount(2);
    await expect(page.locator('[data-widget="knowledge-check"]').last()).toBeVisible();
  });

  test('the sample reads as one outline: page, chapter, section, box, with no duplicate ids', async ({ page }) => {
    await page.goto('/preview');
    await expect(page.locator('h1')).toHaveCount(1);
    // the outline a reader meets: headings inside the calculator's closed footnote dialog are not rendered
    const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll(hs => hs.filter(h => h.getClientRects().length > 0).map(h => Number(h.tagName.slice(1))));
    for (let i = 1; i < levels.length; i++) expect(levels[i]! - levels[i - 1]!, `heading ${i} of ${levels.length}`).toBeLessThanOrEqual(1);
    await expect(page.locator('.pub-sample h4.box-title').first()).toBeVisible(); // content boxes and tool boxes both sit under their section
    // a section heading in the sample is the handbook's 1.35rem, not the public site's h2
    await expect(page.locator('.pub-sample h3#you-own-a-business-now')).toHaveCSS('font-size', '21.6px');
    const ids = await page.locator('[id]').evaluateAll(els => els.map(e => e.id));
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  test('the sample is readable in dark mode: callout text and interrupted pitfall nodes use the theme tokens', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('handbookSettings', '{"dark":true}'));
    await page.goto('/preview');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('.pub-sample .box.try-it p').first()).toHaveCSS('color', 'rgb(51, 65, 85)'); // .box p from globals.css, not the public body colour
    await page.getByRole('button', { name: 'CRM + follow-up plans' }).click();
    const broken = page.locator('.cycle-node.is-broken').first();
    await expect(broken).toHaveCSS('background-color', 'rgb(5, 46, 22)'); // --color-brand-tint, dark
    await expect(broken).toHaveCSS('color', 'rgb(203, 213, 225)'); // --color-body, dark
    await expect(broken.locator('.cycle-badge')).toHaveCSS('color', 'rgb(134, 239, 172)'); // --color-success, dark
  });

  test('single-class paragraph rules survive the chapter typography scope on both surfaces', async ({ page }) => {
    for (const path of ['/handbook/ch1', '/preview']) {
      await page.goto(path);
      await expect(page.locator('.calc-note').first(), path).toHaveCSS('font-size', '13.6px'); // 0.85rem, not the bare p rule
      await expect(page.locator('p.part-intro').first(), path).toHaveCSS('margin-bottom', '8px');
    }
  });

  test('the header menu opens by keyboard on a phone and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    const button = page.getByRole('button', { name: 'Menu' });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Pricing', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Pricing', exact: true })).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  // CR-M9: a same-page hash link changes no pathname, so the menu has to close on the tap itself
  test('the phone menu closes on a same-page hash link without claiming an untracked current section', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    // the links are hidden until the menu opens, and role queries skip hidden elements
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(nav.getByRole('link', { name: 'How it works' })).not.toHaveAttribute('aria-current', /.+/);
    await expect(nav.getByRole('link', { name: "What's included" })).not.toHaveAttribute('aria-current', /.+/);
    await expect(nav.getByRole('link', { name: 'Sample lesson' })).not.toHaveAttribute('aria-current', /.+/);
    await nav.getByRole('link', { name: 'How it works' }).click();
    await expect(page).toHaveURL(/\/#how-it-works$/);
    await expect(nav.getByRole('link', { name: 'Pricing', exact: true })).toBeHidden();
    await page.goto('/preview');
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(nav.getByRole('link', { name: 'Sample lesson' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'How it works' })).not.toHaveAttribute('aria-current', /.+/);
  });

  test('a section link scrolls its heading clear of the sticky header', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'How it works' }).click();
    const headerBottom = await page.locator('.pub-header').evaluate(el => el.getBoundingClientRect().bottom);
    await expect.poll(() => page.locator('#how-it-works').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(headerBottom);
  });

  // 1101 is the narrowest width that shows the desktop links; none of them may wrap there
  for (const width of [1101, 1440]) {
    test(`the desktop header keeps every link on one line at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const nav = page.getByRole('navigation', { name: 'Main' });
      await expect(nav.getByRole('button', { name: /^Account menu for/ })).toBeVisible();
      for (const link of await nav.getByRole('link').all()) {
        expect((await link.boundingBox())?.height).toBe(44); // a wrapped label would grow past the 44px target
        expect(await link.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      }
      const brandRight = await page.locator('.pub-brand').evaluate(el => el.getBoundingClientRect().right);
      expect(brandRight).toBeLessThanOrEqual(await nav.evaluate(el => el.getBoundingClientRect().left));
      await expect(page.locator('.pub-header')).toHaveCSS('height', '89px'); // 88px row plus the 1px border
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
    });
  }

  // 320 is the smallest phone the site supports and 360 the common Android width. The hero's stat tiles were
  // the one thing that could not shrink that far.
  for (const width of [320, 360]) {
    test(`the sales page does not scroll sideways at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await expect(page.locator('.pub-stat').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
    });
  }

  test('policy pages are labelled as drafts and kept out of search results', async ({ page }) => {
    for (const path of ['/privacy', '/terms', '/refunds', '/updates']) {
      await page.goto(path);
      await expect(page.getByText('Draft for owner review')).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    }
  });

  // M8 step 4 in part: the support address, the seller's name, and a temporary postal address. Prices and approvals stay open.
  test('the privacy and refund policies give the support address, and the terms name the seller', async ({ page }) => {
    for (const path of ['/privacy', '/refunds', '/support']) {
      await page.goto(path);
      await expect(page.getByRole('link', { name: 'support@findnurturekeep.com' })).toHaveAttribute('href', 'mailto:support@findnurturekeep.com');
    }
    await page.goto('/terms');
    await expect(page.getByText('Brian Pitts').first()).toBeVisible();
    await expect(page.getByText('The postal address is synthetic temp address.')).toBeVisible();
    await expect(page.getByText('the legal name of the seller and a postal address')).toHaveCount(0);
    await page.goto('/updates');
    await expect(page.getByText('Lifetime access to edition 1.0 for one person, on their own devices; not transferable. Pro also covers later editions.')).toBeVisible();
  });

  // M7 step 7: the strictly necessary cookies are disclosed by name (lib/auth/cookie.ts), with no banner to go with them
  test('the privacy policy names the session cookie and the sign-in flag', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Cookies', level: 2 })).toBeVisible();
    await expect(page.locator('code', { hasText: /^hb_session$/ })).toBeVisible();
    await expect(page.locator('code', { hasText: /^hb_signed_in$/ })).toBeVisible();
    await expect(page.getByText('90 days from your last visit').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Accounts and sign-in', level: 2 })).toBeVisible();
    await expect(page.getByText('It sets no cookies of its own.')).toHaveCount(0);
  });

  test('the sitemap lists public pages only', async ({ request }) => {
    const text = await (await request.get('/sitemap.xml')).text();
    expect(text).toContain('/preview');
    expect(text).not.toContain('/handbook');
    expect(text).not.toContain('/account');
  });
});

test.describe('product pages', () => {
  for (const path of PRODUCT) {
    test(`${path} uses the handbook menu, not the marketing header`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      expect((await page.goto(path))?.status()).toBe(200);
      await expect(page.locator('#sidebar')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      expect(errors).toEqual([]);
    });
  }

  test('every old chapter address redirects permanently to /handbook, keeping the heading anchor', async ({ request, page }) => {
    for (const slug of LEGACY_PAGE_SLUGS) {
      const res = await request.get(`/${slug}`, { maxRedirects: 0 });
      expect(res.status(), slug).toBe(308);
      expect(new URL(res.headers().location!, 'http://x').pathname).toBe(`/handbook/${slug}`);
    }
    await page.goto('/ch2#track-every-source');
    await expect(page).toHaveURL(/\/handbook\/ch2#track-every-source$/);
    await expect(page.locator('#track-every-source')).toBeInViewport();
  });

  test('Appendix E tool links land on the tool inside the new route', async ({ page }) => {
    await page.goto('/handbook/app-e');
    await page.getByRole('link', { name: 'Weekly time-block planner' }).click();
    await expect(page).toHaveURL(/\/handbook\/ch8$/);
    await expect(page.locator('[data-widget="timeblock-planner"]')).toBeFocused();
  });

  test('saved progress survives the move: state written under the old keys shows on the new pages', async ({ page }) => {
    await page.addInitScript(() => {
      if (localStorage.getItem('seeded')) return;
      localStorage.setItem('seeded', '1');
      localStorage.setItem('handbookState', JSON.stringify({ read: { ch1: true, ch4: true }, calc: { goal: 80000, commission: 6500 } }));
    });
    await page.goto('/handbook');
    await expect(page.locator('#progressLabel')).toHaveText('2 of 20 sections read');
    await expect(page.getByRole('heading', { name: 'Pick up where you left off' })).toBeVisible();
    await page.goto('/handbook/ch1');
    await expect(page.locator('.nav-item[data-page="ch1"]')).toHaveClass(/read/);
    await expect(page.locator('.calc-stat-value').first()).toHaveText('13');
  });
});

test.describe('guided setup', () => {
  test('walks from an income goal to a saved plan, shares values with the chapter tools and resumes', async ({ page }) => {
    await page.goto('/handbook/start');
    // step 1: errors first, by keyboard
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('.setup-error')).toContainText('Enter your yearly income goal');
    await expect(page.getByRole('button', { name: /Daily target/ })).toHaveAttribute('aria-disabled', 'true');
    await page.getByLabel('Yearly income goal').fill('80000');
    await page.getByLabel(/Average commission/).fill('6500');
    await page.getByRole('button', { name: 'Continue' }).click();

    // step 2: the target, with editable assumptions
    await expect(page.getByRole('heading', { name: 'Your daily conversation target' })).toBeFocused();
    await expect(page.locator('.setup-stats')).toContainText('3');
    await page.getByLabel('Appointments per closing').fill('4');
    await expect(page.locator('.setup-stats')).toContainText('4'); // 13 x 4 x 20 / 48 / 5 = 4.3
    await page.getByLabel('Appointments per closing').fill('3');
    await page.getByRole('button', { name: 'Continue' }).click();

    // step 3: exactly two sources
    await page.getByRole('checkbox', { name: /Sphere of influence/ }).check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('.setup-error')).toContainText('Choose two lead sources');
    await page.getByRole('checkbox', { name: /Open houses/ }).check();
    await expect(page.getByRole('checkbox', { name: /Zillow/ })).toBeDisabled();
    await page.getByRole('button', { name: 'Continue' }).click();

    // step 4: the split adds up
    await page.getByLabel(/Share of the target/).fill('60');
    await expect(page.locator('.setup-split tbody tr').nth(0)).toContainText('10');
    await expect(page.locator('.setup-split tbody tr').nth(1)).toContainText('6');
    await page.getByRole('button', { name: 'Continue' }).click();

    // step 5: the real planner
    await expect(page.getByText('PLANNER · YOUR WEEKLY TIME BLOCKS')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    // step 6: the plan
    const plan = page.locator('#setupPlan');
    await expect(plan).toContainText('3 a day');
    await expect(plan).toContainText('Sphere of influence and referrals: 60%');
    await expect(plan).toContainText('Open houses: 40%');
    await expect(plan).toContainText('start your prospecting block at 9:15 am');

    // resume: a reload returns to the same step with the same answers
    await page.reload();
    await expect(page.locator('#setupPlan')).toContainText('Open houses: 40%');

    // the same numbers are in the Chapter 1 calculator
    await page.goto('/handbook/ch1');
    await expect(page.locator('.calc-stat-value').first()).toHaveText('13');

    // and in the progress file
    await page.goto('/account');
    await expect(page.getByText(/tools? with saved work/)).toBeVisible();
    await expect(page.getByText('Saving works in this browser.')).toBeVisible();
  });
});
