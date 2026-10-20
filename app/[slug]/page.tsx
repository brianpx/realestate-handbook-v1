import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChapterView } from '@/components/shell/ChapterView';
import { JsonLd } from '@/components/shell/JsonLd';
import { chapterJsonLd } from '@/lib/jsonld';
import { isPageId, pageById, PAGE_IDS } from '@/lib/pages';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PAGE_IDS.filter(id => id !== 'cover').map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isPageId(slug)) return {};
  const { label } = pageById(slug);
  return { title: label, alternates: { canonical: `/${slug}` } };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!isPageId(slug) || slug === 'cover') notFound();
  return (
    <>
      <JsonLd data={chapterJsonLd(slug)} />
      <ChapterView id={slug} />
    </>
  );
}
