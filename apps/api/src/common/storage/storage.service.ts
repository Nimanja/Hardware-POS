import { randomUUID } from 'crypto';
import { unlink, writeFile } from 'fs/promises';
import { basename, join } from 'path';

import { BadRequestException, Injectable } from '@nestjs/common';

import { getUploadDir, UPLOAD_URL_PREFIX } from './storage.util';

/** Allowed image mime types mapped to file extensions. */
const IMAGE_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/**
 * Local filesystem storage. Deliberately narrow (save/remove image) so it can be
 * swapped for S3 / Supabase Storage later without touching callers — replace this
 * class's body and keep the returned public URL shape (`/uploads/<file>`).
 */
@Injectable()
export class StorageService {
  private readonly dir = getUploadDir();

  /** Persist an uploaded image and return its public URL. */
  async saveImage(file: { buffer: Buffer; mimetype: string }): Promise<string> {
    const ext = IMAGE_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Unsupported image type (use PNG, JPEG, WebP, or GIF)');
    }
    const filename = `${randomUUID()}${ext}`;
    await writeFile(join(this.dir, filename), file.buffer);
    return `${UPLOAD_URL_PREFIX}/${filename}`;
  }

  /** Remove a previously stored file by its public URL (no-op if external/missing). */
  async remove(url: string | null | undefined): Promise<void> {
    if (!url || !url.startsWith(`${UPLOAD_URL_PREFIX}/`)) return;
    try {
      await unlink(join(this.dir, basename(url)));
    } catch {
      /* already gone — ignore */
    }
  }
}
