'use client';

import { useEffect } from 'react';

// A link to #id scrolls to a closed <details> but leaves it closed. This opens it when the hash names it: on load,
// on a hash change, and on a click of a link to the hash the URL already has (which fires no hashchange). The
// browser does the scrolling; opening only adds content below the summary, so the target does not move.
export function OpenOnHash({ id }: { id: string }) {
  useEffect(() => {
    const hash = `#${id}`;
    const open = () => {
      const target = document.getElementById(id);
      if (target instanceof HTMLDetailsElement) target.open = true;
    };
    const onHashChange = () => {
      if (window.location.hash === hash) open();
    };
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      if (link?.getAttribute('href') === hash) open();
    };
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      document.removeEventListener('click', onClick);
    };
  }, [id]);
  return null;
}
