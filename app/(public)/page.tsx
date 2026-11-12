import Link from 'next/link';
import { HeroPlan } from '@/components/site/HeroPlan';
import { SignedInSwitch } from '@/components/site/SignedInSwitch';
import { SignupForm } from '@/components/site/SignupForm';
import { ToolIndex } from '@/components/site/ToolIndex';
import { JsonLd } from '@/components/shell/JsonLd';
import { faqs } from '@/content/site/faq';
import { bookJsonLd } from '@/lib/jsonld';
import { OFFER, OWNER, primaryAction, purchaseOpen, REFUND_DAYS, upgradeOffered, upgradePriceDisplay } from '@/lib/offer';
import { paidTiers } from '@/lib/tiers';
import { PAGES } from '@/lib/pages';
import { fmtClock, planBlocks, ROADMAP_PHASES, TIMEBLOCK_DEFAULTS } from '@/lib/plan';
import { roundPerDay } from '@/lib/goal';
import { readSetup, sourceName, summarize } from '@/lib/setup';

// Until purchase opens, the only conversion on this page is an email address, so the sign-in form is the primary
// action in the hero, after the calculator and at the end (user-database plan, section 2). The page is static; a
// browser that carries the sign-in flag swaps the forms for the way into the handbook after mount
// (components/site/SignedInSwitch.tsx).
export default function SalesPage() {
  const action = primaryAction();
  const open = purchaseOpen();
  return (
    <>
      <JsonLd data={bookJsonLd()} />
      <Hero action={action} open={open} />
      <Problems />
      <FirstSession />
      <Tools />
      <NinetyDays />
      <Fit />
      <Offer open={open} />
      <Faq />
      <Final action={action} />
    </>
  );
}

type Action = ReturnType<typeof primaryAction>;

function ActionLink({ action, className }: { action: Action; className: string }) {
  return <Link className={className} href={action.href}>{action.label}</Link>;
}

/** The hero for a reader who already has a session cookie: no form, the way in. */
function WelcomeBack() {
  return (
    <div className="pub-welcome" data-welcome-back>
      <p><strong>Welcome back.</strong> The free chapters, and whatever you have bought, are where you left them.</p>
      <div className="pub-actions" style={{ margin: 0 }}>
        <Link className="pub-btn pub-btn-primary" href="/handbook">Open the handbook</Link>
        <Link className="pub-btn pub-btn-secondary" href="/preview">Try a sample lesson</Link>
      </div>
    </div>
  );
}

const TRUST_LINE = 'No password, no card. The link we email also signs you in next time.';

/* 1. Who is this for, and what will it help me do */
function Hero({ action, open }: { action: Action; open: boolean }) {
  const visitor = open ? (
    <>
      <div className="pub-actions">
        <ActionLink action={action} className="pub-btn pub-btn-primary" />
        <Link className="pub-btn pub-btn-secondary" href="/preview">Try a sample lesson</Link>
      </div>
      <p className="pub-fineprint">{OFFER.accessSummary} The sample lesson is free and needs no sign-up.</p>
      {/* once something is for sale the buy button leads, and the form sits under it so the calculator keeps the right column */}
      <div className="pub-card signup-card">
        <p className="pub-h3" style={{ margin: '0 0 6px' }}>Read the free chapters first.</p>
        <p className="pub-trust">{TRUST_LINE}</p>
        <SignupForm variant="card" source="hero" />
      </div>
    </>
  ) : (
    <>
      <div className="pub-hero-form">
        <SignupForm variant="hero" source="hero" buttonLabel="Send me the free chapters" />
      </div>
      <p className="pub-hero-links">
        <Link href="/preview">Try the sample lesson without an email</Link>
        <Link href="/pricing">Pricing and availability</Link>
      </p>
    </>
  );
  return (
    <section className="pub-hero" aria-labelledby="heroTitle">
      <div className="pub-wrap pub-hero-grid">
        <div>
          <p className="pub-eyebrow">A 90-day handbook for new real estate agents</p>
          <h1 id="heroTitle" className="pub-h1">Know what to do each day to build a real estate business.</h1>
          <p className="pub-lede">
            You are licensed and hanging your license with a brokerage, and nobody has handed you a daily plan. This is a 90-day
            implementation handbook with interactive tools: it turns your income goal into a daily conversation target, helps you
            set up your CRM and follow-up, and gives you scripts to practice and a weekly review so you keep staying in touch.
          </p>
          <SignedInSwitch signedIn={<WelcomeBack />} signedOut={visitor} />
        </div>
        <div className="pub-hero-side">
          <HeroPlan />
        </div>
      </div>
    </section>
  );
}

