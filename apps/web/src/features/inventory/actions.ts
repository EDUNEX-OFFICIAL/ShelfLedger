'use server';

import { revalidatePath } from 'next/cache';
import {
  purchaseCreateSchema,
  purchaseReturnSchema,
  openingStockSchema,
  stockAdjustmentSchema,
} from '@shelfledger/validators';
import { requireInventoryWrite, requireSession } from '@/server/auth/guards';
import { purchaseService } from '@/server/services/purchase';
import { inventoryService } from '@/server/services/inventory';
import { fail, ok, type ActionResult } from '@/server/action-result';

export async function createPurchaseAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireInventoryWrite();
    const data = purchaseCreateSchema.parse(input);
    const purchase = await purchaseService.createDraft(user, data);
    revalidatePath('/purchases');
    return ok({ id: purchase.id });
  } catch (error) {
    return fail(error);
  }
}

export async function postPurchaseAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireInventoryWrite();
    const purchase = await purchaseService.post(user, id);
    revalidatePath('/purchases');
    revalidatePath('/inventory');
    revalidatePath('/stock-ledger');
    revalidatePath('/dashboard');
    return ok({ id: purchase.id });
  } catch (error) {
    return fail(error);
  }
}

export async function postPurchaseReturnAction(
  input: unknown,
): Promise<ActionResult<{ returnId: string }>> {
  try {
    const user = await requireInventoryWrite();
    const data = purchaseReturnSchema.parse(input);
    const result = await purchaseService.postReturn(user, data);
    revalidatePath('/purchases');
    revalidatePath('/inventory');
    revalidatePath('/stock-ledger');
    return ok({ returnId: result.returnId });
  } catch (error) {
    return fail(error);
  }
}

export async function openingStockAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireInventoryWrite();
    const data = openingStockSchema.parse(input);
    await inventoryService.openingStock(user, data);
    revalidatePath('/inventory');
    revalidatePath('/stock-ledger');
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function stockAdjustmentAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireInventoryWrite();
    const data = stockAdjustmentSchema.parse(input);
    await inventoryService.adjust(user, data);
    revalidatePath('/inventory');
    revalidatePath('/stock-ledger');
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function listPurchasesAction() {
  const user = await requireSession();
  return purchaseService.list(user);
}
