import { CircleCheckIcon, CircleMinusIcon } from 'lucide-react';
import Link from 'next/link';
import { badgeVariants } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { checkoutUrlFor, purchaseOpen } from '@/lib/offer';
import { FEATURES, TIERS, type FeatureValue, type Tier } from '@/lib/tiers';
import { cn } from '@/lib/utils';

// The plan comparison on /pricing, fed from lib/tiers.ts. A wide screen gets the grid, a phone one plan at a time
// behind tabs. Only the Tabs primitive is a client component; the rest renders on the server. Until purchaseOpen()
// is true the paid columns say so and their buttons stay disabled: nothing here can start a payment early.

const rowSpan = { gridRow: `1 / span ${FEATURES.length + 2}` };

// "Recommended", not "Most popular": nothing has been sold yet, so there is no popularity to report. Styled by
// badgeVariants rather than <Badge>, which renders through a hook and so would need a client component.
const Highlight = () => <span className={badgeVariants()}>Recommended</span>;

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <>
        <CircleCheckIcon aria-hidden className="size-5 text-foreground" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <CircleMinusIcon aria-hidden className="size-5 text-muted-foreground/50" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="text-muted-foreground">{value}</span>;
}

function Price({ tier, open }: { tier: Tier; open: boolean }) {
  if (tier.id === 'free') {
    return (
      <>
        <span className="text-4xl font-bold tracking-tight">Free</span>
        <span className="text-muted-foreground">No sign-up for the sample</span>
      </>
    );
  }
  return open && tier.priceDisplay ? (
    <>
      <span className="text-4xl font-bold tracking-tight tabular-nums">{tier.priceDisplay}</span>
      <span className="text-muted-foreground">One-time purchase</span>
    </>
  ) : (
    <>
      <span className="text-xl font-semibold">Not on sale yet</span>
      <span className="text-muted-foreground">One-time purchase; the price comes first</span>
    </>
  );
}

function PlanCta({ tier, className }: { tier: Tier; className?: string }) {
  const variant = tier.highlighted ? 'default' : 'outline';
  // The outline variant's border is lost to the base `border-transparent` in light mode, so a ring draws the edge.
  const edge = cn(className, !tier.highlighted && 'ring-1 ring-border');
  // Links are plain anchors in the button's clothes: <Button render={<a/>}> would give them role="button". The
  // text colours hold the button's own colour over the public site's `.pub a` and `a:hover` rules.
  const asLink = buttonVariants({ variant, size: 'lg', className: cn(edge, tier.highlighted ? 'text-primary-foreground hover:text-primary-foreground' : 'text-foreground hover:text-foreground') });
  if (tier.id === 'free') return <Link className={asLink} href="/preview">Try the sample lesson</Link>;
  const url = checkoutUrlFor(tier.id);
  if (!url) return <Button variant={variant} size="lg" className={edge} disabled>Not on sale yet</Button>;
  return <a className={asLink} href={url} rel="noopener">{`Get ${tier.name}, ${tier.priceDisplay}`}</a>;
}

export function PricingTable() {
  const open = purchaseOpen();
  const defaultTab = TIERS.find(t => t.highlighted)?.id ?? 'free';
  return (
    <div className="text-sm">
      {/* Wide screens: the comparison grid. Each plan cell names its row for a reader moving down one column. */}
      <div className="hidden grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,1fr))] md:grid">
        <div aria-hidden className="col-span-3 col-start-2 rounded-3xl bg-muted/50" style={rowSpan} />

        <div className="col-start-1 grid grid-rows-subgrid" style={rowSpan}>
          <div className="border-b" />
          {FEATURES.map(feature => (
            <div key={feature.label} className="flex items-center border-b py-5 pr-4 font-medium text-foreground">{feature.label}</div>
          ))}
          <div />
        </div>

        {TIERS.map((tier, index) => (
          <div
            key={tier.id}
            className={cn('grid grid-rows-subgrid text-center', tier.highlighted && 'relative z-10 rounded-3xl border bg-background')}
            style={{ ...rowSpan, gridColumn: index + 2 }}
          >
            <div className="flex flex-col items-center gap-1 border-b px-4 pt-8 pb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">{tier.name}</h3>
                {tier.highlighted && <Highlight />}
              </div>
              <div className="text-muted-foreground">{tier.tagline}</div>
              <div className="mt-2 flex flex-col items-center gap-1"><Price tier={tier} open={open} /></div>
            </div>

            {FEATURES.map(feature => (
              <div key={feature.label} className="flex items-center justify-center border-b px-4 py-5">
                <span className="sr-only">{feature.label}: </span>
                <FeatureCell value={feature.values[tier.id]} />
              </div>
            ))}

            <div className="flex items-center justify-center px-4 py-6">
              <PlanCta tier={tier} className="w-full max-w-48" />
            </div>
          </div>
        ))}
      </div>

      {/* Phones: one plan at a time */}
      <Tabs defaultValue={defaultTab} className="gap-4 md:hidden">
        <TabsList className="w-full">
          {TIERS.map(tier => <TabsTrigger key={tier.id} value={tier.id} className="flex-1">{tier.name}</TabsTrigger>)}
        </TabsList>

        {TIERS.map(tier => (
          <TabsContent key={tier.id} value={tier.id}>
            <Card className={cn('shadow-none', tier.highlighted && 'ring-primary')}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-lg font-semibold text-foreground">{tier.name}</h3>
                  {tier.highlighted && <Highlight />}
                </div>
                <div className="text-muted-foreground">{tier.tagline}</div>
                <div className="mt-3 flex flex-col gap-1"><Price tier={tier} open={open} /></div>
              </CardHeader>
              <CardContent>
                <ul className="divide-y border-y">
                  {FEATURES.map(feature => (
                    <li key={feature.label} className="flex items-center justify-between gap-4 py-3">
                      <span className="font-medium text-foreground">{feature.label}</span>
                      <span className="flex items-center text-right"><FeatureCell value={feature.values[tier.id]} /></span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <PlanCta tier={tier} className="w-full" />
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