/* 2. Recognizable problems */
const PROBLEMS = [
  { title: 'Your training notes are in five places', text: 'Class notes, broker webinars, saved posts and a half-read book, and no single order to work through them in.' },
  { title: 'You are not sure whom to contact', text: 'Your phone is full of names, but nothing tells you who to call this morning, or what to say when they pick up.' },
  { title: 'Follow-up depends on your mood', text: 'Some leads get five calls and some get none. Without a routine, the quiet ones go quieter and nobody notices.' },
  { title: 'You are busy but cannot tell it counts', text: 'Hours go into activity with no plan behind it, so at the end of the week you cannot say what moved you toward an appointment.' },
];

function Problems() {
  return (
    <section className="pub-section" aria-labelledby="problemsTitle">
      <div className="pub-wrap">
        <div className="pub-section-head">
          <h2 id="problemsTitle" className="pub-h2">If your first months look like this, you are not behind.</h2>
          <p>Most new agents do not struggle for lack of effort. Effort gets scattered across things that do not add up, because nobody gave them one system to follow.</p>
        </div>
        <div className="pub-grid four">
          {PROBLEMS.map(p => (
            <div key={p.title} className="pub-tile">
              <h3 className="pub-h3">{p.title}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
        <p className="pub-reassure">The handbook replaces that with one routine: find conversations, follow up on a plan, and review the numbers every Friday.</p>
      </div>
    </section>
  );
}

/* 3. Concrete first-session result (everything listed here is built in /handbook/start) */
// The example card is produced by the same code as the real plan, from the handbook's own example numbers, so it cannot drift from what the setup writes.
const EXAMPLE = summarize(
  { goal: 80000, commission: 6500, apc: 3, cpa: 20, weeks: 48 },
  readSetup({ sources: ['sphere', 'open'], share: 60 }),
  TIMEBLOCK_DEFAULTS,
)!;

function FirstSession() {
  const blocks = planBlocks(TIMEBLOCK_DEFAULTS).blocks.filter(b => b.mins && b.cls !== 3);
  return (
    <section className="pub-section tint" aria-labelledby="firstTitle">
      <div className="pub-wrap">
        <div className="pub-section-head">
          <h2 id="firstTitle" className="pub-h2">What you leave your first session with.</h2>
          <p>The guided setup walks you through the first hour. It uses the same tools as the chapters, and your answers are saved on your device so you can come back and change them.</p>
        </div>
        <div className="pub-result">
          <ul className="pub-checks" role="list">
            <li><strong>A daily conversation target</strong>Your income goal and average commission, run through ratios you can edit, down to a number for a single day.</li>
            <li><strong>Two lead sources to start with</strong>Chosen on what each costs in time and money and what you can realistically follow up on this month, with the target split between them.</li>
            <li><strong>A scheduled first week</strong>Protected blocks for your CRM, follow-up and prospecting, ready to add to your calendar.</li>
            <li><strong>One clear next action</strong>The first thing to do on your next working day, written from your own numbers.</li>
          </ul>
          <div className="pub-card pub-plan" aria-label="Example plan summary">
            <span className="pub-device-tag">Example only</span>
            <dl>
              <dt>Daily conversation target</dt>
              <dd>{roundPerDay(EXAMPLE.plan.perDay)} a day<small>From an $80,000 goal and a $6,500 average commission, using the handbook’s example ratios.</small></dd>
              <dt>Lead sources</dt>
              <dd>{EXAMPLE.allocation.map(a => <span key={a.source} className="block">{sourceName(a.source)}: {a.percent}%</span>)}<small>An example split. Yours is set in step 4.</small></dd>
              <dt>First week</dt>
              <dd>{blocks.map(b => <span key={b.cls} className="block">{fmtClock(b.from)} {b.name}</span>)}<small>Default blocks. Start time and lengths are yours to edit.</small></dd>
              <dt>Next action</dt>
              <dd>{EXAMPLE.action}</dd>
            </dl>
          </div>
        </div>
        <div className="pub-actions mt-7">
          <Link className="pub-btn pub-btn-secondary" href="/preview">See the first of these tools in the sample lesson</Link>
        </div>
      </div>
    </section>
  );
}

/* 4. Product demonstration */
const DEFAULT_BLOCKS = planBlocks(TIMEBLOCK_DEFAULTS).blocks.filter(b => b.mins);

function Tools() {
  return (
    <section className="pub-section" id="tools" aria-labelledby="toolsTitle">
      <div className="pub-wrap">
        <div className="pub-section-head">
          <h2 id="toolsTitle" className="pub-h2">Tools you use to do the work, not just read about it.</h2>
          <p>Each tool is built into the chapter it belongs to and saves to your device. The first three run in the free sample exactly as they do in the handbook.</p>
        </div>
        <div className="pub-grid four pub-tools">
          <article className="pub-tile pub-tool">
            <div className="pub-tool-visual" aria-label="Example from the income goal calculator">
              <dl className="pub-funnel">
                <div><dt>Yearly goal</dt><dd>$80,000</dd></div>
                <div><dt>Closings</dt><dd>13</dd></div>
                <div><dt>Conversations</dt><dd>780</dd></div>
                <div className="is-result"><dt>Per day</dt><dd>3</dd></div>
              </dl>
              <p className="pub-tool-caption">Example numbers at a $6,500 commission.</p>
            </div>
            <p className="pub-tool-meta"><span>Chapter 1</span><span className="pub-tool-free">Free sample</span></p>
            <h3 className="pub-h3">Set a number you can hit</h3>
            <p>The income goal calculator turns a yearly goal into closings, appointments and conversations per day.</p>
            <Link className="pub-link" href="/preview#goal-calculator">Try the calculator</Link>
          </article>
          <article className="pub-tile pub-tool">
            <div className="pub-tool-visual" aria-label="Example from script practice, with the key words hidden">
              <p className="pub-script">
                “Hi <span className="pub-mask">Name</span>, this is <span className="pub-mask">Your Name</span> with <span className="pub-mask">Your Brokerage</span>. I just saw your inquiry about <span className="pub-mask">address or area</span>…”
              </p>
              <p className="pub-tool-caption"><span className="pub-tool-pill">Words hidden</span> New lead by phone</p>
            </div>
            <p className="pub-tool-meta"><span>Chapter 6</span><span className="pub-tool-free">Free sample</span></p>
            <h3 className="pub-h3">Practice what you will say</h3>
            <p>Script practice hides the words so you rehearse them from memory, then shows the script so you can check yourself.</p>
            <Link className="pub-link" href="/preview#script-practice">Practice a script</Link>
          </article>
          <article className="pub-tile pub-tool">
            <div className="pub-tool-visual" aria-label="Default morning from the weekly planner">
              <ul className="pub-blocks" role="list">
                {DEFAULT_BLOCKS.slice(0, 3).map(b => <li key={b.cls}><time>{fmtClock(b.from)}</time><span>{b.name}</span></li>)}
              </ul>
              <p className="pub-tool-caption"><span className="pub-tool-pill is-ok">✓ Before noon</span> Lead generation lands at 9:15</p>
            </div>
            <p className="pub-tool-meta"><span>Chapter 8</span><span className="pub-tool-free">Free sample</span></p>
            <h3 className="pub-h3">Protect your mornings</h3>
            <p>The weekly planner lays out your day and tells you whether lead generation lands before noon. Export it to your calendar.</p>
            <Link className="pub-link" href="/preview#timeblock-planner">Plan a week</Link>
          </article>
          <article className="pub-tile pub-tool">
            <div className="pub-tool-visual" aria-label="The three milestones on the 90-day roadmap">
              <ol className="pub-milestones">
                {ROADMAP_PHASES.map(p => <li key={p.name}><time>Day {p.endDay}</time><span>{p.name}</span></li>)}
              </ol>
            </div>
            <p className="pub-tool-meta"><span>Chapter 12</span><span className="pub-tool-free is-plain">In the handbook</span></p>
            <h3 className="pub-h3">See the whole 90 days</h3>
            <p>The roadmap puts dates on three milestones and tracks the checklist items behind each one.</p>
            <Link className="pub-link" href="#how-it-works">See the three phases below</Link>
          </article>
        </div>
        <SignedInSwitch signedIn={null} signedOut={<ToolsCta />} />
        <Inside />
      </div>
    </section>
  );
}

/* A conversion point at the moment the tools have just shown what the handbook does. Visitors only: a signed-in reader already has the way in at the top. */
function ToolsCta() {
  return (
    <div className="pub-card pub-cta-band">
      <div>
        <p className="pub-h3">Try the first tools with your own numbers.</p>
        <p>The sample lesson is free and needs no sign-up.</p>
      </div>
      <div className="pub-actions">
        <Link className="pub-btn pub-btn-primary" href="/preview">Try a sample lesson</Link>
        <Link className="pub-btn pub-btn-secondary" href="#start">Get the free chapters</Link>
      </div>
    </div>
  );
}

/* 6. What is inside. The counts come from the page list, so they follow the handbook. */
const CHAPTER_COUNT = PAGES.filter(p => p.id.startsWith('ch')).length;
const APPENDIX_COUNT = PAGES.filter(p => p.id.startsWith('app-')).length;

function Inside() {
  return (
    <div className="pub-inside" id="included">
      <h3 className="pub-h3">Everything inside</h3>
      <p>
        {CHAPTER_COUNT} chapters in a fixed order, each ending with an exercise and a short checkpoint, plus an overview, a 90-day plan and {APPENDIX_COUNT} appendices.
        Search, a glossary and print-friendly pages come with it. Progress is saved on your device, with a file you can download to back it up or move devices,
        and light, dark and text size settings are built in.
      </p>
      <details className="pub-details">
        <summary>Every chapter and appendix</summary>
        <div className="pub-details-body">
          <ol>{PAGES.map(p => <li key={p.id}>{p.label}</li>)}</ol>
        </div>
      </details>
      <ToolIndex />
    </div>
  );
}

/* 5. The 90-day structure */
const PHASES = [
  {
    days: 'Days 1 to 30', name: 'Establish the system',
    items: ['Finish CRM setup and import and tag your contacts', 'Launch your basic follow-up plans', 'Aim for about 50 real conversations with your sphere', 'Hold an open house or networking event and test your response speed'],
  },
  {
    days: 'Days 31 to 60', name: 'Build a consistent routine',
    items: ['Hold your morning prospecting block at least four days out of five', 'Aim for 15 to 25 conversations and 1 to 2 appointments set a week', 'Review your numbers every Friday', 'Practice and hold your first consultations'],
  },
  {
    days: 'Days 61 to 90', name: 'Review and grow the pipeline',
    items: ['Aim for at least five active opportunities in your pipeline', 'Build your post-close plan before you need it', 'Count results by lead source and decide where your time goes next', 'Record your own ratios so the next 90 days use real numbers'],
  },
];

function NinetyDays() {
  return (
    <section className="pub-section tint" id="how-it-works" aria-labelledby="phasesTitle">
      <div className="pub-wrap">
        <div className="pub-section-head">
          <h2 id="phasesTitle" className="pub-h2">Three phases, one routine, reviewed every Friday.</h2>
          <p>Ninety days is long enough to build the system and start a pipeline, and short enough to hold yourself to. Read a chapter, do its exercise the same day, and move on.</p>
        </div>
        <div className="pub-phases">
          {PHASES.map(p => (
            <div key={p.name} className="pub-phase">
              <p className="pub-phase-days">{p.days}</p>
              <h3 className="pub-h3">{p.name}</h3>
              <ul>{p.items.map(i => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </div>
        <p className="pub-small" style={{ marginTop: 16 }}>
          These are planning targets from Chapter 12, not predictions. Closings usually follow in the second 90 days, and income lags the work by roughly 60 to 120 days.
        </p>
      </div>
    </section>
  );
}

/* 7. Credibility and fit */
function Fit() {
  const author = OWNER.author;
  return (
    <section className="pub-section tint" id="fit" aria-labelledby="fitTitle">
      <div className="pub-wrap">
        <div className="pub-section-head">
          <h2 id="fitTitle" className="pub-h2">Judge it before you buy it, and know what it does not cover.</h2>
        </div>
        <div className="pub-trust">
          {author ? (
            <p><strong>Written by {author.name}.</strong> {author.bio} <Link href="/about">More about the author and approach.</Link></p>
          ) : (
            <p>
              <strong>Check it yourself.</strong> The free sample is a full lesson with its working calculator, and the same tools run in the
              handbook. The planning ratios are labeled as rules of thumb for you to replace with your own numbers, and the calculator’s footnote shows the arithmetic.{' '}
              <Link href="/about">Read how the handbook is written and what it assumes.</Link>
            </p>
          )}
        </div>
        <div className="pub-grid two">
          <div className="pub-tile pub-fit yes">
            <h3 className="pub-h3">A good fit if you</h3>
            <ul className="pub-list">
              <li>Are in your first year, licensed and affiliated with a brokerage</li>
              <li>Want a daily and weekly routine rather than more theory</li>
              <li>Will do an exercise the same day you read the chapter</li>
              <li>Use any CRM, or are choosing how to set one up</li>
            </ul>
          </div>
          <div className="pub-tile pub-fit no">
            <h3 className="pub-h3">What it does not cover</h3>
            <ul className="pub-list">
              <li>Writing contracts or running a closing: your broker and state course do that</li>
              <li>State-specific forms, legal advice or brokerage supervision and compliance</li>
              <li>Coaching, accountability calls or continuing education credit</li>
              <li>Guaranteed closings or income. The numbers are planning tools, not forecasts</li>
            </ul>
          </div>
        </div>
        <p className="pub-small" style={{ marginTop: 16 }}>Worked examples use Keller Williams Command and are labeled as examples. They are not an endorsement, and the method does not depend on that CRM.</p>
      </div>
    </section>
  );
}

/* 8. Offer */
function Offer({ open }: { open: boolean }) {
  const upgradePrice = upgradeOffered() ? upgradePriceDisplay() : null;
  return (
    <section className="pub-section" id="offer" aria-labelledby="offerTitle">
      <div className="pub-wrap">
        <div className="pub-section-head">
          <h2 id="offerTitle" className="pub-h2">What you get and what it costs.</h2>
        </div>
        <div className="pub-card pub-offer">
          {open ? (
            <>
              <p className="pub-h3" style={{ fontSize: '2rem', margin: 0 }}>{paidTiers().map(t => `${t.name} ${t.priceDisplay}`).join(' · ')}</p>
              <dl>
                <dt>Plans</dt><dd>Two one-time purchases, Basic and Pro; everything in Basic is in Pro. The free set stays free.</dd>
                <dt>Access</dt><dd>{OFFER.accessTerm}</dd>
                <dt>Updates</dt>
                <dd>
                  <span className="block"><strong>Basic:</strong> {OFFER.updatesByPlan.basic}</span>
                  <span className="block mt-1"><strong>Pro:</strong> {OFFER.updatesByPlan.pro}</span>
                </dd>
                {upgradePrice && <><dt>Upgrade</dt><dd>A Basic owner moves to Pro by paying the difference, {upgradePrice}, once, with no time limit. It covers the edition you bought.</dd></>}
                <dt>Refunds</dt><dd>{REFUND_DAYS} days from each purchase, for any reason. <Link href="/refunds">Read the refund policy</Link> before you buy.</dd>
              </dl>
              <Link className="pub-btn pub-btn-primary" href="/pricing">Compare the plans and buy</Link>
            </>
          ) : (
            <>
              <span className="pub-status">Purchase is not open yet</span>
              <p>No price or refund policy has been published, so there is nothing to buy today. When that changes, the prices and every term will be on the pricing page before you are asked for anything.</p>
              <p>Until then you can read two full chapters and use their tools, with no sign-up.</p>
              <div className="pub-actions">
                <Link className="pub-btn pub-btn-primary" href="/pricing">See plans and pricing</Link>
                <Link className="pub-btn pub-btn-secondary" href="/preview">Try a sample lesson</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="pub-section tint" id="faq" aria-labelledby="faqTitle">
      <div className="pub-wrap pub-narrow">
        <h2 id="faqTitle" className="pub-h2">Questions new agents ask.</h2>
        <div className="pub-faq">
          {faqs().map(f => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <div className="pub-faq-a"><p>{f.a}</p></div>
            </details>
          ))}
        </div>
        <p className="pub-small" style={{ marginTop: 16 }}>More on <Link href="/support">saving, backup and access</Link>, and on <Link href="/updates">access and updates</Link>.</p>
      </div>
    </section>
  );
}

function Final({ action }: { action: Action }) {
  // The form again for a visitor who read this far; checkout, when it opens, is on the pricing page, so the plans
  // link stays secondary.
  const reader = (
    <div className="pub-actions">
      <Link className="pub-btn pub-btn-primary" href="/handbook">Open the handbook</Link>
      <ActionLink action={action} className="pub-btn pub-btn-secondary" />
    </div>
  );
  const visitor = (
    <>
      <div className="pub-hero-form pub-final-form">
        <SignupForm variant="hero" source="final" buttonLabel="Send me the free chapters" />
      </div>
      <p className="pub-hero-links">
        <Link href="/preview">Try the sample lesson without an email</Link>
        <ActionLink action={action} className="" />
      </p>
    </>
  );
  return (
    <section className="pub-section pub-final" id="start" aria-labelledby="finalTitle">
      <div className="pub-wrap pub-narrow">
        <h2 id="finalTitle" className="pub-h2">Start with tomorrow morning.</h2>
        <p className="pub-lede" style={{ margin: '0 auto 24px' }}>Open the free chapters, set your daily number, and see whether this is the routine you want to follow for the next 90 days.</p>
        <SignedInSwitch signedIn={reader} signedOut={visitor} />
        <p className="pub-fineprint">Pricing and purchase status are on the <Link href="/pricing">pricing page</Link>.</p>
      </div>
    </section>
  );
}
