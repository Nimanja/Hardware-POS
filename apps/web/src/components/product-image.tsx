'use client';

import { Package } from 'lucide-react';
import * as React from 'react';

import { resolveImageUrl } from '@/lib/products-api';
import { cn } from '@/lib/utils';

/**
 * Product image with a consistent aspect ratio, `object-contain`, lazy loading,
 * and a clean placeholder when there is no image or it fails to load.
 */
export function ProductImage({
  src,
  alt,
  className,
  rounded = 'rounded-xl',
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  const resolved = resolveImageUrl(src);
  const [failed, setFailed] = React.useState(false);

  // Reset the error state when the source changes (e.g. after an upload).
  React.useEffect(() => setFailed(false), [resolved]);

  const showImage = resolved && !failed;

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden border border-border bg-muted',
        rounded,
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      ) : (
        <Package className="h-1/3 w-1/3 min-h-4 min-w-4 text-muted-foreground/50" aria-hidden />
      )}
    </div>
  );
}
