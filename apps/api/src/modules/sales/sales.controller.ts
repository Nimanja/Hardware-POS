import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Sale } from '@hardware-pos/database';
import type { Paginated } from '@hardware-pos/shared';

import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { SaleWithRelations } from './sales.repository';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  list(@TenantId() tenantId: string, @Query() query: QuerySalesDto): Promise<Paginated<Sale>> {
    return this.salesService.list(tenantId, query);
  }

  @Get(':id')
  getById(@TenantId() tenantId: string, @Param('id') id: string): Promise<SaleWithRelations> {
    return this.salesService.getById(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateSaleDto): Promise<SaleWithRelations> {
    return this.salesService.create(tenantId, dto);
  }
}
