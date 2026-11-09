'use client';

import { createContext, useContext, type ComponentPropsWithoutRef, type ReactNode } from 'react';

const DemotedContext = createContext(false);

// The public sample demotes every chapter heading one level (components/site/Excerpt.tsx). Tools render their own
// box titles, so they read the same signal and move down with the chapter: h3 in the handbook, h4 in the sample.
export function DemotedHeadings({ children }: { children: ReactNode }) {
  return <DemotedContext.Provider value={true}>{children}</DemotedContext.Provider>;
}

export function BoxTitle(props: ComponentPropsWithoutRef<'h3'>) {
  const Tag = useContext(DemotedContext) ? 'h4' : 'h3';
  return <Tag className="box-title" {...props} />;
}
