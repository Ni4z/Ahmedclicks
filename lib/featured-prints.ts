'use client';

import { useEffect, useState } from 'react';
import { siteConfig } from '@/lib/site';

export interface FeaturedPrintPhoto {
  id: string;
  title: string;
  image: string;
  display?: string;
  width?: number;
  height?: number;
  galleryUrl?: string;
}

function isPrintImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  try {
    const image = new URL(value);
    const base = new URL(siteConfig.imageBaseUrl);
    const prefix = `${base.pathname.replace(/\/$/, '')}/featured-prints/`;
    return image.protocol === 'https:' && image.origin === base.origin &&
      image.pathname.startsWith(prefix);
  } catch {
    return false;
  }
}

export function parseFeaturedPrints(value: unknown): FeaturedPrintPhoto[] {
  if (!value || typeof value !== 'object') throw new Error('Invalid print collection');

  const payload = value as { version?: unknown; photos?: unknown };
  if (payload.version !== 1 || !Array.isArray(payload.photos) || payload.photos.length > 5) {
    throw new Error('Invalid print collection');
  }

  const photos = payload.photos.map((entry: unknown): FeaturedPrintPhoto => {
    if (!entry || typeof entry !== 'object') throw new Error('Invalid print photograph');

    const photo = entry as Record<string, unknown>;
    if (
      typeof photo.id !== 'string' || !photo.id.trim() ||
      typeof photo.title !== 'string' || !photo.title.trim() || !isPrintImageUrl(photo.image)
    ) {
      throw new Error('Invalid print photograph');
    }

    return {
      id: photo.id,
      title: photo.title.trim(),
      image: photo.image,
      display: isPrintImageUrl(photo.display) ? photo.display : photo.image,
      ...(typeof photo.width === 'number' && Number.isFinite(photo.width) && photo.width > 0
        ? { width: photo.width } : {}),
      ...(typeof photo.height === 'number' && Number.isFinite(photo.height) && photo.height > 0
        ? { height: photo.height } : {}),
    };
  });

  if (new Set(photos.map((photo) => photo.id)).size !== photos.length) {
    throw new Error('Duplicate print photographs');
  }

  return photos;
}

export function getPrintEnquiryHref(photo: FeaturedPrintPhoto): string {
  const query = new URLSearchParams({
    photo: photo.title,
    url: photo.galleryUrl || photo.image,
  });
  return `/prints?${query.toString()}`;
}

export function useFeaturedPrints(initialPhotos: FeaturedPrintPhoto[]): FeaturedPrintPhoto[] {
  const [photos, setPhotos] = useState(initialPhotos);

  useEffect(() => {
    let active = true;
    let pending: AbortController | undefined;

    const refresh = async () => {
      if (document.hidden) return;
      pending?.abort();
      const controller = new AbortController();
      pending = controller;

      try {
        const response = await fetch(siteConfig.featuredPrintsUrl, {
          signal: controller.signal,
          cache: 'no-store',
          credentials: 'omit',
        });
        if (!response.ok) return;
        const updated = parseFeaturedPrints(await response.json());
        if (active && !controller.signal.aborted) setPhotos(updated);
      } catch {}
    };

    void refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      active = false;
      pending?.abort();
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  return photos;
}