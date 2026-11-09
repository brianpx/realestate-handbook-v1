'use client';

import { useEffect } from 'react';

// Sets <html data-hydrated="true"> once the shell's client components have mounted and attached their listeners
// (Ctrl+K, term popover, settings). Tests wait for it (e2e/hydration.ts) instead of approximating hydration with
// 'networkidle' or fixed waits. Rendered last in the product layout: React runs sibling effects in order, so the
// Sidebar's and TermPopover's effects have already run when this one sets the attribute.
export function HydrationMark() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = 'true';
  }, []);
  return null;
}
