import { Module } from '@nestjs/common';

import { QuickBooksConfig } from './quickbooks.config';
import { QuickBooksController } from './quickbooks.controller';
import { QuickBooksRepository } from './quickbooks.repository';
import { QuickBooksService } from './quickbooks.service';

@Module({
  controllers: [QuickBooksController],
  providers: [QuickBooksService, QuickBooksRepository, QuickBooksConfig],
  exports: [QuickBooksService],
})
export class QuickBooksModule {}
