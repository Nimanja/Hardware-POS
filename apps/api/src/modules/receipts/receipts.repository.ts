import { Injectable } from '@nestjs/common';
import { Receipt } from '@hardware-pos/database';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReceiptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySale(tenantId: string, saleId: string): Promise<Receipt | null> {
    return this.prisma.receipt.findFirst({ where: { saleId, sale: { tenantId } } });
  }

  findByIdForTenant(tenantId: string, id: string): Promise<Receipt | null> {
    return this.prisma.receipt.findFirst({ where: { id, sale: { tenantId } } });
  }
}
