#!/usr/bin/env node

import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const manifestPath = path.join(process.cwd(), 'data', 'mediaManifest.ts');
const photoMetadataPath = path.join(process.cwd(), 'data', 'photoMetadata.json');
const photoMetadataReadme =
  'Add photo organization metadata by relative path. Use tags, series, weather, location, and year to keep the gallery browsable as it grows. New photo placeholders are added automatically during media sync.';
const validWeatherValues = new Set([
  'Summer',
  'Spring',
  'Autumn',
  'Winter',
  'Rain',
]);
const sourcePrefix = normalizePrefix(
  process.env.THUMB_SOURCE_PREFIX?.trim() ||
    process.env.R2_PHOTO_PREFIX?.trim() ||
    'photos-web'
);

function normalizePrefix(value) {
  const trimmedValue = (value || '').trim().replace(/^\/+|\/+$/g, '');
  return trimmedValue ? `${trimmedValue}/` : '';
}

function normalizeRelativeKey(value) {
  return value.replace(/^\/+/, '').replace(/\\/g, '/');
}

function normalizeSearchKey(value) {
  return normalizeRelativeKey(value).toLowerCase();
}

function basenameLowerCase(value) {
  return path.posix.basename(value).toLowerCase();
}

function normalizeMetadataString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();
  return normalizedValue || undefined;
}

function normalizeMetadataTags(value) {
  const rawTags = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  const seenTags = new Set();
  const tags = [];

  for (const item of rawTags) {
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

function normalizeMetadataYear(value) {
  if (value === undefined) {
    return undefined;
  }

  const parsedYear =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);

  if (
    !Number.isInteger(parsedYear) ||
    parsedYear < 1000 ||
    parsedYear > 9999
  ) {
    throw new Error(
      `Invalid year "${value}". Use a 4-digit year like 2026.`
    );
  }

  return parsedYear;
}

function normalizePhotoMetadataEntry(value) {
  if (!(value && typeof value === 'object') || Array.isArray(value)) {
    return {};
  }

  const rawEntry = value;
  const tags = normalizeMetadataTags(rawEntry.tags);
  const series = normalizeMetadataString(rawEntry.series);
  const rawWeather = normalizeMetadataString(rawEntry.weather);
  const weather =
    rawWeather && validWeatherValues.has(rawWeather) ? rawWeather : undefined;
  const location = normalizeMetadataString(rawEntry.location);
  const year = normalizeMetadataYear(rawEntry.year);
  const entry = {};

  if (tags.length > 0) {
    entry.tags = tags;
  }

  if (series) {
    entry.series = series;
  }

  if (weather) {
    entry.weather = weather;
  }

  if (location) {
    entry.location = location;
  }

  if (year !== undefined) {
    entry.year = year;
  }

  return entry;
}

function parsePhotoMetadataMap(source) {
  if (!(source && typeof source === 'object') || Array.isArray(source)) {
    throw new Error('Photo metadata file must contain a JSON object.');
  }

  const entries = [];

  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith('_')) {
      continue;
    }

    entries.push([
      normalizeRelativeKey(key),
      normalizePhotoMetadataEntry(value),
    ]);
  }

  return entries;
}

function renderPhotoMetadataMap(entries) {
  const payload = {
    _README: photoMetadataReadme,
  };

  for (const [key, value] of entries) {
    payload[key] = normalizePhotoMetadataEntry(value);
  }

  return `${JSON.stringify(payload, null, 2)}\n`;
}

function validateManifest(manifest) {
  if (!(manifest && typeof manifest === 'object') || !Array.isArray(manifest.photos)) {
    throw new Error('Media manifest payload was invalid.');
  }

  return manifest;
}

async function loadKnownPhotoPaths() {
  if (!fsSync.existsSync(manifestPath)) {
    throw new Error(`Local manifest file is missing at ${manifestPath}.`);
  }

  const source = await fs.readFile(manifestPath, 'utf8');
  const match = source.match(
    /export const mediaManifest: MediaManifest = (\{[\s\S]*\});\s*$/
  );

  if (!match) {
    throw new Error('Unable to parse the local media manifest file.');
  }

  const manifest = validateManifest(JSON.parse(match[1]));

  return manifest.photos
    .map((entry) =>
      typeof entry?.relativePath === 'string'
        ? normalizeRelativeKey(entry.relativePath)
        : ''
    )
    .filter(Boolean);
}

