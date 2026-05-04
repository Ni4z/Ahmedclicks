import { siteConfig, withBasePath } from '@/lib/site';

export type SyncedPhotoAsset = {
  objectKey: string;
  relativePath: string;
  thumbnailObjectKey?: string | null;
  date: string;
};

export type SyncedVideoAsset = {
  objectKey: string;
  relativePath: string;
  date: string;
};

export type MediaManifest = {
  generatedAt: string;
  source: 'seed' | 'r2';
  photos: SyncedPhotoAsset[];
  videos: SyncedVideoAsset[];
};

function createDeterministicHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function encodeObjectKey(objectKey: string): string {
  return objectKey
    .replace(/^\/+/, '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function withObjectStorageAssetPath(
  objectKey: string,
  kind: 'image' | 'video' = 'image'
): string {
  const normalizedKey = objectKey.replace(/^\/+/, '');
  const baseUrl =
    kind === 'video'
      ? siteConfig.videoBaseUrl || siteConfig.imageBaseUrl
      : siteConfig.imageBaseUrl || siteConfig.videoBaseUrl;

  if (baseUrl) {
    return `${baseUrl}/${encodeObjectKey(normalizedKey)}`;
  }

  return withBasePath(`/${encodeObjectKey(normalizedKey)}`);
}

export function createStableAssetId(
  value: string,
  prefix = 'asset'
): string {
  const slug = value
    .replace(/\.[^.]+$/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${prefix}-${slug || prefix}-${createDeterministicHash(value)}`;
}

export function getInstagramAssetUrl(imageUrl: string): string {
  const sourcePrefix = '/photos-web/';
  const targetPrefix = '/photos-instagram/';
  const prefixIndex = imageUrl.indexOf(sourcePrefix);
  if (prefixIndex === -1) return imageUrl;
  const swapped =
    imageUrl.slice(0, prefixIndex) +
    targetPrefix +
    imageUrl.slice(prefixIndex + sourcePrefix.length);
  return swapped.replace(/\.[A-Za-z0-9]+(\?[^?]*)?$/, (_match, query) =>
    `.jpg${query ?? ''}`
  );
}

export function createMediaTitle(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const fileName = normalizedPath.split('/').pop() || normalizedPath;
  const extensionIndex = fileName.lastIndexOf('.');
  const baseName =
    extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;

  return baseName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
