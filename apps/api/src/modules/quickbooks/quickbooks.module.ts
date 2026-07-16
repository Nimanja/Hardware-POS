import { Module } from '@nestjs/common';

import { SettingsModule } from '../settings/settings.module';
import { QuickBooksConfig } from './quickbooks.config';
import { QuickBooksController } from './quickbooks.controller';
import { QuickBooksRepository } from './quickbooks.repository';
import { QuickBooksService } from './quickbooks.service';
import { QuickBooksSyncService } from './quickbooks-sync.service';
import { QuickBooksSalesSyncService } from './quickbooks-sales-sync.service';
import { QuickBooksReturnsSyncService } from './quickbooks-returns-sync.service';

@Module({
  imports: [SettingsModule],
  controllers: [QuickBooksController],
  providers: [
    QuickBooksService,
    QuickBooksSyncService,
    QuickBooksSalesSyncService,
    QuickBooksReturnsSyncService,
    QuickBooksRepository,
    QuickBooksConfig,
  ],
  exports: [
    QuickBooksService,
    QuickBooksSyncService,
    QuickBooksSalesSyncService,
    QuickBooksReturnsSyncService,
  ],
})
export class QuickBooksModule {}