function levenshteinDistance(first, second) {
  if (first === second) {
    return 0;
  }

  if (first.length === 0) {
    return second.length;
  }

  if (second.length === 0) {
    return first.length;
  }

  const previousRow = Array.from(
    { length: second.length + 1 },
    (_, index) => index
  );

  for (let firstIndex = 0; firstIndex < first.length; firstIndex += 1) {
    let previousDiagonal = previousRow[0];
    previousRow[0] = firstIndex + 1;

    for (let secondIndex = 0; secondIndex < second.length; secondIndex += 1) {
      const temp = previousRow[secondIndex + 1];
      const substitutionCost =
        first[firstIndex] === second[secondIndex] ? 0 : 1;
      previousRow[secondIndex + 1] = Math.min(
        previousRow[secondIndex + 1] + 1,
        previousRow[secondIndex] + 1,
        previousDiagonal + substitutionCost
      );
      previousDiagonal = temp;
    }
  }

  return previousRow[second.length];
}

function getSuggestedPaths(input, knownPhotoPaths) {
  const normalizedInput = normalizeSearchKey(input);
  const inputFileName = basenameLowerCase(input);

  return knownPhotoPaths
    .map((candidatePath) => {
      const normalizedCandidate = normalizeSearchKey(candidatePath);
      const candidateFileName = basenameLowerCase(candidatePath);
      let score = levenshteinDistance(normalizedInput, normalizedCandidate);

      if (candidateFileName === inputFileName) {
        score -= 3;
      } else if (
        candidateFileName.includes(inputFileName) ||
        inputFileName.includes(candidateFileName)
      ) {
        score -= 1;
      }

      if (
        normalizedCandidate.includes(normalizedInput) ||
        normalizedInput.includes(normalizedCandidate)
      ) {
        score -= 1;
      }

      return {
        path: candidatePath,
        score,
      };
    })
    .sort((first, second) => {
      if (first.score !== second.score) {
        return first.score - second.score;
      }

      return first.path.localeCompare(second.path, undefined, {
        sensitivity: 'base',
      });
    })
    .slice(0, 3)
    .map((candidate) => candidate.path);
}

async function resolveExistingPhotoKey(input) {
  const normalizedInput = normalizeRelativeKey(input.trim());

  if (!normalizedInput) {
    throw new Error(
      'Provide a photo path like "wildlife/Robin on Perch.jpg".'
    );
  }

  const candidateKey =
    sourcePrefix && normalizedInput.startsWith(sourcePrefix)
      ? normalizedInput.slice(sourcePrefix.length)
      : normalizedInput;
  const knownPhotoPaths = await loadKnownPhotoPaths();

  if (knownPhotoPaths.includes(candidateKey)) {
    return candidateKey;
  }

  const matchingCaseInsensitivePaths = knownPhotoPaths.filter(
    (knownPath) => normalizeSearchKey(knownPath) === normalizeSearchKey(candidateKey)
  );

  if (matchingCaseInsensitivePaths.length === 1) {
    throw new Error(
      `Photo path not found: ${candidateKey}. Did you mean "${matchingCaseInsensitivePaths[0]}"?`
    );
  }

  const suggestions = getSuggestedPaths(candidateKey, knownPhotoPaths);
  const suggestionText =
    suggestions.length > 0
      ? ` Closest matches: ${suggestions.map((value) => `"${value}"`).join(', ')}.`
      : '';

  throw new Error(`Photo path not found: ${candidateKey}.${suggestionText}`);
}

function printUsage() {
  console.log(
    [
      'Usage:',
      '  npm run photo:meta:set -- <photo-relative-path> [options]',
      '',
      'Options:',
      '  --tags <comma-separated-tags>',
      '  --series <series-name>',
      '  --location <location-name>',
      '  --year <yyyy>',
      '  --clear-tags',
      '  --clear-series',
      '  --clear-location',
      '  --clear-year',
      '',
      'Examples:',
      '  npm run photo:meta:set -- "wildlife/Robin on Perch.jpg" --tags "robin,bird,perch" --series "Morning Birds" --location "Muenster Wetland"',
      '  npm run photo:meta:set -- "landscape/Lets Walk.jpg" --tags "forest,path" --location "Woodland Trail" --year 2026',
      '  npm run photo:meta:set -- "wildlife/Robin on Perch.jpg" --clear-series --clear-location',
    ].join('\n')
  );
}

