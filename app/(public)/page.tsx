import Link from 'next/link';
import { HeroPlan } from '@/components/site/HeroPlan';
import { JsonLd } from '@/components/shell/JsonLd';
import { faqs } from '@/content/site/faq';
import { bookJsonLd } from '@/lib/jsonld';
import { OFFER, OWNER, primaryAction, purchaseOpen } from '@/lib/offer';
import { NAV } from '@/lib/pages';
import { fmtClock, planBlocks, ROADMAP_PHASES, TIMEBLOCK_DEFAULTS } from '@/lib/plan';
import { roundPerDay } from '@/lib/goal';
import { readSetup, sourceName, summarize } from '@/lib/setup';

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
      <Included />
      <Fit />
      <Offer open={open} />
      <Faq />
      <Final action={action} />
    </>
  );
}

type Action = ReturnType<typeof primaryAction>;

function ActionLink({ action, className }: { action: Action; className: string }) {
  return action.external
    ? <a className={className} href={action.href} rel="noopener">{action.label}</a>
    : <Link className={className} href={action.href}>{action.label}</Link>;
}

/* 1. Who is this for, and what will it help me do */
function Hero({ action, open }: { action: Action; open: boolean }) {
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
          <div className="pub-actions">
            <ActionLink action={action} className="pub-btn pub-btn-primary" />
            <Link className="pub-btn pub-btn-secondary" href="/preview">Try a sample lesson</Link>
          </div>
          <p className="pub-fineprint">
            {open
              ? `${OFFER.accessTerm} The sample lesson is free and needs no sign-up.`
              : 'Purchase is not open yet. The sample lesson is free and needs no sign-up, and the pricing page says where things stand.'}
          </p>
        </div>
        <HeroPlan />
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
          <ul className="pub-checks">
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
        <div className="pub-grid four">
          <article className="pub-tile pub-tool">
            <h3 className="pub-h3">Set a number you can hit</h3>
            <p>The income goal calculator turns a yearly goal into closings, appointments and conversations per day.</p>
            <div className="pub-tool-visual"><b>$80,000</b> goal ÷ <b>$6,500</b> commission → 13 closings → about 780 conversations → <b>3 a day</b>. <em>Example numbers.</em></div>
            <Link className="pub-link" href="/preview#goal-calculator">Try the calculator</Link>
          </article>
          <article className="pub-tile pub-tool">
            <h3 className="pub-h3">Practice what you will say</h3>
            <p>Script practice hides the words so you rehearse them from memory, then shows the script so you can check yourself.</p>
            <div className="pub-tool-visual">“Hi [Name], this is [Your Name] with [Your Brokerage]. I just saw your inquiry about [address or area]…” <em>New lead by phone, Chapter 6.</em></div>
            <Link className="pub-link" href="/preview#script-practice">Practice a script</Link>
          </article>
          <article className="pub-tile pub-tool">
            <h3 className="pub-h3">Protect your mornings</h3>
            <p>The weekly planner lays out your day and tells you whether lead generation lands before noon. Export it to your calendar.</p>
            <div className="pub-tool-visual">
              <ul className="pub-blocks" aria-label="Default day from the planner">
                {DEFAULT_BLOCKS.slice(0, 4).map(b => <li key={b.cls}><time>{fmtClock(b.from)}</time>{b.name}</li>)}
              </ul>
            </div>
            <Link className="pub-link" href="/preview#timeblock-planner">Plan a week</Link>
          </article>
          <article className="pub-tile pub-tool">
            <h3 className="pub-h3">See the whole 90 days</h3>
            <p>The roadmap puts dates on three milestones and tracks the checklist items behind each one.</p>
            <div className="pub-tool-visual">
              <ul>{ROADMAP_PHASES.map(p => <li key={p.name}>Day {p.endDay}: {p.name}</li>)}</ul>
            </div>
            <Link className="pub-link" href="/#how-it-works">How the 90 days are laid out</Link>
          </article>
        </div>
      </div>
    </section>
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

/* 6. What is included */
const CHAPTER_NAV = NAV.flatMap(g => g.pages);

function Included() {
  return (
    <section className="pub-section" id="included" aria-labelledby="includedTitle">
      <div className="pub-wrap">
        <div className="pub-section-head">
          <h2 id="includedTitle" className="pub-h2">What is inside.</h2>
          <p>One handbook, organized around three jobs: find conversations, nurture leads on a plan, and keep clients so they send you the next ones.</p>
        </div>
        <div className="pub-grid four pub-included">
          <div>
            <h3 className="pub-h3">Read</h3>
            <ul>
              <li>13 chapters in a fixed order, each ending with an exercise and a short checkpoint</li>
              <li>An overview and a 90-day plan</li>
              <li>Six appendices: scorecard, follow-up starter kit, CRM checklist, glossary, tools index and links</li>
            </ul>
          </div>
          <div>
            <h3 className="pub-h3">Do</h3>
            <ul>
              <li>Income goal calculator and lead source comparison</li>
              <li>Weekly time-block planner with calendar export</li>
              <li>CRM setup checklists and a weekly activity scorecard</li>
              <li>Pipeline value calculator and post-close scheduler</li>
            </ul>
          </div>
          <div>
            <h3 className="pub-h3">Practice</h3>
            <ul>
              <li>More than 20 word-for-word scripts with a practice mode</li>
              <li>An objection trainer and a consultation lab</li>
              <li>Qualifying and Fair Housing drills</li>
              <li>Three multiple-choice questions and one fill-in per chapter</li>
            </ul>
          </div>
          <div>
            <h3 className="pub-h3">Keep track</h3>
            <ul>
              <li>Chapters read and checklist progress, saved on your device</li>
              <li>Search, a glossary and print-friendly pages</li>
              <li>Download a progress file to back up or move devices</li>
              <li>Light, dark and text size settings</li>
            </ul>
          </div>
        </div>
        <details className="pub-details">
          <summary>Every chapter and appendix</summary>
          <div className="pub-details-body">
            <ol>{CHAPTER_NAV.map(p => <li key={p.id}>{p.label}</li>)}</ol>
          </div>
        </details>
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
  return (
    <section className="pub-section" id="offer" aria-labelledby="offerTitle">
      <div className="pub-wrap">
        <div className="pub-section-head">
          <h2 id="offerTitle" className="pub-h2">What you get and what it costs.</h2>
        </div>
        <div className="pub-card pub-offer">
          {open ? (
            <>
              <p className="pub-h3" style={{ fontSize: '2rem', margin: 0 }}>{OFFER.priceDisplay}</p>
              <dl>
                <dt>Access</dt><dd>{OFFER.accessTerm}</dd>
                <dt>Updates</dt><dd>{OFFER.updatesTerm}</dd>
                <dt>Refunds</dt><dd><Link href="/refunds">Read the refund policy</Link> before you buy.</dd>
              </dl>
              <a className="pub-btn pub-btn-primary" href={OFFER.checkoutUrl ?? '/pricing'} rel="noopener">{`Get the handbook, ${OFFER.priceDisplay}`}</a>
            </>
          ) : (
            <>
              <span className="pub-status">Purchase is not open yet</span>
              <p>No price, access term or refund policy has been published, so there is nothing to buy today. When that changes, the price and every term will be on the pricing page before you are asked for anything.</p>
              <p>Until then you can read a full sample lesson and use its calculator, with no sign-up.</p>
              <div className="pub-actions">
                <Link className="pub-btn pub-btn-primary" href="/pricing">See pricing and availability</Link>
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
  // Once purchase is open the buyer's next step is the purchase; until then it is the free sample.
  const preview = <Link className={`pub-btn ${action.external ? 'pub-btn-secondary' : 'pub-btn-primary'}`} href="/preview">Try a sample lesson</Link>;
  return (
    <section className="pub-section pub-final" aria-labelledby="finalTitle">
      <div className="pub-wrap pub-narrow">
        <h2 id="finalTitle" className="pub-h2">Start with tomorrow morning.</h2>
        <p className="pub-lede" style={{ margin: '0 auto 24px' }}>Try the sample lesson, set your daily number, and see whether this is the routine you want to follow for the next 90 days.</p>
        <div className="pub-actions">
          {action.external ? <><ActionLink action={action} className="pub-btn pub-btn-primary" />{preview}</> : <>{preview}<ActionLink action={action} className="pub-btn pub-btn-secondary" /></>}
        </div>
        <p className="pub-fineprint">Pricing and purchase status are on the <Link href="/pricing">pricing page</Link>.</p>
      </div>
    </section>
  );
}
