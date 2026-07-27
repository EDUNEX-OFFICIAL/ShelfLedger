'use server';

import { revalidatePath } from 'next/cache';
import {
  brandCreateSchema,
  brandUpdateSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  vendorCreateSchema,
  vendorUpdateSchema,
  articleCreateSchema,
  articleUpdateSchema,
} from '@shelfledger/validators';
import { requireMasterWrite, requireSession } from '@/server/auth/guards';
import { masterService } from '@/server/services/masters';
import { fail, ok, type ActionResult } from '@/server/action-result';

export async function createBrandAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireMasterWrite();
    const data = brandCreateSchema.parse(input);
    const brand = await masterService.createBrand(user, data);
    revalidatePath('/brands');
    revalidatePath('/dashboard');
    return ok({ id: brand.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateBrandAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireMasterWrite();
    const data = brandUpdateSchema.parse(input);
    const brand = await masterService.updateBrand(user, id, data);
    revalidatePath('/brands');
    return ok({ id: brand.id });
  } catch (error) {
    return fail(error);
  }
}

export async function deleteBrandAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireMasterWrite();
    await masterService.deleteBrand(user, id);
    revalidatePath('/brands');
    revalidatePath('/dashboard');
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function createCategoryAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireMasterWrite();
    const data = categoryCreateSchema.parse(input);
    const category = await masterService.createCategory(user, data);
    revalidatePath('/categories');
    revalidatePath('/dashboard');
    return ok({ id: category.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateCategoryAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireMasterWrite();
    const data = categoryUpdateSchema.parse(input);
    const category = await masterService.updateCategory(user, id, data);
    revalidatePath('/categories');
    return ok({ id: category.id });
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireMasterWrite();
    await masterService.deleteCategory(user, id);
    revalidatePath('/categories');
    revalidatePath('/dashboard');
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function createVendorAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireMasterWrite();
    const data = vendorCreateSchema.parse(input);
    const vendor = await masterService.createVendor(user, data);
    revalidatePath('/vendors');
    revalidatePath('/dashboard');
    return ok({ id: vendor.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateVendorAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireMasterWrite();
    const data = vendorUpdateSchema.parse(input);
    const vendor = await masterService.updateVendor(user, id, data);
    revalidatePath('/vendors');
    return ok({ id: vendor.id });
  } catch (error) {
    return fail(error);
  }
}

export async function deleteVendorAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireMasterWrite();
    await masterService.deleteVendor(user, id);
    revalidatePath('/vendors');
    revalidatePath('/dashboard');
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function createArticleAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireMasterWrite();
    const data = articleCreateSchema.parse(input);
    const article = await masterService.createArticle(user, data);
    revalidatePath('/articles');
    revalidatePath('/dashboard');
    return ok({ id: article.id });
  } catch (error) {
    return fail(error);
  }
}

export async function updateArticleAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireMasterWrite();
    const data = articleUpdateSchema.parse(input);
    const article = await masterService.updateArticle(user, id, data);
    revalidatePath('/articles');
    revalidatePath(`/articles/${id}`);
    return ok({ id: article.id });
  } catch (error) {
    return fail(error);
  }
}

export async function deleteArticleAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireMasterWrite();
    await masterService.deleteArticle(user, id);
    revalidatePath('/articles');
    revalidatePath('/dashboard');
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

export async function getDashboardCountsAction() {
  const user = await requireSession();
  return masterService.dashboard(user);
}
