import { randomUUID } from 'crypto';
import { unlink, writeFile } from 'fs/promises';
import { basename, join } from 'path';

import { BadRequestException } from '@nestjs/common';

import { IMAGE_EXT, StorageProvider, UploadedImage } from './storage-provider';
import { getUploadDir, UPLOAD_URL_PREFIX } from './storage.util';

/** Local filesystem storage: files under `<cwd>/uploads`, served at `/uploads/<file>`. */
export class LocalDiskStorageProvider implements StorageProvider {
  readonly kind = 'local' as const;
  private readonly dir = getUploadDir();

  async saveImage(file: UploadedImage): Promise<string> {
    const ext = IMAGE_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Unsupported image type (use PNG, JPEG, WebP, or GIF)');
    }
    const filename = `${randomUUID()}${ext}`;
    await writeFile(join(this.dir, filename), file.buffer);
    return `${UPLOAD_URL_PREFIX}/${filename}`;
  }

  async remove(url: string | null | undefined): Promise<void> {
    if (!url || !url.startsWith(`${UPLOAD_URL_PREFIX}/`)) return;
    try {
      await unlink(join(this.dir, basename(url)));
    } catch {
      /* already gone — ignore */
    }
  }
}
