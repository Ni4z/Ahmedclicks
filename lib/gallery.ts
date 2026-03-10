import 'server-only';

import path from 'node:path';
import { photoManifest } from '@/data/photoManifest';
import { Photo, PhotoCategory } from '@/lib/types';
import { withPhotoAssetPath } from '@/lib/site';

const profileOnlyCategoryKeys = new Set(['me']);

const categoryConfig: Record<
  string,
  { name: string; description: string; order: number }
> = {
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
  trees: {
    name: 'Trees',
    description: 'Texture, silhouettes, and quiet observations from nature.',
    order: 6,
  },
  humans: {
    name: 'Humans',
    description: 'Portraits, gestures, and the human side of the archive.',
    order: 7,
  },
};

type CategoryEntry = {
  folder: string;
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
  relativePath: string;
  folder: string;
  fileName: string;
  key: string;
  name: string;
  description: string;
  order: number;
  date: string;
};

function normalizeCategoryKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
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

function createManifestPhotoEntry(relativePath: string, date: string): ManifestPhotoEntry {
  const parsedPath = path.posix.parse(relativePath);
  const folder = parsedPath.dir;
  const key = normalizeCategoryKey(folder);
  const config = categoryConfig[key];

  return {
    relativePath,
    folder,
    fileName: parsedPath.base,
    key,
    name: config?.name || humanizeCategory(folder),
    description:
      config?.description ||
      `${humanizeCategory(folder)} collected in the NiazPhotography archive.`,
    order: config?.order ?? 99,
    date,
  };
}

const manifestEntries = photoManifest.map((entry) =>
  createManifestPhotoEntry(entry.relativePath, entry.date)
);

function createPhotoRecord(
  category: CategoryEntry,
  file: ManifestPhotoEntry,
  index: number
): Photo {
  return {
    id: `${category.key}-${String(index + 1).padStart(2, '0')}`,
    title: createPhotoTitle(category.name, file.fileName, index),
    category: category.name,
    categoryKey: category.key,
    image: withPhotoAssetPath(`/photos/${category.folder}/${file.fileName}`),
    thumbnail: withPhotoAssetPath(
      `/photos/${category.folder}/${file.fileName}`,
      'thumbnail'
    ),
    description: `${category.description} File: ${file.fileName}.`,
    featured: index === 0,
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
        folder: entry.folder,
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
      files: entry.files.sort((first, second) =>
        first.fileName.localeCompare(second.fileName, undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      ),
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
    coverImage: withPhotoAssetPath(
      `/photos/${category.folder}/${category.files[0].fileName}`,
      'thumbnail'
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
        new Date(second.date).getTime() - new Date(first.date).getTime()
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