function parseArgs(argv) {
  let sourcePath = '';
  let tags;
  let series;
  let location;
  let year;
  let clearTags = false;
  let clearSeries = false;
  let clearLocation = false;
  let clearYear = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    if (!sourcePath && !arg.startsWith('--')) {
      sourcePath = arg;
      continue;
    }

    if (arg === '--clear-tags') {
      clearTags = true;
      continue;
    }

    if (arg === '--clear-series') {
      clearSeries = true;
      continue;
    }

    if (arg === '--clear-location') {
      clearLocation = true;
      continue;
    }

    if (arg === '--clear-year') {
      clearYear = true;
      continue;
    }

    const nextArg = argv[index + 1];

    if (!nextArg || nextArg.startsWith('--')) {
      throw new Error(`Missing value for ${arg}.`);
    }

    if (arg === '--tags') {
      tags = nextArg;
      index += 1;
      continue;
    }

    if (arg === '--series') {
      series = nextArg;
      index += 1;
      continue;
    }

    if (arg === '--location') {
      location = nextArg;
      index += 1;
      continue;
    }

    if (arg === '--year') {
      year = nextArg;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!sourcePath) {
    printUsage();
    process.exit(1);
  }

  if (clearTags && tags !== undefined) {
    throw new Error('Use either --tags or --clear-tags, not both.');
  }

  if (clearSeries && series !== undefined) {
    throw new Error('Use either --series or --clear-series, not both.');
  }

  if (clearLocation && location !== undefined) {
    throw new Error('Use either --location or --clear-location, not both.');
  }

  if (clearYear && year !== undefined) {
    throw new Error('Use either --year or --clear-year, not both.');
  }

  if (
    tags === undefined &&
    series === undefined &&
    location === undefined &&
    year === undefined &&
    !clearTags &&
    !clearSeries &&
    !clearLocation &&
    !clearYear
  ) {
    throw new Error('Provide at least one metadata change.');
  }

  return {
    clearLocation,
    clearSeries,
    clearTags,
    clearYear,
    location,
    series,
    sourcePath,
    tags,
    year,
  };
}

async function loadPhotoMetadataEntries() {
  const currentSource = fsSync.existsSync(photoMetadataPath)
    ? await fs.readFile(photoMetadataPath, 'utf8')
    : '';

  return {
    currentSource,
    entries: currentSource
      ? parsePhotoMetadataMap(JSON.parse(currentSource))
      : [],
  };
}

async function main() {
  const {
    clearLocation,
    clearSeries,
    clearTags,
    clearYear,
    location,
    series,
    sourcePath,
    tags,
    year,
  } = parseArgs(process.argv.slice(2));
  const photoKey = await resolveExistingPhotoKey(sourcePath);
  const { currentSource, entries } = await loadPhotoMetadataEntries();
  const nextEntries = [];
  let foundExistingEntry = false;

  for (const [key, value] of entries) {
    if (key !== photoKey) {
      nextEntries.push([key, value]);
      continue;
    }

    const nextEntry = {
      ...normalizePhotoMetadataEntry(value),
    };

    if (clearTags) {
      delete nextEntry.tags;
    }

    if (clearSeries) {
      delete nextEntry.series;
    }

    if (clearLocation) {
      delete nextEntry.location;
    }

    if (clearYear) {
      delete nextEntry.year;
    }

    if (tags !== undefined) {
      nextEntry.tags = normalizeMetadataTags(tags);
    }

    if (series !== undefined) {
      const normalizedSeries = normalizeMetadataString(series);

      if (normalizedSeries) {
        nextEntry.series = normalizedSeries;
      } else {
        delete nextEntry.series;
      }
    }

    if (location !== undefined) {
      const normalizedLocation = normalizeMetadataString(location);

      if (normalizedLocation) {
        nextEntry.location = normalizedLocation;
      } else {
        delete nextEntry.location;
      }
    }

    if (year !== undefined) {
      nextEntry.year = normalizeMetadataYear(year);
    }

    nextEntries.push([key, normalizePhotoMetadataEntry(nextEntry)]);
    foundExistingEntry = true;
  }

  if (!foundExistingEntry) {
    const nextEntry = normalizePhotoMetadataEntry({
      tags: tags !== undefined ? tags : undefined,
      series,
      location,
      year,
    });
    nextEntries.push([photoKey, nextEntry]);
  }

  const nextSource = renderPhotoMetadataMap(nextEntries);

  if (nextSource === currentSource) {
    console.log(`[photo:meta:set] No change for ${photoKey}.`);
    return;
  }

  await fs.writeFile(photoMetadataPath, nextSource, 'utf8');
  const savedEntry = nextEntries.find(([key]) => key === photoKey)?.[1] || {};

  console.log(
    `[photo:meta:set] Updated ${photoKey} in data/photoMetadata.json.`
  );
  console.log(JSON.stringify(savedEntry, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[photo:meta:set] ${message}`);
  process.exit(1);
});
