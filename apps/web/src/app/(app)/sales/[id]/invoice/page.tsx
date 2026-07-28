import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Receipt } from 'lucide-react';
import { requireSession } from '@/server/auth/guards';
import { saleService } from '@/server/services/sale';
import { InvoiceDocument } from '@/features/sales/invoice-document';
import { InvoiceActions } from '@/features/sales/whatsapp-share-button';
import { StatusBadge } from '@/components/ui/badge';
import { SurfaceCard } from '@/components/shared/surface-card';

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  const sale = await saleService.get(user, id);
  if (!sale || sale.status !== 'POSTED') notFound();

  const org = sale.organization;
  const cgst = sale.lines.reduce((s, l) => s + Number(l.cgstAmount), 0);
  const sgst = sale.lines.reduce((s, l) => s + Number(l.sgstAmount), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6 print:max-w-none print:space-y-0">
      <div className="space-y-4 print:hidden">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Link
              href="/sales"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Sales
            </Link>
            <span className="text-muted-foreground/40" aria-hidden>
              /
            </span>
            <Link
              href="/sales/quick"
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              Quick Sale
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Receipt className="h-5 w-5 text-primary" aria-hidden />
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
              Invoice
            </h1>
            <StatusBadge status={sale.status} />
            <StatusBadge status={sale.paymentStatus} />
          </div>
          <p className="mt-1.5 font-mono text-sm text-muted-foreground">{sale.invoiceNo}</p>
        </div>

        <SurfaceCard padding="sm">
          <InvoiceActions
            invoice={{
              shopName: org.name,
              invoiceNo: sale.invoiceNo,
              invoiceDate: sale.invoiceDate.toISOString().slice(0, 10),
              customerName: sale.customer.isWalkIn ? 'Customer' : sale.customer.name,
              customerPhone: sale.customer.phone,
              lines: sale.lines.map((l) => ({
                name: l.variant.article.name,
                sku: l.variant.sku,
                qty: Number(l.qty),
                lineTotal: Number(l.lineTotal),
              })),
              taxable: Number(sale.subtotal),
              cgst,
              sgst,
              total: Number(sale.totalAmount),
              paymentStatus: sale.paymentStatus,
            }}
          />
        </SurfaceCard>
      </div>

      <InvoiceDocument sale={sale} />
    </div>
  );
}
