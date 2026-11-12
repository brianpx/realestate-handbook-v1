import Link from 'next/link';
import { HANDBOOK, pageHref } from '@/lib/routes';

type Step = { title: string; text: string; link?: string; href?: string };

const FREE_STEPS: readonly Step[] = [
  { title: 'Read Chapter 1 and set your daily number', text: 'The income goal calculator turns a yearly goal into a daily conversation target.', link: 'Open Chapter 1', href: pageHref('ch1') },
  { title: 'Read Chapter 7 before your first week', text: 'It covers the common errors and pitfalls of a first year, so you can plan around them.', link: 'Open Chapter 7', href: pageHref('ch7') },
  { title: 'See the whole plan in the overview', text: 'The overview has the four-week reading plan. The guided setup and the other chapters come with the paid handbook.', link: 'Open the overview', href: pageHref('pref') },
];

const MEMBER_STEPS: readonly Step[] = [
  { title: 'Do the guided setup once', text: 'It gives you a daily number, two lead sources and a scheduled week.', link: 'Start here', href: `${HANDBOOK}/start` },
  { title: 'Follow the first-week reading', text: 'Chapters 1, 2 and 3 set your daily number, build your sphere list and set up your home base. The overview has the four-week reading plan.' },
  { title: 'Review every Friday', text: 'Fill in the scorecard, check your pipeline and decide one thing to do differently next week.' },
];

export function HowToUse({ free }: { free: boolean }) {
  const steps = free ? FREE_STEPS : MEMBER_STEPS;
  return (
    <section className="hb-home-section" aria-labelledby="howToUseTitle">
      <h2 id="howToUseTitle" className="hb-h2 hb-home-h2">{free ? 'How to use the free set' : 'How to use the handbook'}</h2>
      <ol className="hb-home-steps">
        {steps.map((s, i) => (
          <li key={s.title} className="hb-home-step">
            <span className="hb-home-step-num" aria-hidden="true">{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            {s.link && s.href && <Link className="hb-home-step-link" href={s.href}>{s.link}</Link>}
          </li>
        ))}
      </ol>
      <p className="hb-home-fine">
        Everything you enter is saved in this browser on this device. <Link href="/account">Back it up or move it</Link>.
      </p>
    </section>
  );
}
