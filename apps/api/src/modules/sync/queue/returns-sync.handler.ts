import { Injectable } from '@nestjs/common';

import { QuickBooksReturnsSyncService } from '../../quickbooks/quickbooks-returns-sync.service';
import { SyncJobContext, SyncJobHandler, SyncJobOutcome } from './sync-job-handler';
import { SyncJobType } from './sync-queue.constants';

/**
 * Handles RETURN_SYNC jobs by pushing the return to QuickBooks (Refund Receipt /
 * Credit Memo). Pure domain work — reports success/failure and lets the queue own
 * the job lifecycle, so it works unchanged behind a BullMQ worker.
 */
@Injectable()
export class ReturnsSyncHandler implements SyncJobHandler {
  readonly type = SyncJobType.RETURN_SYNC;

  constructor(private readonly returnsSync: QuickBooksReturnsSyncService) {}

  async handle(job: SyncJobContext): Promise<SyncJobOutcome> {
    if (!job.entityId) {
      return { success: false, message: 'Sync job has no return id' };
    }
    const result = await this.returnsSync.syncReturn(job.tenantId, job.entityId);
    return { success: result.status === 'SYNCED', message: result.message };
  }
}
