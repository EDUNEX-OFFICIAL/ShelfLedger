'use client';

import { useEffect, useState } from 'react';

/** Client media query; `null` until mounted (SSR-safe). */
export function useMediaQuery(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return matches;
}

/** Tailwind `lg` = 1024px. */
export function useIsLgUp(): boolean | null {
  return useMediaQuery('(min-width: 1024px)');
}
