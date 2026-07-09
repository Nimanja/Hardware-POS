import { Injectable, NotImplementedException } from '@nestjs/common';
import { SyncLog } from '@hardware-pos/database';
import type { Paginated } from '@hardware-pos/shared';

import { paginate } from '../../common/pagination';
import { QuerySyncLogsDto } from './dto/query-sync-logs.dto';
import { RefreshResult, RetryResult } from './sync.interfaces';
import { SyncRepository } from './sync.repository';

@Injectable()
export class SyncService {
  constructor(private readonly syncRepository: SyncRepository) {}

  async listLogs(tenantId: string, query: QuerySyncLogsDto): Promise<Paginated<SyncLog>> {
    const [items, total] = await this.syncRepository.findLogs(
      tenantId,
      { entityType: query.entityType, status: query.status },
      query.skip,
      query.take,
    );
    return paginate(items, total, query.page, query.pageSize);
  }

  /** TODO: reset the sale's sync job to PENDING and re-enqueue it. */
  retrySale(_tenantId: string, _saleId: string): Promise<RetryResult> {
    throw new NotImplementedException('Sync retry is not implemented yet');
  }

  /** TODO: enqueue an inbound catalog pull from QuickBooks. */
  refreshProducts(_tenantId: string): Promise<RefreshResult> {
    throw new NotImplementedException('Product refresh is not implemented yet');
  }
}
