import type { ReactNode } from 'react';

// The white sheet around handbook home, setup, plan, review and account.
// Chapter pages draw their own, so the in-page outline can sit beside it.
export function ProductCard({ children }: { children: ReactNode }) {
  return <div className="content-container" id="content-container">{children}</div>;
}
