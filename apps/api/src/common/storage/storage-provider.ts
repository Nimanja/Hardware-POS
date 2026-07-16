/** Allowed image mime types mapped to file extensions. */
export const IMAGE_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const STORAGE_PROVIDER_KINDS = ['local', 's3'] as const;
export type StorageProviderKind = (typeof STORAGE_PROVIDER_KINDS)[number];

export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
}

/**
 * Abstraction over WHERE uploaded files live (local disk, S3/LocalStack, ...).
 * Implementations persist a file and hand back the public URL stored on the
 * record; `remove` accepts that same URL and must ignore URLs it doesn't own,
 * so switching providers never breaks deletes of previously stored files.
 */
export interface StorageProvider {
  readonly kind: StorageProviderKind;
  /** Persist an uploaded image and return its public URL. */
  saveImage(file: UploadedImage): Promise<string>;
  /** Remove a previously stored file by its public URL (no-op if not ours). */
  remove(url: string | null | undefined): Promise<void>;
}
