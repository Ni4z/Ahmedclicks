import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import { Video } from '@/lib/types';
import { siteConfig, withBasePath } from '@/lib/site';
import { videoEntries } from '@/data/videos';

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

function createVideoTitle(fileName: string): string {
  const rawName = path.parse(fileName).name;

  return rawName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createVideoId(fileName: string): string {
  return path
    .parse(fileName)
    .name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createVideoRecord(fileName: string, index: number): Video {
  const filePath = path.join(videosRoot, fileName);
  const extension = path.extname(fileName).toLowerCase();
  const modifiedAt = fs.statSync(filePath).mtime.toISOString().slice(0, 10);

  return {
    id: createVideoId(fileName) || `video-${index + 1}`,
    title: createVideoTitle(fileName),
    src: withBasePath(`/videos/${encodeVideoFileName(fileName)}`),
    description: `Motion work published from the local videos folder. File: ${fileName}.`,
    fileName,
    mimeType: supportedVideoExtensions.get(extension) || 'video/mp4',
    featured: index < 2,
    date: modifiedAt,
  };
}

function createRemoteVideoRecord(
  entry: (typeof videoEntries)[number],
  index: number
): Video {
  const extension = path.extname(entry.fileName).toLowerCase();

  return {
    id: entry.id || createVideoId(entry.fileName) || `video-${index + 1}`,
    title: entry.title || createVideoTitle(entry.fileName),
    src: new URL(
      encodeVideoFileName(entry.fileName),
      `${siteConfig.videoBaseUrl}/`
    ).toString(),
    description:
      entry.description ||
      `Motion work published from the configured R2 video archive. File: ${entry.fileName}.`,
    fileName: entry.fileName,
    mimeType: supportedVideoExtensions.get(extension) || 'video/mp4',
    featured: entry.featured ?? index < 2,
    date: new Date().toISOString().slice(0, 10),
  };
}

function getRemoteVideos(): Video[] {
  if (!siteConfig.videoBaseUrl) {
    return [];
  }

  return videoEntries.map((entry, index) => createRemoteVideoRecord(entry, index));
}

function getLocalVideos(): Video[] {
  if (!fs.existsSync(videosRoot)) {
    return [];
  }

  return fs
    .readdirSync(videosRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isVideoFile(entry.name))
    .map((entry) => entry.name)
    .sort((first, second) => {
      const firstStat = fs.statSync(path.join(videosRoot, first));
      const secondStat = fs.statSync(path.join(videosRoot, second));

      if (firstStat.mtimeMs !== secondStat.mtimeMs) {
        return secondStat.mtimeMs - firstStat.mtimeMs;
      }

      return first.localeCompare(second, undefined, { numeric: true });
    })
    .map((fileName, index) => createVideoRecord(fileName, index));
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
