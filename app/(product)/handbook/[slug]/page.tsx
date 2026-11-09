import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UpsellCard } from '@/components/handbook/UpsellCard';
import { ChapterView } from '@/components/shell/ChapterView';
import { JsonLd } from '@/components/shell/JsonLd';
import { pageOpen } from '@/lib/access/entitlement';
import { requireViewer } from '@/lib/auth/dal';
import { chapterJsonLd } from '@/lib/jsonld';
import { isPageId, pageById, PAGE_IDS } from '@/lib/pages';
import { pageHref } from '@/lib/routes';

type Props = { params: Promise<{ slug: string }> };

// The slugs are fixed, so an unknown one is a 404 and not a database lookup; the page itself renders per request,
// because who is asking decides what it shows.
export const dynamicParams = false;

export function generateStaticParams() {
  return PAGE_IDS.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isPageId(slug)) return {};
  const { label } = pageById(slug);
  return { title: label, alternates: { canonical: pageHref(slug) } };
}

export default async function Page({ params }: Props) {
  const viewer = await requireViewer();
  const { slug } = await params;
  if (!isPageId(slug)) notFound();
  // Not in the reader's plan: the upsell card, never the chapter text (lib/access/entitlement.ts decides)
  if (!pageOpen(viewer.entitlement, slug)) return <UpsellCard page={slug} entitlement={viewer.entitlement} />;
  return (
    <>
      <JsonLd data={chapterJsonLd(slug)} />
      <ChapterView id={slug} entitlement={viewer.entitlement} />
    </>
  );
}
