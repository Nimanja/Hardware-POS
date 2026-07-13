import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import type { Paginated } from '@hardware-pos/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { Permission } from '../auth/permissions';
import { CreateDraftDto } from './dto/create-draft.dto';
import { CompleteSaleDto } from './dto/complete-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { SaleWithRelations } from './sales.repository';
import { SalesService } from './sales.service';
import { SaleListItem } from './sales.types';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('draft')
  @RequirePermissions(Permission.SALE_CREATE)
  createDraft(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDraftDto,
  ): Promise<SaleWithRelations> {
    return this.salesService.createDraft(tenantId, user, dto);
  }

  @Post('complete')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.SALE_CREATE)
  complete(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteSaleDto,
  ): Promise<SaleWithRelations> {
    return this.salesService.complete(tenantId, user, dto);
  }

  @Get()
  @RequirePermissions(Permission.SALE_READ)
  list(
    @TenantId() tenantId: string,
    @Query() query: QuerySalesDto,
  ): Promise<Paginated<SaleListItem>> {
    return this.salesService.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.SALE_READ)
  getById(@TenantId() tenantId: string, @Param('id') id: string): Promise<SaleWithRelations> {
    return this.salesService.getById(tenantId, id);
  }

  @Post(':id/sync')
  @RequirePermissions(Permission.SALE_CREATE)
  sync(@TenantId() tenantId: string, @Param('id') id: string): Promise<SaleWithRelations> {
    return this.salesService.syncToQuickBooks(tenantId, id);
  }

  /** Alias of `/sync` — retry a failed/pending QuickBooks push from the Sales UI. */
  @Post(':id/retry-sync')
  @RequirePermissions(Permission.SALE_CREATE)
  retrySync(@TenantId() tenantId: string, @Param('id') id: string): Promise<SaleWithRelations> {
    return this.salesService.syncToQuickBooks(tenantId, id);
  }
}
