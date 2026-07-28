'use server';

import { revalidatePath } from 'next/cache';
import {
  customerCreateSchema,
  saleCreateSchema,
  quickSaleSchema,
  exchangeCreateSchema,
} from '@shelfledger/validators';
import { requireCustomerWrite, requireSell, requireSession, requireMasterWrite } from '@/server/auth/guards';
import { customerService } from '@/server/services/customer';
import { saleService } from '@/server/services/sale';
import { exchangeService } from '@/server/services/exchange';
import { fail, ok, type ActionResult } from '@/server/action-result';

export async function createCustomerAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireCustomerWrite();
    const data = customerCreateSchema.parse(input);
    const customer = await customerService.create(user, data);
    revalidatePath('/customers');
    revalidatePath('/sales');
    return ok({ id: customer.id });
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCustomerAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireMasterWrite();
    await customerService.softDelete(user, id);
    revalidatePath('/customers');
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function createSaleAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireSell();
    const data = saleCreateSchema.parse(input);
    const sale = await saleService.createDraft(user, data);
    revalidatePath('/sales');
    return ok({ id: sale.id });
  } catch (error) {
    return fail(error);
  }
}

export async function postSaleAction(id: string): Promise<ActionResult<{ id: string; invoiceNo: string }>> {
  try {
    const user = await requireSell();
    const sale = await saleService.post(user, id);
    revalidatePath('/sales');
    revalidatePath('/sales/quick');
    revalidatePath(`/sales/${sale.id}/invoice`);
    revalidatePath('/inventory');
    revalidatePath('/stock-ledger');
    revalidatePath('/dashboard');
    revalidatePath('/exchanges');
    return ok({ id: sale.id, invoiceNo: sale.invoiceNo });
  } catch (error) {
    return fail(error);
  }
}

export async function createAndPostSaleAction(
  input: unknown,
): Promise<ActionResult<{ id: string; invoiceNo: string }>> {
  try {
    const user = await requireSell();
    const data = saleCreateSchema.parse(input);
    const sale = await saleService.createAndPost(user, data);
    revalidatePath('/sales');
    revalidatePath('/sales/quick');
    revalidatePath(`/sales/${sale.id}/invoice`);
    revalidatePath('/inventory');
    revalidatePath('/stock-ledger');
    revalidatePath('/dashboard');
    revalidatePath('/exchanges');
    return ok({ id: sale.id, invoiceNo: sale.invoiceNo });
  } catch (error) {
    return fail(error);
  }
}

export async function createAndPostQuickSaleAction(
  input: unknown,
): Promise<ActionResult<{ id: string; invoiceNo: string }>> {
  try {
    const user = await requireSell();
    const data = quickSaleSchema.parse(input);
    const customer = await customerService.findOrCreateForQuickSale(user, {
      name: data.customerName,
      phone: data.customerPhone,
    });
    const sale = await saleService.createAndPost(user, {
      customerId: customer.id,
      invoiceDate: '',
      notes: '',
      billDiscount: 0,
      stockOverride: false,
      overrideReason: '',
      lines: data.lines,
      payments: [{ method: data.payMethod, amount: 1, reference: '' }],
    });
    revalidatePath('/sales');
    revalidatePath('/sales/quick');
    revalidatePath('/customers');
    revalidatePath(`/sales/${sale.id}/invoice`);
    revalidatePath('/inventory');
    revalidatePath('/stock-ledger');
    revalidatePath('/dashboard');
    revalidatePath('/exchanges');
    return ok({ id: sale.id, invoiceNo: sale.invoiceNo });
  } catch (error) {
    return fail(error);
  }
}

export async function createExchangeAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireSell();
    const data = exchangeCreateSchema.parse(input);
    const exchange = await exchangeService.createAndPost(user, data);
    revalidatePath('/exchanges');
    revalidatePath('/sales');
    revalidatePath('/inventory');
    revalidatePath('/stock-ledger');
    return ok({ id: exchange.id });
  } catch (error) {
    return fail(error);
  }
}

export async function listSalesAction() {
  const user = await requireSession();
  return saleService.list(user);
}
