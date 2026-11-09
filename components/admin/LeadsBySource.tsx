import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCount, formatShare } from '@/lib/admin/format';
import type { SourceShare } from '@/lib/admin/lead-stats';

// One bar per placement. The numbers carry the meaning; the bar is decoration for the eye and hidden from readers.
export function LeadsBySource({ sources }: { sources: SourceShare[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Leads by source</CardTitle>
        <CardDescription>Which placement each address came through.</CardDescription>
      </CardHeader>
      <CardContent>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {sources.map(({ source, count, share }) => (
              <li key={source} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{source}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatCount(count)} <span aria-hidden="true">·</span> {formatShare(share)}
                  </span>
                </div>
                <div aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(share * 100, 1)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
