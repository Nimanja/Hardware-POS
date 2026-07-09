import { Injectable } from '@nestjs/common';
import { Prisma, Sale, SyncStatus } from '@hardware-pos/database';

import { PrismaService } from '../../prisma/prisma.service';

export type SaleWithRelations = Prisma.SaleGetPayload<{
  include: { items: true; payments: true; customer: true };
}>;

@Injectable()
export class SalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByTenant(
    tenantId: string,
    syncStatus: SyncStatus | undefined,
    skip: number,
    take: number,
  ): Promise<[Sale[], number]> {
    const where: Prisma.SaleWhereInput = { tenantId, ...(syncStatus ? { syncStatus } : {}) };

    return this.prisma.$transaction([
      this.prisma.sale.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.sale.count({ where }),
    ]);
  }

  findByIdForTenant(tenantId: string, id: string): Promise<SaleWithRelations | null> {
    return this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: { items: true, payments: true, customer: true },
    });
  }
}
