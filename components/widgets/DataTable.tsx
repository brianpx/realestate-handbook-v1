'use client';

import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { htmlText } from '@/lib/html-text';
import type { PageTable } from '@/lib/page-table';
import { essentialOnly, useSettings } from '@/lib/state';
import { ESSENTIAL_WIDGETS } from '@/lib/tools';

type Row = { cells: string[]; text: string[]; rowHeader: boolean; /** the tool a row's link opens (Appendix E) */ widget: string | null };

const widgetOf = (cells: string[]) => /data-widget="([^"]+)"/.exec(cells.join(''))?.[1] ?? null;

// "15 to 25" sorts after "1 to 2", and headings compare without regard to case.
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const CELL_CLASS = 'p-2.5 align-top whitespace-normal text-left';

// A reference table from a page, sortable by any column and narrowed by a search box; after shadcnuikit's data-table
// (TanStack Table under shadcn/ui's Table). Cells are the page's own markup, so links, glossary terms and tool deep
// links inside them keep working. Every row is shown: these are lookup tables of ten to twenty rows, not feeds.
// Appendix E's rows point at tools; with Essential tools only on, the rows for tools that are not built stay in the
// markup but hidden (DeepLinks still answers a direct link to one by naming the setting).
export function DataTable({ id, table: source }: { id: string; table: PageTable }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState('');
  const off = essentialOnly(useSettings());
  const data = useMemo<Row[]>(() => source.rows.map(r => ({ ...r, text: r.cells.map(htmlText), widget: widgetOf(r.cells) })), [source]);
  const hidden = (row: Row) => off && row.widget !== null && !ESSENTIAL_WIDGETS.includes(row.widget);
  const columns = useMemo<ColumnDef<Row, string>[]>(
    () => source.head.map((heading, i) => ({
      id: `c${i}`,
      accessorFn: row => row.text[i] ?? '',
      sortingFn: (a, b) => collator.compare(a.getValue<string>(`c${i}`), b.getValue<string>(`c${i}`)),
      header: ({ column }) => {
        const sorted = column.getIsSorted();
        return (
          <Button variant="ghost" size="sm" className="-ml-2 h-auto py-1 text-xs font-bold tracking-wide uppercase" onClick={() => column.toggleSorting(sorted === 'asc')}>
            {heading}
            {sorted === 'asc' ? <ArrowUpIcon /> : sorted === 'desc' ? <ArrowDownIcon /> : <ArrowUpDownIcon className="opacity-50" />}
          </Button>
        );
      },
      cell: ({ row }) => <span dangerouslySetInnerHTML={{ __html: row.original.cells[i] ?? '' }} />,
    })),
    [source.head],
  );
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  const rows = table.getRowModel().rows;
  const shown = rows.filter(r => !hidden(r.original)).length;
  const total = data.filter(r => !hidden(r)).length;
  const inputId = `${id.replace(/[^a-z0-9-]+/gi, '-')}-filter`;

  return (
    <div className="data-table" data-widget-id={id}>
      <div className="flex flex-wrap items-center gap-3">
        <InputGroup className="max-w-xs">
          <InputGroupInput id={inputId} type="search" placeholder="Filter rows" aria-label="Filter rows" value={filter} onChange={e => setFilter(e.target.value)} />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
        <p className="text-muted-foreground m-0 text-sm" role="status">
          {filter ? `${shown} of ${total} rows` : `${total} rows`}
        </p>
      </div>
      <div className="mt-3 overflow-hidden rounded-md border">
        <Table className="m-0 border-0 text-[0.9rem]">
          {source.caption && <TableCaption className="p-2.5 text-left" dangerouslySetInnerHTML={{ __html: source.caption }} />}
          <TableHeader>
            {table.getHeaderGroups().map(group => (
              <TableRow key={group.id}>
                {group.headers.map(header => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id} scope="col" className="h-auto border-0 px-1 py-1 whitespace-normal" aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map(row => (
                <TableRow key={row.id} hidden={hidden(row.original)}>
                  {row.getVisibleCells().map((cell, i) =>
                    i === 0 && row.original.rowHeader ? (
                      <th key={cell.id} scope="row" className={`${CELL_CLASS} border-0 bg-transparent font-semibold`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </th>
                    ) : (
                      <TableCell key={cell.id} className={`${CELL_CLASS} border-0`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ),
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground h-16 border-0 text-center whitespace-normal">
                  No rows match “{filter}”.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
