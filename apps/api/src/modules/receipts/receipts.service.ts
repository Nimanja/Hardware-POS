import { Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { Receipt } from '@hardware-pos/database';

import { ReceiptsRepository } from './receipts.repository';

@Injectable()
export class ReceiptsService {
  constructor(private readonly receiptsRepository: ReceiptsRepository) {}

  async getBySale(tenantId: string, saleId: string): Promise<Receipt> {
    const receipt = await this.receiptsRepository.findBySale(tenantId, saleId);
    if (!receipt) {
      throw new NotFoundException(`No receipt for sale ${saleId}`);
    }
    return receipt;
  }

  async getById(tenantId: string, id: string): Promise<Receipt> {
    const receipt = await this.receiptsRepository.findByIdForTenant(tenantId, id);
    if (!receipt) {
      throw new NotFoundException(`Receipt ${id} not found`);
    }
    return receipt;
  }

  /** TODO: increment printCount, stamp printedAt, and return the render payload. */
  reprint(_tenantId: string, _id: string): Promise<Receipt> {
    throw new NotImplementedException('Receipt reprint is not implemented yet');
  }
}
