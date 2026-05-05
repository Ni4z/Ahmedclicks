import path from 'node:path';
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

export function createMediaTitle(filePath: string): string {
  return path.posix
    .parse(filePath.replace(/\\/g, '/'))
    .name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
