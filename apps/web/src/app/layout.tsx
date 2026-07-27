import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthSessionProvider } from '@/components/providers/session-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShelfLedger',
  description: 'Retail inventory and GST billing ERP',
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
