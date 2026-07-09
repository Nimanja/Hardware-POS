import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@hardware-pos/database';

import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Permission } from '../auth/permissions';
import {
  QuickBooksAuthUrl,
  QuickBooksCallbackResult,
  QuickBooksConnectionStatus,
} from './quickbooks.interfaces';
import { QuickBooksService } from './quickbooks.service';

@Controller('quickbooks')
export class QuickBooksController {
  constructor(private readonly quickBooksService: QuickBooksService) {}

  /** Connection status — accountants and owners/admins can view. */
  @Get('status')
  @RequirePermissions(Permission.QUICKBOOKS_READ)
  status(@TenantId() tenantId: string): Promise<QuickBooksConnectionStatus> {
    return this.quickBooksService.getConnectionStatus(tenantId);
  }

  /** Start the OAuth connect flow — owner/admin only. */
  @Get('connect')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  connect(@TenantId() tenantId: string): Promise<QuickBooksAuthUrl> {
    return this.quickBooksService.getAuthorizationUrl(tenantId);
  }

  /** OAuth redirect target from QuickBooks — public (no session on the redirect). */
  @Public()
  @Get('callback')
  callback(
    @Query('state') tenantId: string,
    @Query('code') code: string,
    @Query('realmId') realmId: string,
  ): Promise<QuickBooksCallbackResult> {
    return this.quickBooksService.handleCallback(tenantId, code, realmId);
  }
}
