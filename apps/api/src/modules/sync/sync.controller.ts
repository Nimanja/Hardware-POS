import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { SyncLog } from '@hardware-pos/database';
import type { Paginated } from '@hardware-pos/shared';

import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { QuerySyncLogsDto } from './dto/query-sync-logs.dto';
import { RefreshResult, RetryResult } from './sync.interfaces';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('logs')
  listLogs(
    @TenantId() tenantId: string,
    @Query() query: QuerySyncLogsDto,
  ): Promise<Paginated<SyncLog>> {
    return this.syncService.listLogs(tenantId, query);
  }

  @Post('sales/:id/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  retrySale(@TenantId() tenantId: string, @Param('id') id: string): Promise<RetryResult> {
    return this.syncService.retrySale(tenantId, id);
  }

  @Post('products/refresh')
  @HttpCode(HttpStatus.ACCEPTED)
  refreshProducts(@TenantId() tenantId: string): Promise<RefreshResult> {
    return this.syncService.refreshProducts(tenantId);
  }
}
