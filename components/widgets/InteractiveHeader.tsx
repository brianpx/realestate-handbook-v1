import type { ReactNode } from 'react';

// The "INTERACTIVE" strip above a tool. `data-widget` is the key Appendix E and deep links use to find the tool.
export function InteractiveHeader({ hint, widgetKey, label, children }: { hint: string; widgetKey: string; label: string; children?: ReactNode }) {
  return (
    <div className="interactive-head" data-widget={widgetKey} data-label={label} tabIndex={-1}>
      <span className="interactive-pill"><span aria-hidden="true">◉ </span>INTERACTIVE</span>
      <span className="interactive-hint">{hint}</span>
      {children}
    </div>
  );
}
