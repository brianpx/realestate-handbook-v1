import type { ReactNode } from 'react';

// Widget name -> component. Filled in as each widget is ported (phase 3). Unknown names render nothing,
// so the static chapter markup around the marker is what a reader sees until the port lands.
const WIDGETS: Record<string, () => ReactNode> = {};

export function Widget({ name }: { name: string }) {
  const Component = WIDGETS[name];
  return Component ? <Component /> : null;
}
