import { Controller, Get, Query } from '@nestjs/common';

import { TenantId } from '../../common/decorators/tenant-id.decorator';
import {
  QuickBooksAuthUrl,
  QuickBooksCallbackResult,
  QuickBooksConnectionStatus,
} from './quickbooks.interfaces';
import { QuickBooksService } from './quickbooks.service';

@Controller('quickbooks')
export class QuickBooksController {
  constructor(private readonly quickBooksService: QuickBooksService) {}

  @Get('status')
  status(@TenantId() tenantId: string): Promise<QuickBooksConnectionStatus> {
    return this.quickBooksService.getConnectionStatus(tenantId);
  }

  @Get('connect')
  connect(@TenantId() tenantId: string): Promise<QuickBooksAuthUrl> {
    return this.quickBooksService.getAuthorizationUrl(tenantId);
  }

  @Get('callback')
  callback(
    @TenantId() tenantId: string,
    @Query('code') code: string,
    @Query('realmId') realmId: string,
  ): Promise<QuickBooksCallbackResult> {
    return this.quickBooksService.handleCallback(tenantId, code, realmId);
  }
}
