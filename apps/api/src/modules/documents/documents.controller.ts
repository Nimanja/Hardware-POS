import { Controller, Get, Param } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { Permission } from '../auth/permissions';
import { AuditLogService } from '../audit-log/audit-log.service';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documents: DocumentsService,
    private readonly audit: AuditLogService,
  ) {}

  /** A4 final bill / invoice HTML for a completed sale (print or Save-as-PDF). */
  @Get('sales/:saleId')
  @RequirePermissions(Permission.SALE_READ)
  async saleBill(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('saleId') saleId: string,
  ): Promise<{ html: string; format: 'A4' }> {
    const html = await this.documents.saleHtml(tenantId, saleId);
    await this.audit.record(tenantId, {
      userId: user.id,
      action: 'bill.printed',
      entityType: 'Sale',
      entityId: saleId,
      metadata: { format: 'A4' },
    });
    return { html, format: 'A4' };
  }

  /** A4 return / refund note HTML for a completed return. */
  @Get('returns/:returnId')
  @RequirePermissions(Permission.RETURN_READ)
  async returnNote(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('returnId') returnId: string,
  ): Promise<{ html: string; format: 'A4' }> {
    const html = await this.documents.returnHtml(tenantId, returnId);
    await this.audit.record(tenantId, {
      userId: user.id,
      action: 'return.document_printed',
      entityType: 'Return',
      entityId: returnId,
      metadata: { format: 'A4' },
    });
    return { html, format: 'A4' };
  }
}
