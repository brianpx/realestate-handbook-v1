'use client';

import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, SearchIcon, UserSearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toCsv } from '@/lib/admin/csv';
import { formatCount, formatWhen } from '@/lib/admin/format';
import { pageItems } from '@/lib/admin/pagination';
import type { LeadRow } from '@/lib/leads/store';
import { cn } from '@/lib/utils';

/** A LeadRow as it crosses from the server: the times as ISO strings, which also sort correctly as text. */
export type SerializedLead = Omit<LeadRow, 'createdAt' | 'confirmedAt'> & { createdAt: string; confirmedAt: string | null };

const PAGE_SIZES = [10, 25, 50, 100] as const;
const STATUS_LABEL: Record<NonNullable<LeadRow['emailStatus']> | 'pending', string> = { sent: 'sent', failed: 'failed', skipped: 'skipped', pending: 'pending' };
const statusOf = (lead: SerializedLead) => lead.emailStatus ?? 'pending';

function SortHeader({ label, sorted, onClick }: { label: string; sorted: false | 'asc' | 'desc'; onClick: () => void }) {
  const Icon = sorted === 'asc' ? ArrowUpIcon : sorted === 'desc' ? ArrowDownIcon : ArrowUpDownIcon;
  return (
    <Button variant="ghost" size="sm" className="-ml-2.5" onClick={onClick}>
      {label}
      <Icon className={cn(!sorted && 'text-muted-foreground')} />
    </Button>
  );
}

const sortHeader = (label: string): ColumnDef<SerializedLead>['header'] =>
  ({ column }) => <SortHeader label={label} sorted={column.getIsSorted()} onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} />;

const columns: ColumnDef<SerializedLead>[] = [
  {
    accessorKey: 'email',
    header: sortHeader('Email'),
    // the one search box matches either column; the filter lives on this column so the table has one place to look
    filterFn: (row, _id, value: string) => {
      const q = value.toLowerCase();
      const { email, source } = row.original;
      // "failed" and "unconfirmed" find the addresses whose confirmation never went out or was never opened
      return email.toLowerCase().includes(q) || source.toLowerCase().includes(q) || statusOf(row.original).includes(q) || (row.original.confirmedAt ? 'confirmed' : 'unconfirmed').includes(q);
    },
    cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
  },
  { accessorKey: 'source', header: sortHeader('Source'), cell: ({ row }) => <span className="text-muted-foreground">{row.original.source}</span> },
  { accessorKey: 'createdAt', header: sortHeader('Signed up'), cell: ({ row }) => <span className="tabular-nums">{formatWhen(row.original.createdAt)}</span> },
  {
    id: 'emailStatus',
    accessorFn: statusOf,
    header: sortHeader('Email status'),
    cell: ({ row }) => {
      const status = statusOf(row.original);
      return <Badge variant={status === 'failed' ? 'destructive' : status === 'sent' ? 'secondary' : 'outline'}>{STATUS_LABEL[status]}</Badge>;
    },
  },
  {
    id: 'confirmed',
    // a string, so the sort puts the unconfirmed together instead of comparing null to a date
    accessorFn: lead => lead.confirmedAt ?? '',
    header: sortHeader('Confirmed'),
    cell: ({ row }) => (row.original.confirmedAt ? <span className="tabular-nums">{formatWhen(row.original.confirmedAt)}</span> : <Badge variant="outline">not yet</Badge>),
  },
  { accessorKey: 'consentVersion', header: sortHeader('Consent version'), cell: ({ row }) => <span className="text-muted-foreground">{row.original.consentVersion}</span> },
];

const ariaSort = (sorted: false | 'asc' | 'desc') => (sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined);

// Built in the browser from the rows the admin is looking at, so a search narrows the file too.
function downloadCsv(rows: SerializedLead[]) {
  const csv = toCsv([
    ['email', 'source', 'signed_up', 'email_status', 'confirmed', 'consent_version'],
    ...rows.map(r => [r.email, r.source, r.createdAt, statusOf(r), r.confirmedAt ?? '', r.consentVersion]),
  ]);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function LeadsTable({ leads }: { leads: SerializedLead[] }) {
  const [query, setQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const columnFilters = useMemo<ColumnFiltersState>(() => (query.trim() ? [{ id: 'email', value: query.trim() }] : []), [query]);

  const table = useReactTable({
    data: leads,
    columns,
    getRowId: row => row.id,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const filtered = table.getFilteredRowModel().rows;
  const totalRows = filtered.length;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);
  const pageCount = table.getPageCount();
  const rows = table.getRowModel().rows;
  // the page index never ends up past the end: a search or a page-size change puts it back to 0, and the rows are fixed

  return (
    <Card className="min-w-0 gap-0 py-0 shadow-none">
      <CardHeader className="flex flex-col gap-4 border-b py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-lg">All leads</CardTitle>
          <CardDescription>{formatCount(leads.length)} stored{totalRows !== leads.length ? `, ${formatCount(totalRows)} matching` : ''}. Times are UTC.</CardDescription>
        </div>
        <Button variant="outline" onClick={() => downloadCsv(filtered.map(r => r.original))} disabled={totalRows === 0} className="w-full sm:w-auto">
          <DownloadIcon />
          Export CSV
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-0 pt-4">
        <div className="px-4">
          <InputGroup className="md:max-w-xs">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput value={query} onChange={event => { setQuery(event.target.value); setPagination(prev => ({ ...prev, pageIndex: 0 })); }} placeholder="Search email, source or status" aria-label="Search leads" />
          </InputGroup>
        </div>

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(group => (
              <TableRow key={group.id} className="bg-muted/50 hover:bg-muted/50">
                {group.headers.map(header => (
                  <TableHead key={header.id} aria-sort={ariaSort(header.column.getIsSorted())} className="text-muted-foreground first:pl-4 last:pr-4">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="first:pl-4 last:pr-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0 whitespace-normal">
                  <Empty className="py-10">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <UserSearchIcon />
                      </EmptyMedia>
                      <EmptyTitle>{leads.length === 0 ? 'No leads yet' : 'No leads match'}</EmptyTitle>
                      <EmptyDescription>
                        {leads.length === 0 ? 'Addresses left through the email form will be listed here.' : 'Nothing has that text in its email, source or status.'}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t py-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Rows per page</span>
          <Select value={String(pageSize)} onValueChange={value => setPagination({ pageIndex: 0, pageSize: Number(value) })}>
            <SelectTrigger size="sm" className="w-20" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map(size => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="tabular-nums">
            {firstRow}-{lastRow} of <span className="font-medium text-foreground">{formatCount(totalRows)}</span>
          </span>
        </div>
        <nav className="ml-auto flex items-center gap-1" aria-label="Pagination">
          <Button variant="ghost" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
            <ChevronLeftIcon />
          </Button>
          {pageItems(pageIndex, pageCount).map((item, i) =>
            item === 'gap' ? (
              <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted-foreground">…</span>
            ) : (
              <Button key={item} variant={pageIndex === item ? 'outline' : 'ghost'} size="icon-sm" className="tabular-nums" onClick={() => table.setPageIndex(item)} aria-label={`Page ${item + 1}`} aria-current={pageIndex === item ? 'page' : undefined}>
                {item + 1}
              </Button>
            ),
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
            <ChevronRightIcon />
          </Button>
        </nav>
      </CardFooter>
    </Card>
  );
}
