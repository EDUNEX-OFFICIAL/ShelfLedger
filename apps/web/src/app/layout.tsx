import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthSessionProvider } from '@/components/providers/session-provider';
import { PRODUCT_NAME } from '@/lib/shop-branding';
import './globals.css';

/** Fallback only — live shop name comes from (app) / login generateMetadata. */
export const metadata: Metadata = {
  title: {
    default: PRODUCT_NAME,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description: 'Retail inventory and GST billing',
  applicationName: PRODUCT_NAME,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
