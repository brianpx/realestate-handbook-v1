'use client';

import type { ReactNode } from 'react';
import { essentialOnly, useSettings } from '@/lib/state';

// "Essential tools only" keeps five tools and leaves the rest of the handbook as plain text, as the static site
// did. With the setting on, a gated tool is not built; `fallbackHtml` (the page's original markup, when the tool
// replaced some) shows instead.
export function ToolGate({ fallbackHtml, children }: { fallbackHtml?: string; children: ReactNode }) {
  if (!essentialOnly(useSettings())) return <>{children}</>;
  return fallbackHtml ? <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: fallbackHtml }} /> : null;
}
