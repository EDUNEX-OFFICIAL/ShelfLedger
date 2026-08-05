'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/** Opens the browser print dialog once when `?print=1` is present. */
export function InvoicePrintTrigger() {
  const searchParams = useSearchParams();
  const shouldPrint = searchParams.get('print') === '1';

  useEffect(() => {
    if (!shouldPrint) return;
    const t = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(t);
  }, [shouldPrint]);

  return null;
}
