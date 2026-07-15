import { Injectable, Logger } from '@nestjs/common';

import { createStorageProvider } from './create-storage-provider';
import type { StorageProvider, UploadedImage } from './storage-provider';

/**
 * Facade the rest of the app injects for file storage. WHERE files live is
 * decided by the provider resolved from `STORAGE_PROVIDER` (local disk by
 * default, S3/LocalStack with 's3') — see create-storage-provider.ts.
 */
@Injectable()
export class StorageService {
  private static readonly logger = new Logger(StorageService.name);
  private readonly provider: StorageProvider;

  constructor() {
    this.provider = createStorageProvider(process.env);
    StorageService.logger.log(`Upload storage provider: ${this.provider.kind}`);
  }

  /** Persist an uploaded image and return its public URL. */
  saveImage(file: UploadedImage): Promise<string> {
    return this.provider.saveImage(file);
  }

  /** Remove a previously stored file by its public URL (no-op if external/missing). */
  remove(url: string | null | undefined): Promise<void> {
    return this.provider.remove(url);
  }
}
