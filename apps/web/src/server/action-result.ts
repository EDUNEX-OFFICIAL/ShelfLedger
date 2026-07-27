import { isAppError } from '@shelfledger/errors';

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: unknown): ActionResult<never> {
  if (isAppError(error)) {
    return { ok: false, error: error.message, code: error.code };
  }
  if (error instanceof Error) {
    // Prisma unique violations
    if ('code' in error && (error as { code?: string }).code === 'P2002') {
      return { ok: false, error: 'A record with the same unique value already exists', code: 'CONFLICT' };
    }
    console.error(error);
    return { ok: false, error: 'Something went wrong' };
  }
  return { ok: false, error: 'Something went wrong' };
}
