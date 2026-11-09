import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatWhen } from '@/lib/admin/format';
import { RECENT_COUNT } from '@/lib/admin/lead-stats';
import type { LeadRow } from '@/lib/leads/store';

export function RecentLeads({ leads }: { leads: LeadRow[] }) {
  return (
    <Card className="min-w-0 gap-0 py-0 shadow-none">
      <CardHeader className="border-b py-4">
        <CardTitle>Recent leads</CardTitle>
        <CardDescription>The last {RECENT_COUNT} addresses to come in.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {leads.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No leads yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Source</TableHead>
                <TableHead className="pr-4 text-right text-muted-foreground">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell className="pl-4 font-medium">{lead.email}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.source}</TableCell>
                  <TableCell className="pr-4 text-right tabular-nums text-muted-foreground">{formatWhen(lead.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
