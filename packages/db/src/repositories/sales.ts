import { prisma } from '../client';
import type { DocumentType, Prisma } from '@prisma/client';
import type { TxClient } from './inventory';

const active = { deletedAt: null } as const;

export const customerRepository = {
  list(organizationId: string) {
    return prisma.customer.findMany({
      where: { organizationId, ...active },
      orderBy: [{ isWalkIn: 'desc' }, { name: 'asc' }],
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.customer.findFirst({
      where: { id, organizationId, ...active },
    });
  },

  findWalkIn(organizationId: string) {
    return prisma.customer.findFirst({
      where: { organizationId, isWalkIn: true, ...active },
    });
  },

  findByPhone(organizationId: string, phone: string) {
    return prisma.customer.findFirst({
      where: { organizationId, phone, ...active },
    });
  },

  create(data: Prisma.CustomerCreateInput) {
    return prisma.customer.create({ data });
  },

  update(id: string, data: Prisma.CustomerUpdateInput) {
    return prisma.customer.update({ where: { id }, data });
  },

  softDelete(id: string, updatedBy: string) {
    return prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    });
  },
};

export const saleRepository = {
  list(organizationId: string) {
    return prisma.sale.findMany({
      where: { organizationId, ...active },
      include: {
        customer: true,
        lines: { where: active, include: { variant: { include: { article: true } } } },
        payments: { where: active },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.sale.findFirst({
      where: { id, organizationId, ...active },
      include: {
        customer: true,
        organization: true,
        branch: true,
        location: true,
        lines: {
          where: active,
          include: { variant: { include: { article: { include: { brand: true } } } }, taxRate: true },
        },
        payments: { where: active },
      },
    });
  },

  create(data: Prisma.SaleCreateInput) {
    return prisma.sale.create({
      data,
      include: { lines: true, payments: true, customer: true },
    });
  },
};

export const exchangeRepository = {
  list(organizationId: string) {
    return prisma.exchange.findMany({
      where: { organizationId, ...active },
      include: {
        customer: true,
        originalSale: true,
        lines: { where: active, include: { variant: { include: { article: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.exchange.findFirst({
      where: { id, organizationId, ...active },
      include: {
        customer: true,
        originalSale: true,
        lines: {
          where: active,
          include: { variant: { include: { article: true } }, taxRate: true, originalSaleLine: true },
        },
      },
    });
  },

  create(tx: TxClient, data: Prisma.ExchangeCreateInput) {
    return tx.exchange.create({
      data,
      include: { lines: true, customer: true },
    });
  },
};

export const documentSequenceRepository = {
  async allocateInvoiceNo(
    tx: TxClient,
    opts: {
      organizationId: string;
      branchId: string;
      docType: DocumentType;
      fyLabel: string;
      prefixFallback?: string;
      userId: string;
    },
  ): Promise<string> {
    let seq = await tx.documentSequence.findUnique({
      where: {
        organizationId_branchId_docType_fyLabel: {
          organizationId: opts.organizationId,
          branchId: opts.branchId,
          docType: opts.docType,
          fyLabel: opts.fyLabel,
        },
      },
    });

    if (!seq) {
      seq = await tx.documentSequence.create({
        data: {
          organizationId: opts.organizationId,
          branchId: opts.branchId,
          docType: opts.docType,
          fyLabel: opts.fyLabel,
          prefix: opts.prefixFallback ?? 'INV',
          nextNumber: 1,
          createdBy: opts.userId,
          updatedBy: opts.userId,
        },
      });
    }

    const updated = await tx.documentSequence.update({
      where: { id: seq.id },
      data: {
        nextNumber: { increment: 1 },
        updatedBy: opts.userId,
      },
    });

    const number = updated.nextNumber - 1;
    const prefix = seq.prefix || 'INV';
    return `${prefix}-${opts.fyLabel}-${String(number).padStart(4, '0')}`;
  },
};
