import { expect, test } from './fixtures';
import { LEGACY_PAGE_SLUGS } from '../lib/routes';

const PUBLIC = ['/', '/preview', '/about', '/support', '/pricing', '/privacy', '/terms', '/refunds', '/updates'];
const PRODUCT = ['/handbook', '/handbook/start', '/account'];

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
    // the update and support rows promise nothing until the owner publishes those terms (lib/offer.ts): two rows
    // for two paid plans in the grid, and again in whichever plan tab is mounted
    await expect(table.getByText('Not published yet').first()).toBeVisible();
    expect(await table.getByText('Not published yet').count()).toBeGreaterThanOrEqual(4);
    await expect(table.getByText('This edition and the next')).toHaveCount(0);

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
    await expect(stats.locator('b')).toHaveText(['13', '16', '3']); // 3.25 a day rounds to 3
    await page.getByLabel('Yearly income goal').fill('120000');
    await expect(stats.locator('b')).toHaveText(['19', '24', '5']); // 19 closings; 23.75 a week and 4.75 a day, rounded
    await page.getByLabel('Yearly income goal').fill('');
    await expect(stats).toContainText('Enter both numbers');
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
