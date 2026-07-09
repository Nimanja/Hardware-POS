import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@hardware-pos/database';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    tenantId: string,
    search: string | undefined,
    skip: number,
    take: number,
  ): Promise<[Product[], number]> {
    const where: Prisma.ProductWhereInput = {
      tenantId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { barcode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      this.prisma.product.count({ where }),
    ]);
  }

  findByIdForTenant(tenantId: string, id: string): Promise<Product | null> {
    return this.prisma.product.findFirst({ where: { id, tenantId } });
  }

  findByBarcode(tenantId: string, barcode: string): Promise<Product | null> {
    return this.prisma.product.findFirst({ where: { tenantId, barcode } });
  }
}
