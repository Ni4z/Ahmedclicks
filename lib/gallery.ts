import 'server-only';

import path from 'node:path';
import { mediaManifest } from '@/data/mediaManifest';
import {
  createStableAssetId,
  type SyncedPhotoAsset,
  withObjectStorageAssetPath,
} from '@/lib/media-assets';
import { Photo, PhotoCategory } from '@/lib/types';
import photoCaptions from '@/data/captions.json';
import photoMetadataSource from '@/data/photoMetadata.json';

const profileOnlyCategoryKeys = new Set(['me']);
const unpublishedPhotoPaths = new Set([
  'wildlife/DSC04895-2.jpg',
  'wildlife/DSC04912.jpg',
]);

const categoryAliases: Record<string, string> = {
  astro: 'astrophotography',
  landscapes: 'landscape',
  'night-sky': 'astrophotography',
  nightsky: 'astrophotography',
  people: 'humans',
  person: 'humans',
  portrait: 'humans',
  portraits: 'humans',
  road: 'roads',
  tree: 'trees',
};

const categoryConfig: Record<
  string,
  { name: string; description: string; order: number }
> = {
  archive: {
    name: 'Archive',
    description: 'Published photographs collected from the connected media archive.',
    order: 98,
  },
  wildlife: {
    name: 'Wildlife',
    description: 'Field encounters, animal movement, and close studies from the wild.',
    order: 1,
  },
  astrophotography: {
    name: 'Astrophotography',
    description: 'Night skies, long exposures, and atmospheric frames after dark.',
    order: 2,
  },
  landscape: {
    name: 'Landscape',
    description: 'Light, weather, distance, and the shape of the land.',
    order: 3,
  },
  travel: {
    name: 'Travel',
    description: 'Motion, places, and moments collected on the move.',
    order: 4,
  },
  roads: {
    name: 'Roads',
    description: 'Road scenes, geometry, and the visual rhythm of travel.',
    order: 5,
  },
  metropolis: {
    name: 'Metropolis',
    description: 'Urban light, architecture, and city moments from the built environment.',
    order: 6,
  },
  trees: {
    name: 'Trees',
    description: 'Texture, silhouettes, and quiet observations from nature.',
    order: 7,
  },
  humans: {
    name: 'Humans',
    description: 'Portraits, gestures, and the human side of the archive.',
    order: 8,
  },
};

type CategoryEntry = {
  key: string;
  name: string;
  description: string;
  order: number;
  files: ManifestPhotoEntry[];
};

type GetCategoryEntriesOptions = {
  includeProfileOnly?: boolean;
};

type ManifestPhotoEntry = {
  objectKey: string;
  thumbnailObjectKey?: string | null;
  relativePath: string;
  fileName: string;
  key: string;
  name: string;
  description: string;
  order: number;
  date: string;
};

type PhotoMetadataEntry = {
  tags: string[];
  series?: string;
  location?: string;
  year?: number;
};

function normalizeCategoryKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function getCanonicalCategoryKey(value: string): string {
  const normalizedValue = normalizeCategoryKey(value);
  return categoryAliases[normalizedValue] || normalizedValue;
}

function humanizeCategory(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createPhotoTitle(
  categoryName: string,
  fileName: string,
  index: number
): string {
  const rawName = path.parse(fileName).name;

  if (/^dsc\d+/i.test(rawName)) {
    return `${categoryName} Frame ${String(index + 1).padStart(2, '0')}`;
  }

  return rawName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function resolveCategorySegment(relativePath: string): string {
  const directorySegments = path.posix
    .dirname(relativePath)
    .split('/')
    .filter((segment) => Boolean(segment) && segment !== '.');

  for (const segment of directorySegments) {
    const categoryKey = getCanonicalCategoryKey(segment);

    if (categoryConfig[categoryKey] || profileOnlyCategoryKeys.has(categoryKey)) {
      return segment;
    }
  }

  return directorySegments[directorySegments.length - 1] || 'archive';
}

function getSortableTimestamp(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeMetadataString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();
  return normalizedValue || undefined;
}

function normalizeMetadataTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenTags = new Set<string>();
  const tags: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }

    const normalizedTag = item.trim();

    if (!normalizedTag) {
      continue;
    }

    const normalizedKey = normalizedTag.toLowerCase();

    if (seenTags.has(normalizedKey)) {
      continue;
    }

    seenTags.add(normalizedKey);
    tags.push(normalizedTag);
  }

  return tags;
}

function normalizePhotoMetadataEntry(value: unknown): PhotoMetadataEntry {
  if (!(value && typeof value === 'object') || Array.isArray(value)) {
    return {
      tags: [],
    };
  }

  const rawEntry = value as Record<string, unknown>;
  const year =
    typeof rawEntry.year === 'number' &&
    Number.isInteger(rawEntry.year) &&
    rawEntry.year >= 1000 &&
    rawEntry.year <= 9999
      ? rawEntry.year
      : undefined;

  return {
    tags: normalizeMetadataTags(rawEntry.tags),
    series: normalizeMetadataString(rawEntry.series),
    location: normalizeMetadataString(rawEntry.location),
    year,
  };
}

function normalizeRelativePath(value: string): string {
  return value.replace(/^\/+/, '').replace(/\\/g, '/');
}

