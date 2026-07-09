import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Payment } from '@hardware-pos/database';

import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  listBySale(
    @TenantId() tenantId: string,
    @Query('saleId') saleId: string,
  ): Promise<Payment[]> {
    return this.paymentsService.listBySale(tenantId, saleId);
  }

  @Get(':id')
  getById(@TenantId() tenantId: string, @Param('id') id: string): Promise<Payment> {
    return this.paymentsService.getById(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreatePaymentDto): Promise<Payment> {
    return this.paymentsService.create(tenantId, dto);
  }
}
