import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Sale } from '@hardware-pos/database';
import type { Paginated } from '@hardware-pos/shared';

import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Permission } from '../auth/permissions';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { SaleWithRelations } from './sales.repository';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @RequirePermissions(Permission.SALE_READ)
  list(@TenantId() tenantId: string, @Query() query: QuerySalesDto): Promise<Paginated<Sale>> {
    return this.salesService.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.SALE_READ)
  getById(@TenantId() tenantId: string, @Param('id') id: string): Promise<SaleWithRelations> {
    return this.salesService.getById(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permission.SALE_CREATE)
  create(@TenantId() tenantId: string, @Body() dto: CreateSaleDto): Promise<SaleWithRelations> {
    return this.salesService.create(tenantId, dto);
  }
}
