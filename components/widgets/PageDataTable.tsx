import { parsePageTable } from '@/lib/page-table';
import { DataTable } from './DataTable';

// The data-table marker wraps one of a page's reference tables. This takes the table apart on the server and hands
// the rows to the client component, which sorts and filters them.
export function PageDataTable({ id, html }: { page: string; id: string; html?: string }) {
  if (html === undefined) throw new Error(`${id}: the data-table marker must wrap a <table>`);
  return <DataTable id={id} table={parsePageTable(html)} />;
}
