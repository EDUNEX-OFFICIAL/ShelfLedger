import Link from 'next/link';
import { Package, ScrollText } from 'lucide-react';
import { requireSession } from '@/server/auth/guards';
import { inventoryService } from '@/server/services/inventory';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { StockLedgerList } from '@/features/inventory/stock-ledger-list';

const MOVEMENT_LABELS: Record<string, string> = {
  OPENING: 'Starting',
  PURCHASE: 'Purchase',
  PURCHASE_RETURN: 'Purchase return',
  SALE: 'Sale',
  SALE_RETURN: 'Sale return',
  EXCHANGE_IN: 'Exchange in',
  EXCHANGE_OUT: 'Exchange out',
  ADJUSTMENT_IN: 'Adjust in',
  ADJUSTMENT_OUT: 'Adjust out',
  DAMAGE: 'Damage',
  LOST: 'Lost',
  FOUND: 'Found',
  TRANSFER_IN: 'Transfer in',
  TRANSFER_OUT: 'Transfer out',
};

function typeFamily(movementType: string): string {
  if (movementType === 'SALE' || movementType === 'SALE_RETURN') return 'sale';
  if (movementType === 'PURCHASE' || movementType === 'PURCHASE_RETURN') return 'purchase';
  if (movementType === 'OPENING') return 'opening';
  if (movementType === 'EXCHANGE_IN' || movementType === 'EXCHANGE_OUT') return 'exchange';
  if (movementType === 'TRANSFER_IN' || movementType === 'TRANSFER_OUT') return 'transfer';
  return 'adjust';
}

function refFor(
  referenceType: string,
  referenceId: string,
): { label: string; href: string | null } {
  const short = referenceId.slice(0, 8);
  switch (referenceType) {
    case 'SALE':
    case 'SALE_VOID':
      return { label: `Invoice · ${short}`, href: `/sales/${referenceId}/invoice` };
    case 'PURCHASE':
      return { label: `Purchase · ${short}`, href: '/purchases' };
    case 'PURCHASE_RETURN':
      return { label: `Purchase return · ${short}`, href: '/purchases' };
    case 'EXCHANGE':
      return { label: `Exchange · ${short}`, href: '/exchanges' };
    case 'OPENING':
      return { label: 'Starting stock', href: '/inventory#opening-stock' };
    case 'ADJUSTMENT':
      return { label: 'Adjustment', href: '/inventory#adjustments' };
    case 'TRANSFER':
      return { label: `Transfer · ${short}`, href: null };
    default:
      return { label: `${referenceType} · ${short}`, href: null };
  }
}

const LEDGER_LIMIT = 200;

export default async function StockLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ sku?: string }>;
}) {
  const user = await requireSession();
  const params = await searchParams;
  const initialSku = params.sku?.trim() || undefined;
  const entries = await inventoryService.listLedger(user);

  const inCount = entries.filter((e) => Number(e.qtyChange) > 0).length;
  const outCount = entries.filter((e) => Number(e.qtyChange) < 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock history"
        description="Every stock in/out is saved here. Fixes are new entries — old rows are never deleted."
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <Link href="/inventory" className={buttonClassName({ size: 'lg' })}>
              <Package className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Balances
            </Link>
            <Link
              href="/inventory#opening-stock"
              className={buttonClassName({ variant: 'secondary', size: 'md' })}
            >
              <ScrollText className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Post stock
            </Link>
          </div>
        }
      />

      {entries.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Showing last{' '}
          <span className="font-medium text-foreground">{entries.length}</span>
          {entries.length >= LEDGER_LIMIT ? ` (cap ${LEDGER_LIMIT})` : ''} movements
          {' · '}
          <span className="font-medium text-success">{inCount}</span> in
          {' · '}
          <span className="font-medium text-destructive">{outCount}</span> out
          {initialSku ? (
            <>
              {' · '}
              filtered to item code{' '}
              <span className="font-mono font-medium text-foreground">{initialSku}</span>
            </>
          ) : null}
        </p>
      ) : null}

      <section className="space-y-3">
        <SectionHeader
          title="Movements"
          description="Newest first. Tap a sale row to open the invoice."
        />
        <StockLedgerList
          initialSku={initialSku}
          rows={entries.map((e) => {
            const ref = refFor(e.referenceType, e.referenceId);
            return {
              id: e.id,
              when: e.occurredAt.toISOString(),
              movementType: e.movementType,
              movementLabel: MOVEMENT_LABELS[e.movementType] ?? e.movementType,
              typeFamily: typeFamily(e.movementType),
              sku: e.variant.sku,
              articleName: e.variant.article.name,
              sizeColor: `${e.variant.size}/${e.variant.color}`,
              location: e.location.name,
              qtyChange: Number(e.qtyChange),
              unitCost: Number(e.unitCost),
              referenceType: e.referenceType,
              referenceId: e.referenceId,
              refLabel: ref.label,
              refHref: ref.href,
              notes: e.notes,
            };
          })}
        />
      </section>
    </div>
  );
}
