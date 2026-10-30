import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChapterView } from '@/components/shell/ChapterView';
import { JsonLd } from '@/components/shell/JsonLd';
import { chapterJsonLd } from '@/lib/jsonld';
import { isPageId, pageById, PAGE_IDS } from '@/lib/pages';
import { pageHref } from '@/lib/routes';

type Props = { params: Promise<{ slug: string }> };

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
  const { slug } = await params;
  if (!isPageId(slug)) notFound();
  return (
    <>
      <JsonLd data={chapterJsonLd(slug)} />
      <ChapterView id={slug} />
    </>
  );
}
