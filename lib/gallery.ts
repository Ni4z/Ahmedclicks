import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import { Photo, PhotoCategory } from '@/lib/types';
import { withBasePath } from '@/lib/site';

const photosRoot = path.join(process.cwd(), 'public', 'photos');
const supportedExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
]);

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
  files: string[];
};

function normalizeCategoryKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function humanizeCategory(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isImageFile(fileName: string): boolean {
  return supportedExtensions.has(path.extname(fileName).toLowerCase());
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

function getCategoryEntries(): CategoryEntry[] {
  if (!fs.existsSync(photosRoot)) {
    return [];
  }

  return fs
    .readdirSync(photosRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const key = normalizeCategoryKey(entry.name);
      const config = categoryConfig[key];
      const folderPath = path.join(photosRoot, entry.name);
      const files = fs
        .readdirSync(folderPath)
        .filter(isImageFile)
        .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }));

      return {
        folder: entry.name,
        key,
        name: config?.name || humanizeCategory(entry.name),
        description:
          config?.description ||
          `${humanizeCategory(entry.name)} collected in the NiazClicks archive.`,
        order: config?.order ?? 99,
        files,
      };
    })
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
    category.files.map((fileName, index) => {
      const filePath = path.join(photosRoot, category.folder, fileName);
      const modifiedAt = fs.statSync(filePath).mtime.toISOString().slice(0, 10);

      return {
        id: `${category.key}-${String(index + 1).padStart(2, '0')}`,
        title: createPhotoTitle(category.name, fileName, index),
        category: category.name,
        categoryKey: category.key,
        image: withBasePath(`/photos/${category.folder}/${fileName}`),
        thumbnail: withBasePath(`/photos/${category.folder}/${fileName}`),
        description: `${category.description} File: ${fileName}.`,
        featured: index === 0,
        date: modifiedAt,
      };
    })
  );
}

export function getPhotoCategories(): PhotoCategory[] {
  return getCategoryEntries().map((category) => ({
    key: category.key,
    name: category.name,
    description: category.description,
    count: category.files.length,
    coverImage: withBasePath(`/photos/${category.folder}/${category.files[0]}`),
  }));
}

export function getFeaturedPhotos(limit = 6): Photo[] {
  return getPhotos()
    .filter((photo) => photo.featured)
    .slice(0, limit);
}

export function getProfilePhoto(): Photo | undefined {
  const photos = getPhotos();

  return (
    photos.find((photo) => photo.categoryKey === 'humans') ||
    photos.find((photo) => photo.categoryKey === 'wildlife') ||
    photos[0]
  );
}
