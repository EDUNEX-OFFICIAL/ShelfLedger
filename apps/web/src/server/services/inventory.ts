import { prisma, orgContextRepository, inventoryBalanceRepository, stockLedgerRepository } from '@shelfledger/db';
import type { SessionUser } from '@shelfledger/db';
import { BusinessRuleError, NotFoundError } from '@shelfledger/errors';
import type { OpeningStockInput, StockAdjustmentInput } from '@shelfledger/validators';
import { applyStockMovement } from '@/server/services/stock-ledger';

export const inventoryService = {
  listBalances(user: SessionUser) {
    return inventoryBalanceRepository.list(user.organizationId);
  },

  listLedger(user: SessionUser, opts?: { locationId?: string; variantId?: string }) {
    return stockLedgerRepository.list(user.organizationId, { ...opts, limit: 200 });
  },

  listVariants(user: SessionUser) {
    return orgContextRepository.listVariants(user.organizationId);
  },

  async openingStock(user: SessionUser, input: OpeningStockInput) {
    const location = await orgContextRepository.defaultLocation(user.organizationId);
    if (!location) throw new BusinessRuleError('No default location configured');

    const variant = await prisma.articleVariant.findFirst({
      where: { id: input.variantId, organizationId: user.organizationId, deletedAt: null },
    });
    if (!variant) throw new NotFoundError('Item not found');

    const refId = crypto.randomUUID();
    return prisma.$transaction(async (tx) => {
      const result = await applyStockMovement(tx, {
        organizationId: user.organizationId,
        locationId: location.id,
        variantId: input.variantId,
        qty: input.qty,
        unitCost: input.unitCost,
        movementType: 'OPENING',
        referenceType: 'OPENING',
        referenceId: refId,
        notes: input.notes?.trim() || 'Starting stock',
        userId: user.id,
        affectsAverageCost: true,
      });
      return { refId, ...result };
    });
  },

  async adjust(user: SessionUser, input: StockAdjustmentInput) {
    const location = await orgContextRepository.defaultLocation(user.organizationId);
    if (!location) throw new BusinessRuleError('No default location configured');

    const variant = await prisma.articleVariant.findFirst({
      where: { id: input.variantId, organizationId: user.organizationId, deletedAt: null },
    });
    if (!variant) throw new NotFoundError('Item not found');

    const map = {
      IN: { movementType: 'ADJUSTMENT_IN' as const, affectsAverageCost: true },
      OUT: { movementType: 'ADJUSTMENT_OUT' as const, affectsAverageCost: false },
      DAMAGE: { movementType: 'DAMAGE' as const, affectsAverageCost: false },
      LOST: { movementType: 'LOST' as const, affectsAverageCost: false },
    }[input.direction];

    const balance = await inventoryBalanceRepository.find(
      prisma,
      location.id,
      input.variantId,
    );
    const unitCost =
      input.unitCost != null && input.unitCost > 0
        ? input.unitCost
        : Number(balance?.avgUnitCost ?? 0);

    const refId = crypto.randomUUID();
    return prisma.$transaction(async (tx) => {
      return applyStockMovement(tx, {
        organizationId: user.organizationId,
        locationId: location.id,
        variantId: input.variantId,
        qty: input.qty,
        unitCost,
        movementType: map.movementType,
        referenceType: 'ADJUSTMENT',
        referenceId: refId,
        notes: input.reason,
        userId: user.id,
        affectsAverageCost: map.affectsAverageCost && input.direction === 'IN',
      });
    });
  },
};
