import { useId } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCount } from '@/lib/admin/format';

export type Stat = { label: string; value: number; caption: string };

function StatCard({ stat }: { stat: Stat }) {
  const id = useId();
  return (
    <Card role="group" aria-labelledby={id} className="gap-3 shadow-none">
      <CardHeader>
        <CardTitle id={id} className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">{formatCount(stat.value)}</span>
      </CardContent>
      <CardFooter className="border-t text-xs text-muted-foreground">{stat.caption}</CardFooter>
    </Card>
  );
}

/** The overview's number row. Plain counts: there is no earlier period to compare against yet. */
export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(stat => <StatCard key={stat.label} stat={stat} />)}
    </div>
  );
}
