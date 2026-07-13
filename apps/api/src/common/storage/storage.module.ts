import { Global, Module } from '@nestjs/common';

import { StorageService } from './storage.service';

/** Provides the file storage abstraction app-wide. */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
