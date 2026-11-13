import Link from 'next/link';
import { neighbors, type PageId } from '@/lib/pages';
import { HANDBOOK, pageHref } from '@/lib/routes';

export function ChapterEnd({ id }: { id: PageId }) {
  const { prev, next } = neighbors(id);
  return (
    <>
      {/* The colon is not drawn; it keeps each link's text a sentence ("Next: 2. Finding Clients") for a screen reader. */}
      <nav className="chapter-pager" aria-label="Previous and next page">
        {prev && (
          <p className="chapter-prev">
            <Link href={pageHref(prev.id)}><small>Previous<span className="undrawn">: </span></small><span>{prev.label}</span></Link>
          </p>
        )}
        <p className="chapter-next">
          {next
            ? <Link href={pageHref(next.id)}><small>Next<span className="undrawn">: </span></small><span>{next.label}</span></Link>
            : <Link href={HANDBOOK}>Back to the handbook home</Link>}
        </p>
      </nav>
      <footer className="chapter-foot">
        <p>Not legal advice. Confirm forms, compensation, and prospecting rules with your broker.</p>
        <p>
          For new agents. Worked examples use Keller Williams Command screens and terms, and each is labeled.
          In another CRM, use your website, client search app, pipeline stages, and branding settings.
        </p>
        <p>v1.0 · October 2026</p>
      </footer>
    </>
  );
}
