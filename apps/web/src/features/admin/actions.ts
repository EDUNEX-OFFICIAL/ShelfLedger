'use server';

import { revalidatePath } from 'next/cache';
import {
  expenseCreateSchema,
  expenseCategoryCreateSchema,
  staffCreateSchema,
  staffUpdateSchema,
  orgSettingsSchema,
  taxRateCreateSchema,
  sequenceUpdateSchema,
} from '@shelfledger/validators';
import {
  requireExpenseWrite,
  requireStaffAccess,
  requireSettingsWrite,
  requireSession,
} from '@/server/auth/guards';
import { expenseService } from '@/server/services/expense';
import { staffService } from '@/server/services/staff';
import { settingsService } from '@/server/services/settings';
import { fail, ok, type ActionResult } from '@/server/action-result';

export async function createExpenseAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireExpenseWrite();
    const data = expenseCreateSchema.parse(input);
    const expense = await expenseService.create(user, data);
    revalidatePath('/expenses');
    revalidatePath('/reports');
    return ok({ id: expense.id });
  } catch (error) {
    return fail(error);
  }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireExpenseWrite();
    await expenseService.softDelete(user, id);
    revalidatePath('/expenses');
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function createExpenseCategoryAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireExpenseWrite();
    const data = expenseCategoryCreateSchema.parse(input);
    const cat = await expenseService.createCategory(user, data.name);
    revalidatePath('/expenses');
    return ok({ id: cat.id });
  } catch (error) {
    return fail(error);
  }
}

export async function createStaffAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireStaffAccess();
    const data = staffCreateSchema.parse(input);
    const created = await staffService.create(user, data);
    revalidatePath('/staff');
    return ok({ id: created.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateStaffAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireStaffAccess();
    const data = staffUpdateSchema.parse(input);
    const updated = await staffService.update(user, id, data);
    revalidatePath('/staff');
    return ok({ id: updated.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateOrgSettingsAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireSettingsWrite();
    const data = orgSettingsSchema.parse(input);
    await settingsService.updateOrg(user, data);
    revalidatePath('/settings');
    revalidatePath('/login');
    revalidatePath('/', 'layout');
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function updateSequenceAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireSettingsWrite();
    const data = sequenceUpdateSchema.parse(input);
    await settingsService.updateSequencePrefix(user, data);
    revalidatePath('/settings');
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function createTaxRateAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireSettingsWrite();
    const data = taxRateCreateSchema.parse(input);
    const rate = await settingsService.createTaxRate(user, data);
    revalidatePath('/settings');
    revalidatePath('/sales');
    revalidatePath('/articles');
    return ok({ id: rate.id });
  } catch (error) {
    return fail(error);
  }
}

export async function deleteTaxRateAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireSettingsWrite();
    await settingsService.softDeleteTaxRate(user, id);
    revalidatePath('/settings');
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function listStaffAction() {
  const user = await requireSession();
  return staffService.list(user);
}
