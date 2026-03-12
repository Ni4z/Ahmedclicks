import { photoManifest } from '@/data/photoManifest';
import { videoEntries } from '@/data/videos';
import type { MediaManifest } from '@/lib/media-assets';

const seedDate = '1970-01-01T00:00:00.000Z';

export const mediaManifest: MediaManifest = {
  generatedAt: seedDate,
  source: 'seed',
  photos: photoManifest.map((entry) => ({
    objectKey: `photos-web/${entry.relativePath}`,
    relativePath: entry.relativePath,
    thumbnailObjectKey: `photos-thumb/${entry.relativePath}`,
    date: entry.date,
  })),
  videos: videoEntries.map((entry) => ({
    objectKey: entry.fileName,
    relativePath: entry.fileName,
    date: seedDate,
  })),
};
