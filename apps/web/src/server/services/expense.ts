import {
  expenseRepository,
  expenseCategoryRepository,
  orgContextRepository,
  canManageExpenses,
  type SessionUser,
} from '@shelfledger/db';
import { ForbiddenError, NotFoundError, ValidationError } from '@shelfledger/errors';
import type { ExpenseCreateInput } from '@shelfledger/validators';

function emptyToNull(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function assertExpenseWrite(user: SessionUser) {
  if (!canManageExpenses(user.role)) {
    throw new ForbiddenError('You cannot manage expenses');
  }
}

export const expenseService = {
  listCategories(user: SessionUser) {
    return expenseCategoryRepository.list(user.organizationId);
  },

  list(user: SessionUser, opts?: { from?: Date; to?: Date }) {
    return expenseRepository.list(user.organizationId, opts);
  },

  async createCategory(user: SessionUser, name: string) {
    assertExpenseWrite(user);
    return expenseCategoryRepository.create({
      name: name.trim(),
      createdBy: user.id,
      updatedBy: user.id,
      organization: { connect: { id: user.organizationId } },
    });
  },

  async create(user: SessionUser, input: ExpenseCreateInput) {
    assertExpenseWrite(user);
    const location = await orgContextRepository.defaultLocation(user.organizationId);
    if (!location) throw new ValidationError('No default location/branch configured');

    const categories = await expenseCategoryRepository.list(user.organizationId);
    if (!categories.some((c) => c.id === input.categoryId)) {
      throw new NotFoundError('Expense category not found');
    }

    const expenseDate = new Date(`${input.expenseDate}T00:00:00.000Z`);
    if (Number.isNaN(expenseDate.getTime())) {
      throw new ValidationError('Invalid expense date');
    }

    return expenseRepository.create({
      amount: input.amount,
      expenseDate,
      paymentMethod: input.paymentMethod,
      notes: emptyToNull(input.notes),
      createdBy: user.id,
      updatedBy: user.id,
      organization: { connect: { id: user.organizationId } },
      branch: { connect: { id: location.branchId } },
      category: { connect: { id: input.categoryId } },
    });
  },

  async softDelete(user: SessionUser, id: string) {
    assertExpenseWrite(user);
    const existing = await expenseRepository.findById(user.organizationId, id);
    if (!existing) throw new NotFoundError('Expense not found');
    return expenseRepository.softDelete(id, user.id);
  },
};
