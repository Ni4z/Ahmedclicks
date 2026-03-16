import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import { mediaManifest } from '@/data/mediaManifest';
import mediaCaptions from '@/data/captions.json';
import {
  createMediaTitle,
  createStableAssetId,
  withObjectStorageAssetPath,
} from '@/lib/media-assets';
import { Video } from '@/lib/types';
import { siteConfig, withBasePath } from '@/lib/site';

const videosRoot = path.join(process.cwd(), 'public', 'videos');
const supportedVideoExtensions = new Map<string, string>([
  ['.mp4', 'video/mp4'],
  ['.webm', 'video/webm'],
  ['.mov', 'video/quicktime'],
  ['.m4v', 'video/x-m4v'],
]);

function isVideoFile(fileName: string): boolean {
  return supportedVideoExtensions.has(path.extname(fileName).toLowerCase());
}

function encodeVideoFileName(fileName: string): string {
  return fileName
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function normalizeVideoDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date(0).toISOString().slice(0, 10);
  }

  return parsedDate.toISOString().slice(0, 10);
}

function getSortableTimestamp(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

const captionMap = mediaCaptions as Record<string, string>;

function getVideoCaption(relativePath: string): string | undefined {
  return captionMap[relativePath] || undefined;
}

function compareVideoDates(first: { date: string }, second: { date: string }): number {
  return getSortableTimestamp(second.date) - getSortableTimestamp(first.date);
}

function walkVideoDirectory(directory: string, relativePrefix = ''): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = relativePrefix
      ? `${relativePrefix}/${entry.name}`
      : entry.name;
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return walkVideoDirectory(fullPath, relativePath);
    }

    return isVideoFile(entry.name) ? [relativePath] : [];
  });
}

function createLocalVideoRecord(fileName: string, index: number): Video {
  const filePath = path.join(videosRoot, fileName);
  const extension = path.extname(fileName).toLowerCase();
  const modifiedAt = fs.statSync(filePath).mtime.toISOString();

  return {
    id: createStableAssetId(fileName, 'video'),
    title: createMediaTitle(fileName),
    src: withBasePath(`/videos/${encodeVideoFileName(fileName)}`),
    caption: getVideoCaption(fileName),
    description: `Motion work published from the local video archive. File: ${fileName}.`,
    fileName,
    mimeType: supportedVideoExtensions.get(extension) || 'video/mp4',
    featured: index < 2,
    date: normalizeVideoDate(modifiedAt),
  };
}

function createRemoteVideoRecord(
  entry: (typeof mediaManifest.videos)[number],
  index: number
): Video {
  const extension = path.extname(entry.relativePath).toLowerCase();

  return {
    id: createStableAssetId(entry.relativePath, 'video'),
    title: createMediaTitle(entry.relativePath),
    src: withObjectStorageAssetPath(entry.objectKey, 'video'),
    caption: getVideoCaption(entry.relativePath),
    description: `Motion work published from the connected R2 archive. File: ${entry.relativePath}.`,
    fileName: entry.relativePath,
    mimeType: supportedVideoExtensions.get(extension) || 'video/mp4',
    featured: index < 2,
    date: normalizeVideoDate(entry.date),
  };
}

function getRemoteVideos(): Video[] {
  if (!siteConfig.videoBaseUrl || mediaManifest.videos.length === 0) {
    return [];
  }

  return mediaManifest.videos
    .slice()
    .sort(compareVideoDates)
    .map((entry, index) => createRemoteVideoRecord(entry, index));
}

function getLocalVideos(): Video[] {
  return walkVideoDirectory(videosRoot)
    .sort((first, second) => {
      const firstStat = fs.statSync(path.join(videosRoot, first));
      const secondStat = fs.statSync(path.join(videosRoot, second));

      if (firstStat.mtimeMs !== secondStat.mtimeMs) {
        return secondStat.mtimeMs - firstStat.mtimeMs;
      }

      return first.localeCompare(second, undefined, { numeric: true });
    })
    .map((fileName, index) => createLocalVideoRecord(fileName, index));
}

export function getVideos(): Video[] {
  const remoteVideos = getRemoteVideos();

  if (remoteVideos.length > 0) {
    return remoteVideos;
  }

  return getLocalVideos();
}

export function getFeaturedVideos(limit = 2): Video[] {
  return getVideos().slice(0, limit);
}
