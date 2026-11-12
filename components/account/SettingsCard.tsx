import type { ComponentProps, ReactNode } from 'react';
import { cn } from 'cn';

type Props = {
  /** Anchors the card (`/account#delete`) and names its heading, so it must be unique on the page. */
  id: string;
  title: string;
  description?: ReactNode;
  /** The control area; leave it out for a card that is only a title and a description above its footer. */
  children?: ReactNode;
  /** The muted hint at the left of the footer bar. */
  footer?: ReactNode;
  /** The footer's right-hand side, normally the Save button. With `form`, a submit button here submits it. */
  action?: ReactNode;
  /** Sits at the right of the title and description (the avatar picture); below them on a narrow screen. */
  aside?: ReactNode;
  tone?: 'default' | 'danger';
  /** Makes the control area and the footer one `<form>`, so the footer's button submits what is above it. */
  form?: Omit<ComponentProps<'form'>, 'children' | 'className'>;
};

// A Vercel-style settings panel: a bordered, 6px-rounded card with a title, a description, the control area and a
// footer bar (hint on the left, action on the right). It has no state, so a server page or a client form can both
// render it; the account page stacks them, and the authentication and billing pages are meant to do the same.
export function SettingsCard({ id, title, description, children, footer, action, aside, tone = 'default', form }: Props) {
  const danger = tone === 'danger';
  const titleId = `${id}-title`;
  const content = (
    <>
      <div className="grid min-w-0 gap-3 p-5 max-sm:p-4">
        <div className={cn(aside && 'flex items-start justify-between gap-4 max-sm:flex-col')}>
          <div className="grid min-w-0 gap-3">
            <h2 id={titleId} className="m-0 border-0 p-0 text-xl font-semibold leading-tight">{title}</h2>
            {description && <div className="text-sm text-muted-foreground [&>p]:m-0">{description}</div>}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
        {children}
      </div>
      {(footer || action) && (
        <div
          data-settings-card-footer
          className={cn(
            'flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t px-5 py-3 max-sm:px-4',
            danger ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40' : 'border-border bg-muted/50',
          )}
        >
          <p className={cn('m-0 min-w-0 flex-1 basis-60 text-sm', danger ? 'text-red-800 dark:text-red-200' : 'text-muted-foreground')}>{footer}</p>
          {action && <div className="shrink-0 max-sm:w-full [&>*]:max-sm:w-full">{action}</div>}
        </div>
      )}
    </>
  );
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      data-settings-card
      data-tone={tone}
      className={cn('mb-6 overflow-hidden rounded-[6px] border bg-card text-card-foreground', danger ? 'border-red-300 dark:border-red-900' : 'border-border')}
    >
      {form ? <form {...form}>{content}</form> : content}
    </section>
  );
}
