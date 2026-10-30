'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';

export interface PrintDimensions {
  width: number;
  height: number;
}

interface FramedPrintProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes: string;
  loading?: 'eager' | 'lazy';
  onLoad?: (dimensions: PrintDimensions) => void;
}

export function getPrintAspectRatio(width?: number, height?: number): number {
  return width && height && Number.isFinite(width) && Number.isFinite(height) &&
    width > 0 && height > 0 ? width / height : 3 / 2;
}

export default function FramedPrint({
  src,
  alt,
  width,
  height,
  sizes,
  loading = 'lazy',
  onLoad,
}: FramedPrintProps) {
  const [naturalDimensions, setNaturalDimensions] = useState<(PrintDimensions & { src: string }) | null>(null);
  const dimensions = naturalDimensions?.src === src ? naturalDimensions : { width, height };
  const aspectRatio = getPrintAspectRatio(dimensions.width, dimensions.height);

  return (
    <div
      className="print-simulation-frame"
      style={{ '--print-photo-ratio': aspectRatio } as CSSProperties}
    >
      <div className="print-simulation-image-area">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          loading={loading}
          className="entrance-print-image"
          onLoad={(event) => {
            const image = event.currentTarget;

            if (image.naturalWidth && image.naturalHeight) {
              const dimensions = { width: image.naturalWidth, height: image.naturalHeight };
              setNaturalDimensions({ src, ...dimensions });
              onLoad?.(dimensions);
            }
          }}
        />
      </div>
    </div>
  );
}