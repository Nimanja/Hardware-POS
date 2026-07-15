import { randomUUID } from 'crypto';

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { BadRequestException } from '@nestjs/common';

import { IMAGE_EXT, StorageProvider, UploadedImage } from './storage-provider';

export interface S3StorageConfig {
  bucket: string;
  region: string;
  /** Custom endpoint (e.g. http://localhost:4566 for LocalStack). Omit for real AWS. */
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

/**
 * S3-compatible object storage (AWS S3, LocalStack, MinIO). Objects are keyed
 * `products/<uuid>.<ext>` and the stored URL is the object's public address —
 * path-style under a custom endpoint, virtual-hosted style on real AWS.
 */
export class S3StorageProvider implements StorageProvider {
  readonly kind = 's3' as const;
  private readonly client: S3Client;
  private readonly bucket: string;
  /** Base under which stored object URLs live, no trailing slash. */
  private readonly publicBase: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      // Skip the SDK's default streaming checksums — S3 emulators (LocalStack,
      // MinIO) reset the connection on the aws-chunked trailer encoding.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      ...(config.endpoint
        ? {
            endpoint: config.endpoint,
            // Custom endpoints (LocalStack/MinIO) don't resolve bucket subdomains.
            forcePathStyle: true,
          }
        : {}),
      ...(config.accessKeyId && config.secretAccessKey
        ? {
            credentials: {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            },
          }
        : {}),
    });
    this.publicBase = config.endpoint
      ? `${config.endpoint.replace(/\/$/, '')}/${config.bucket}`
      : `https://${config.bucket}.s3.${config.region}.amazonaws.com`;
  }

  async saveImage(file: UploadedImage): Promise<string> {
    const ext = IMAGE_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Unsupported image type (use PNG, JPEG, WebP, or GIF)');
    }
    const key = `products/${randomUUID()}${ext}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // Cache aggressively — keys are content-unique (UUID per upload).
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return `${this.publicBase}/${key}`;
  }

  async remove(url: string | null | undefined): Promise<void> {
    if (!url || !url.startsWith(`${this.publicBase}/`)) return;
    const key = url.slice(this.publicBase.length + 1);
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {
      /* already gone — ignore */
    }
  }
}
