import {
  computeWeightedAverageCost,
  roundUnitCost,
} from '@shelfledger/domain';
import type { StockMovementType, ReferenceType } from '@shelfledger/db';
import { InsufficientStockError, BusinessRuleError } from '@shelfledger/errors';
import {
  inventoryBalanceRepository,
  stockLedgerRepository,
  type TxClient,
} from '@shelfledger/db';

export type StockMovementInput = {
  organizationId: string;
  locationId: string;
  variantId: string;
  qty: number;
  unitCost: number;
  movementType: StockMovementType;
  referenceType: ReferenceType;
  referenceId: string;
  referenceLineId?: string | null;
  notes?: string | null;
  occurredAt?: Date;
  userId: string;
  /** Inbound purchase/opening: update weighted average. */
  affectsAverageCost: boolean;
  /** Manager override for outbound below zero (sales). */
  allowNegative?: boolean;
};

/**
 * Ledger + balance update inside an open Prisma transaction.
 * Never call outside a transaction for multi-step document posts.
 */
export async function applyStockMovement(tx: TxClient, input: StockMovementInput) {
  if (!(input.qty > 0)) {
    throw new BusinessRuleError('Stock movement quantity must be positive');
  }

  const existing = await inventoryBalanceRepository.find(tx, input.locationId, input.variantId);
  const oldQty = Number(existing?.quantity ?? 0);
  const oldAvg = Number(existing?.avgUnitCost ?? 0);
  const outbound = isOutbound(input.movementType);
  const signedQty = outbound ? -input.qty : input.qty;
  const newQty = oldQty + signedQty;

  if (outbound && newQty < -0.000001 && !input.allowNegative) {
    throw new InsufficientStockError('Insufficient stock for this movement', {
      available: oldQty,
      requested: input.qty,
      variantId: input.variantId,
    });
  }

  let newAvg = oldAvg;
  let ledgerUnitCost = input.unitCost;

  if (isCostPreservingReturn(input.movementType)) {
    // Keep average unchanged when stock returns (purchase return / sale return / exchange in)
    newAvg = newQty <= 0 ? 0 : oldAvg;
    ledgerUnitCost = input.unitCost > 0 ? input.unitCost : oldAvg;
  } else if (!outbound && input.affectsAverageCost) {
    newAvg = roundUnitCost(
      computeWeightedAverageCost({
        oldQty,
        oldAvg,
        inQty: input.qty,
        inRate: input.unitCost,
      }),
    );
    ledgerUnitCost = input.unitCost;
  } else if (outbound) {
    ledgerUnitCost = oldAvg;
    if (newQty <= 0) newAvg = 0;
  } else {
    // Non-cost inbound (e.g. FOUND without cost policy)
    ledgerUnitCost = input.unitCost > 0 ? input.unitCost : oldAvg;
    if (oldQty <= 0 && input.unitCost > 0) {
      newAvg = roundUnitCost(input.unitCost);
    }
  }

  await stockLedgerRepository.create(tx, {
    organizationId: input.organizationId,
    locationId: input.locationId,
    variantId: input.variantId,
    movementType: input.movementType,
    qtyChange: signedQty,
    unitCost: roundUnitCost(ledgerUnitCost),
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    referenceLineId: input.referenceLineId,
    notes: input.notes,
    occurredAt: input.occurredAt ?? new Date(),
    createdBy: input.userId,
  });

  if (existing) {
    await tx.inventoryBalance.update({
      where: { id: existing.id },
      data: {
        quantity: newQty,
        avgUnitCost: roundUnitCost(newAvg),
        updatedBy: input.userId,
      },
    });
  } else {
    await tx.inventoryBalance.create({
      data: {
        organizationId: input.organizationId,
        locationId: input.locationId,
        variantId: input.variantId,
        quantity: newQty,
        avgUnitCost: roundUnitCost(newAvg),
        createdBy: input.userId,
        updatedBy: input.userId,
      },
    });
  }

  return {
    oldQty,
    newQty,
    oldAvg,
    newAvg: roundUnitCost(newAvg),
    signedQty,
    unitCost: roundUnitCost(ledgerUnitCost),
  };
}

function isOutbound(type: StockMovementType): boolean {
  return (
    type === 'PURCHASE_RETURN' ||
    type === 'SALE' ||
    type === 'EXCHANGE_OUT' ||
    type === 'ADJUSTMENT_OUT' ||
    type === 'DAMAGE' ||
    type === 'LOST' ||
    type === 'TRANSFER_OUT'
  );
}

function isCostPreservingReturn(type: StockMovementType): boolean {
  return type === 'PURCHASE_RETURN' || type === 'SALE_RETURN' || type === 'EXCHANGE_IN';
}
