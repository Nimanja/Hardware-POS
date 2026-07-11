import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Customer } from '@hardware-pos/database';
import type { Paginated } from '@hardware-pos/shared';

import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Permission } from '../auth/permissions';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions(Permission.CUSTOMER_READ)
  list(@TenantId() tenantId: string, @Query() query: QueryCustomersDto): Promise<Paginated<Customer>> {
    return this.customersService.list(tenantId, query);
  }

  @Post()
  @RequirePermissions(Permission.CUSTOMER_MANAGE)
  create(@TenantId() tenantId: string, @Body() dto: CreateCustomerDto): Promise<Customer> {
    return this.customersService.create(tenantId, dto);
  }

  @Get(':id')
  @RequirePermissions(Permission.CUSTOMER_READ)
  getById(@TenantId() tenantId: string, @Param('id') id: string): Promise<Customer> {
    return this.customersService.getById(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.CUSTOMER_MANAGE)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customersService.update(tenantId, id, dto);
  }

  @Post(':id/sync-to-quickbooks')
  @RequirePermissions(Permission.QUICKBOOKS_MANAGE)
  syncToQuickBooks(@TenantId() tenantId: string, @Param('id') id: string): Promise<Customer> {
    return this.customersService.syncToQuickBooks(tenantId, id);
  }
}
