import Link from 'next/link';
import { neighbors, type PageId } from '@/lib/pages';

export function ChapterEnd({ id }: { id: PageId }) {
  const { next } = neighbors(id);
  return (
    <>
      <p className="chapter-next">
        {next ? <Link href={`/${next.id}`}>Next: {next.label}</Link> : <Link href="/">Back to the title page</Link>}
      </p>
      <footer className="chapter-foot">
        <p>Not legal advice. Confirm forms, compensation, and prospecting rules with your broker.</p>
        <p>
          For new agents. Worked examples use Keller Williams Command names. In another CRM, use your website, client search app,
          pipeline stages, and drip campaigns.
        </p>
        <p>v1.0 · October 2026</p>
      </footer>
    </>
  );
}
