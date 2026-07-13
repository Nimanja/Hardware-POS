import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Customer, Prisma } from '@hardware-pos/database';
import type { Paginated } from '@hardware-pos/shared';

import { paginate } from '../../common/pagination';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async list(tenantId: string, query: QueryCustomersDto): Promise<Paginated<Customer>> {
    const [items, total] = await this.customersRepository.search(
      tenantId,
      {
        search: query.search,
        customerType: query.customerType,
        isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
      },
      query.skip,
      query.take,
    );
    return paginate(items, total, query.page, query.pageSize);
  }

  async getById(tenantId: string, id: string): Promise<Customer> {
    const customer = await this.customersRepository.findByIdForTenant(tenantId, id);
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return customer;
  }

  /** Create a locally-managed customer (not yet in QuickBooks → NOT_SYNCED). */
  create(tenantId: string, dto: CreateCustomerDto): Promise<Customer> {
    const data: Prisma.CustomerUncheckedCreateInput = {
      tenantId,
      name: dto.name,
      companyName: dto.companyName ?? null,
      customerType: dto.customerType ?? 'RETAIL',
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      billingAddress: dto.billingAddress ?? null,
      taxNumber: dto.taxNumber ?? null,
      creditAllowed: dto.creditAllowed ?? false,
      creditLimit: dto.creditLimit ?? null,
      notes: dto.notes ?? null,
      isActive: dto.isActive ?? true,
      syncStatus: 'NOT_SYNCED',
    };
    return this.customersRepository.create(tenantId, data);
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto): Promise<Customer> {
    await this.getById(tenantId, id);
    // Prisma treats `undefined` as "leave unchanged"; column names match the DTO.
    const data: Prisma.CustomerUncheckedUpdateInput = {
      name: dto.name,
      companyName: dto.companyName,
      customerType: dto.customerType,
      email: dto.email,
      phone: dto.phone,
      billingAddress: dto.billingAddress,
      taxNumber: dto.taxNumber,
      creditAllowed: dto.creditAllowed,
      creditLimit: dto.creditLimit,
      notes: dto.notes,
      isActive: dto.isActive,
    };
    return this.customersRepository.update(id, data);
  }

  /** Queue a customer for QuickBooks (stub — real QBO customer writes come later). */
  async syncToQuickBooks(tenantId: string, id: string): Promise<Customer> {
    const customer = await this.getById(tenantId, id);
    if (customer.quickbooksCustomerId) {
      throw new BadRequestException('Customer is already linked to QuickBooks');
    }
    return this.customersRepository.queueQuickBooksSync(tenantId, id);
  }
}
