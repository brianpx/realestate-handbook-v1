import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCount, formatShare } from '@/lib/admin/format';
import type { PlacementStat } from '@/lib/auth/store';

// Which sign-in form earns its space: link requests against the sign-ins they led to, from the tokens themselves
// (lib/auth/placements.ts), so no analytics tracker is involved.
export function SignInPlacements({ placements }: { placements: PlacementStat[] }) {
  return (
    <Card className="min-w-0 gap-0 py-0 shadow-none">
      <CardHeader className="border-b py-4">
        <CardTitle>Sign-in placements</CardTitle>
        <CardDescription>Links requested from each form, and how many were opened.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {placements.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No sign-in links requested yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 text-muted-foreground">Placement</TableHead>
                <TableHead className="text-right text-muted-foreground">Requested</TableHead>
                <TableHead className="text-right text-muted-foreground">Signed in</TableHead>
                <TableHead className="pr-4 text-right text-muted-foreground">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placements.map(p => (
                <TableRow key={p.source ?? 'none'}>
                  <TableCell className="pl-4 font-medium">{p.source ?? '(none)'}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(p.requested)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(p.signedIn)}</TableCell>
                  <TableCell className="pr-4 text-right tabular-nums text-muted-foreground">{formatShare(p.requested ? p.signedIn / p.requested : 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
