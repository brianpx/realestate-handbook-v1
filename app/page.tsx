import { ChapterView } from '@/components/shell/ChapterView';
import { JsonLd } from '@/components/shell/JsonLd';
import { bookJsonLd } from '@/lib/jsonld';

export default function Home() {
  return (
    <>
      <JsonLd data={bookJsonLd()} />
      <ChapterView id="cover" />
    </>
  );
}
