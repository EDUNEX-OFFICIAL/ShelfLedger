import {
  reportRepository,
  canViewReports,
  type SessionUser,
} from '@shelfledger/db';
import { ForbiddenError, ValidationError } from '@shelfledger/errors';
import type { ReportDateRangeInput } from '@shelfledger/validators';

function assertReports(user: SessionUser) {
  if (!canViewReports(user.role)) {
    throw new ForbiddenError('You cannot view reports');
  }
}

function assertRange(input: ReportDateRangeInput) {
  if (input.from > input.to) {
    throw new ValidationError('From date must be on or before to date');
  }
}

export const reportService = {
  sales(user: SessionUser, range: ReportDateRangeInput) {
    assertReports(user);
    assertRange(range);
    return reportRepository.salesSummary(user.organizationId, range.from, range.to);
  },

  gst(user: SessionUser, range: ReportDateRangeInput) {
    assertReports(user);
    assertRange(range);
    return reportRepository.gstSummary(user.organizationId, range.from, range.to);
  },

  purchases(user: SessionUser, range: ReportDateRangeInput) {
    assertReports(user);
    assertRange(range);
    return reportRepository.purchaseSummary(user.organizationId, range.from, range.to);
  },

  stockValuation(user: SessionUser) {
    assertReports(user);
    return reportRepository.stockValuation(user.organizationId);
  },

  lowStock(user: SessionUser) {
    assertReports(user);
    return reportRepository.lowStock(user.organizationId);
  },

  expenses(user: SessionUser, range: ReportDateRangeInput) {
    assertReports(user);
    assertRange(range);
    return reportRepository.expenseSummary(user.organizationId, range.from, range.to);
  },

  salesTrend(user: SessionUser, range: ReportDateRangeInput) {
    assertReports(user);
    assertRange(range);
    return reportRepository.salesTrend(user.organizationId, range.from, range.to);
  },
};
