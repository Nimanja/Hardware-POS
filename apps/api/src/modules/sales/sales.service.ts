import { Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { Sale } from '@hardware-pos/database';
import type { Paginated } from '@hardware-pos/shared';

import { paginate } from '../../common/pagination';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { SaleWithRelations, SalesRepository } from './sales.repository';

@Injectable()
export class SalesService {
  constructor(private readonly salesRepository: SalesRepository) {}

  async list(tenantId: string, query: QuerySalesDto): Promise<Paginated<Sale>> {
    const [items, total] = await this.salesRepository.findManyByTenant(
      tenantId,
      query.syncStatus,
      query.skip,
      query.take,
    );
    return paginate(items, total, query.page, query.pageSize);
  }

  async getById(tenantId: string, id: string): Promise<SaleWithRelations> {
    const sale = await this.salesRepository.findByIdForTenant(tenantId, id);
    if (!sale) {
      throw new NotFoundException(`Sale ${id} not found`);
    }
    return sale;
  }

  /**
   * Create and complete a sale.
   *
   * TODO: compute totals and product-wise discounts, enforce manager approval
   * for high discounts, derive the transaction type (fully paid -> Sales
   * Receipt; partial/credit -> Invoice + Payment), persist the sale + items +
   * payments in one transaction, and enqueue a QuickBooks sync job.
   */
  create(_tenantId: string, _dto: CreateSaleDto): Promise<SaleWithRelations> {
    throw new NotImplementedException('Sale creation is not implemented yet');
  }
}
