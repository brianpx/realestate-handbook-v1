import { DatabaseIcon } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

// storeFromEnv found nothing: the lead route answers 503 in this state too, so there is nothing to list.
export function NoStore() {
  return (
    <Empty className="mx-auto max-w-xl py-16">
      <EmptyHeader>
        <EmptyMedia className="mb-4 size-16 rounded-md border-2 border-dashed border-muted-foreground/30 text-muted-foreground">
          <DatabaseIcon className="size-6" />
        </EmptyMedia>
        <EmptyTitle className="text-lg font-semibold">No lead store is configured</EmptyTitle>
        <EmptyDescription>
          Leads are read from the database named by <code>DATABASE_URL</code>, or from the throwaway file store when{' '}
          <code>LEAD_STORE=file</code> is set outside a hosted deployment. Neither is set here, so the lead form is refusing
          submissions and there is nothing to show.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
