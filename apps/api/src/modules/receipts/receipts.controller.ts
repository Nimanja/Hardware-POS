import { Controller, Get, Param, Post } from '@nestjs/common';
import { Receipt } from '@hardware-pos/database';

import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { ReceiptsService } from './receipts.service';

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get('sale/:saleId')
  getBySale(@TenantId() tenantId: string, @Param('saleId') saleId: string): Promise<Receipt> {
    return this.receiptsService.getBySale(tenantId, saleId);
  }

  @Get(':id')
  getById(@TenantId() tenantId: string, @Param('id') id: string): Promise<Receipt> {
    return this.receiptsService.getById(tenantId, id);
  }

  @Post(':id/reprint')
  reprint(@TenantId() tenantId: string, @Param('id') id: string): Promise<Receipt> {
    return this.receiptsService.reprint(tenantId, id);
  }
}