function getPhotoYear(date: string): number {
  const timestamp = getSortableTimestamp(date);

  if (timestamp === 0) {
    return new Date().getUTCFullYear();
  }

  return new Date(timestamp).getUTCFullYear();
}

function createManifestPhotoEntry(entry: SyncedPhotoAsset): ManifestPhotoEntry {
  const relativePath = entry.relativePath.replace(/^\/+/, '').replace(/\\/g, '/');
  const categorySegment = resolveCategorySegment(relativePath);
  const key = getCanonicalCategoryKey(categorySegment);
  const config = categoryConfig[key];

  return {
    objectKey: entry.objectKey,
    thumbnailObjectKey: entry.thumbnailObjectKey,
    relativePath,
    fileName: path.posix.basename(relativePath),
    key,
    name: config?.name || humanizeCategory(categorySegment),
    description:
      config?.description ||
      `${humanizeCategory(categorySegment)} collected in the NiazPhotography archive.`,
    order: config?.order ?? 99,
    date: entry.date,
  };
}

const manifestEntries = mediaManifest.photos
  .filter((entry) => !unpublishedPhotoPaths.has(entry.relativePath))
  .map((entry) => createManifestPhotoEntry(entry));

function comparePhotoEntries(
  first: ManifestPhotoEntry,
  second: ManifestPhotoEntry
): number {
  const firstDate = getSortableTimestamp(first.date);
  const secondDate = getSortableTimestamp(second.date);

  if (firstDate !== secondDate) {
    return secondDate - firstDate;
  }

  return first.relativePath.localeCompare(second.relativePath, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

const captionMap = photoCaptions as Record<string, string>;
const photoMetadataMap = new Map<string, PhotoMetadataEntry>(
  Object.entries(photoMetadataSource as Record<string, unknown>)
    .filter(([key]) => !key.startsWith('_'))
    .map(([relativePath, value]) => [
      normalizeRelativePath(relativePath),
      normalizePhotoMetadataEntry(value),
    ])
);

function createPhotoRecord(
  category: CategoryEntry,
  file: ManifestPhotoEntry,
  index: number
): Photo {
  const caption = captionMap[file.relativePath] || undefined;
  const metadata = photoMetadataMap.get(file.relativePath) || { tags: [] };

  return {
    id: createStableAssetId(file.relativePath, 'photo'),
    title: createPhotoTitle(category.name, file.fileName, index),
    caption,
    category: category.name,
    categoryKey: category.key,
    tags: metadata.tags,
    series: metadata.series,
    image: withObjectStorageAssetPath(file.objectKey, 'image'),
    thumbnail: withObjectStorageAssetPath(
      file.thumbnailObjectKey || file.objectKey,
      'image'
    ),
    description: `${category.description} File: ${file.relativePath}.`,
    featured: index === 0,
    location: metadata.location,
    year: metadata.year ?? getPhotoYear(file.date),
    date: file.date,
  };
}

function getCategoryEntries(
  options: GetCategoryEntriesOptions = {}
): CategoryEntry[] {
  const { includeProfileOnly = false } = options;
  const groupedEntries = new Map<string, CategoryEntry>();

  for (const entry of manifestEntries) {
    if (!includeProfileOnly && profileOnlyCategoryKeys.has(entry.key)) {
      continue;
    }

    if (!groupedEntries.has(entry.key)) {
      groupedEntries.set(entry.key, {
        key: entry.key,
        name: entry.name,
        description: entry.description,
        order: entry.order,
        files: [],
      });
    }

    groupedEntries.get(entry.key)?.files.push(entry);
  }

  return Array.from(groupedEntries.values())
    .map((entry) => ({
      ...entry,
      files: entry.files.sort(comparePhotoEntries),
    }))
    .filter((entry) => entry.files.length > 0)
    .sort((first, second) => {
      if (first.order !== second.order) {
        return first.order - second.order;
      }

      return first.name.localeCompare(second.name);
    });
}

export function getPhotos(): Photo[] {
  const categories = getCategoryEntries();

  return categories.flatMap((category) =>
    category.files.map((file, index) =>
      createPhotoRecord(category, file, index)
    )
  );
}

export function getPhotoCategories(): PhotoCategory[] {
  return getCategoryEntries().map((category) => ({
    key: category.key,
    name: category.name,
    description: category.description,
    count: category.files.length,
    coverImage: withObjectStorageAssetPath(
      category.files[0].thumbnailObjectKey || category.files[0].objectKey,
      'image'
    ),
  }));
}

export function getFeaturedPhotos(limit = 6): Photo[] {
  return getPhotos()
    .filter((photo) => photo.featured)
    .slice(0, limit);
}

export function getRecentPhotos(limit = 6): Photo[] {
  return getPhotos()
    .slice()
    .sort(
      (first, second) =>
        getSortableTimestamp(second.date) - getSortableTimestamp(first.date)
    )
    .slice(0, limit);
}

export function getProfilePhoto(): Photo | undefined {
  const photos = getCategoryEntries({ includeProfileOnly: true }).flatMap(
    (category) =>
      category.files.map((file, index) =>
        createPhotoRecord(category, file, index)
      )
  );

  return (
    photos.find((photo) => photo.categoryKey === 'me') ||
    photos.find((photo) => photo.categoryKey === 'humans') ||
    photos.find((photo) => photo.categoryKey === 'wildlife') ||
    photos[0]
  );
}
