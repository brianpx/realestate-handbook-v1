import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead } from '@/components/site/Draft';
import { OWNER, purchaseOpen } from '@/lib/offer';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Help with navigating the handbook, saving progress, backup and restore, devices and access.',
  alternates: { canonical: '/support' },
};

export default function SupportPage() {
  return (
    <>
      <PageHead eyebrow="Support" title="Help with the handbook">
        Most questions are about where progress is saved. Start here; the answers describe how the handbook works today.
      </PageHead>
      <div className="pub-wrap pub-narrow pub-prose">
        <ul className="pub-toc">
          <li><a href="#navigating">Finding your way</a></li>
          <li><a href="#saving">Saving progress</a></li>
          <li><a href="#backup">Backup and restore</a></li>
          <li><a href="#devices">Devices and browsers</a></li>
          <li><a href="#access">Access and recovery</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>

        <h2 id="navigating">Finding your way</h2>
        <ul>
          <li><strong>Handbook home</strong> is the orientation page, with a Start here button, the chapters and shortcuts to the tools.</li>
          <li><strong>Start here: guided setup</strong> walks through your first session: income goal, daily target, two lead sources and your first week.</li>
          <li>The menu on the left (the ☰ button on a phone) lists every chapter and appendix and has a search box. <strong>Interactive tools</strong> (Appendix E) lists every tool and jumps to it.</li>
          <li>Settings at the bottom of the menu has dark mode, text size, full width, essential tools only, and whether progress is tracked.</li>
        </ul>

        <h2 id="saving">Saving progress</h2>
        <p>
          There is no account. Everything you do (chapters read, checklist ticks, calculator entries, script practice, scorecard and quiz answers) is saved
          automatically in your browser, on the device you are using. It is not sent to a server and nobody else can see it.
        </p>
        <p>
          Because it lives in the browser, it stays only as long as the browser keeps it. Clearing site data, using a private window, switching browsers,
          or changing the web address can all show you an empty handbook. If that happens, restore from a backup file (below).
        </p>

        <h2 id="backup">Backup and restore</h2>
        <ol>
          <li>Open <Link href="/account">Account and saved progress</Link>, or Settings in the handbook menu.</li>
          <li>Choose <strong>Download my progress</strong>. You get a small file named handbook-progress with the date.</li>
          <li>To restore, on the same page choose <strong>Restore from a file</strong>, pick the file and confirm. Restoring replaces the progress on that device; what was there is first kept as a backup in the same browser.</li>
        </ol>
        <p>Download a file now and then, and always before you clear your browser data or change devices.</p>

        <h2 id="devices">Devices and browsers</h2>
        <ul>
          <li>The handbook runs in any current browser on a phone, tablet or computer. Nothing is installed.</li>
          <li>Progress does not sync between devices. To move, download on one and restore on the other.</li>
          <li>Phones and some browsers limit file downloads, calendar (.ics) files and printing. If a download does not appear, try another browser.</li>
          <li>If the browser blocks storage, the handbook still works for that visit but cannot remember anything afterward. The Account page tells you when that is the case.</li>
        </ul>

        <h2 id="access">Access and recovery</h2>
        {purchaseOpen() ? (
          <p>Details of how your purchase gives you access are on <Link href="/updates">Access and updates</Link>.</p>
        ) : (
          <p>
            There is no login to recover: the handbook has no accounts, passwords or purchase records today. If you lose your place, restore a progress file. How
            access works once purchase opens will be described on <Link href="/updates">Access and updates</Link> before anything is sold.
          </p>
        )}

        <h2 id="contact">Contact</h2>
        {OWNER.supportEmail ? (
          <p>Email <a href={`mailto:${OWNER.supportEmail}`}>{OWNER.supportEmail}</a>. Please say which device and browser you use and what you expected to see. Never send a password or card number.</p>
        ) : (
          <p>A support address has not been published yet. Until it is, the answers above cover the common questions.</p>
        )}
      </div>
    </>
  );
}
