import { FooterLinks } from '@/components/shell/FooterLinks';
import { copyright, HELP_LINKS, POLICY_LINKS } from '@/lib/footer';

// Sits at the end of the scrolling #main-content, after every handbook and account page. It is not sticky: reading
// space matters more on a phone. The legal disclaimer stays in ChapterEnd, so
// this carries only the links and the copyright line.
export function HandbookFooter() {
  const notice = copyright();
  return (
    <footer className="handbook-footer">
      {notice ? <p>{notice}</p> : null}
      <nav aria-label="Policies and help">
        <FooterLinks links={[...HELP_LINKS, ...POLICY_LINKS]} />
      </nav>
    </footer>
  );
}
