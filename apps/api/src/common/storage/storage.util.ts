import { mkdirSync } from 'fs';
import { resolve } from 'path';

/** Public URL prefix under which uploaded files are served (outside the API version prefix). */
export const UPLOAD_URL_PREFIX = '/uploads';

/**
 * Absolute directory where uploaded files are written and served from. Override
 * with `UPLOAD_DIR`; defaults to `<cwd>/uploads`. Created on first access.
 */
export function getUploadDir(): string {
  const dir = process.env.UPLOAD_DIR ? resolve(process.env.UPLOAD_DIR) : resolve(process.cwd(), 'uploads');
  mkdirSync(dir, { recursive: true });
  return dir;
}
