#!/usr/bin/env node

import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

loadLocalEnvFiles();

const emptyPayloadHash = crypto.createHash('sha256').update('').digest('hex');

const imageExtensions = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.webp',
]);

const videoExtensions = new Set(['.m4v', '.mov', '.mp4', '.webm']);

const bucketName = process.env.R2_BUCKET_NAME?.trim() || '';
const accountId = process.env.R2_ACCOUNT_ID?.trim() || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || '';
const region = process.env.R2_REGION?.trim() || 'auto';
const endpoint = (
  process.env.R2_ENDPOINT?.trim() ||
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '')
).replace(/\/+$/, '');
const configuredPhotoPrefix = process.env.R2_PHOTO_PREFIX;
const photoPrefix = normalizePrefix(configuredPhotoPrefix ?? 'photos-web');
const restrictPhotosToPrefix = configuredPhotoPrefix !== undefined;
const photoThumbPrefix = normalizePrefix(
  process.env.R2_PHOTO_THUMB_PREFIX || 'photos-thumb'
);
const videoPrefix =
  process.env.R2_VIDEO_PREFIX === undefined
    ? ''
    : normalizePrefix(process.env.R2_VIDEO_PREFIX);
const manifestPath = path.join(process.cwd(), 'data', 'mediaManifest.ts');
const captionsPath = path.join(process.cwd(), 'data', 'captions.json');
const photoMetadataPath = path.join(process.cwd(), 'data', 'photoMetadata.json');
const captionsReadme =
  'Add a caption for any photo or video by its relative path. Empty string or missing entry = no caption shown. New media placeholders are added automatically in the external captions store and synced locally during media sync.';
const photoMetadataReadme =
  'Add photo organization metadata by relative path. Use tags, series, weather, location, and year to keep the gallery browsable as it grows. Weather values: Summer, Spring, Autumn, Winter, Rain. New photo placeholders are added automatically during media sync.';
const manifestObjectKey = normalizeRelativeKey(
  process.env.MEDIA_MANIFEST_OBJECT_KEY?.trim() || 'media-manifest.json'
);
const captionsObjectKey = normalizeRelativeKey(
  process.env.CAPTIONS_OBJECT_KEY?.trim() || 'captions.json'
);
const expectedPublishedGeneratedAt =
  process.env.MEDIA_MANIFEST_EXPECTED_GENERATED_AT?.trim() || '';
const expectedPublishedWaitTimeoutMs = Number(
  process.env.MEDIA_MANIFEST_EXPECTED_WAIT_TIMEOUT_MS || 90000
);
const expectedPublishedWaitPollMs = Number(
  process.env.MEDIA_MANIFEST_EXPECTED_WAIT_POLL_MS || 1000
);
const publicImageBaseUrl = (
  process.env.PUBLIC_IMAGE_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim() ||
  ''
).replace(/\/+$/, '');
const publishedManifestUrl = (
  process.env.MEDIA_MANIFEST_URL?.trim() ||
  process.env.NEXT_PUBLIC_MEDIA_MANIFEST_URL?.trim() ||
  (publicImageBaseUrl
    ? `${publicImageBaseUrl}/${encodeObjectKeyForUrl(manifestObjectKey)}`
    : '')
).trim();
const publishedCaptionsUrl = (
  process.env.CAPTIONS_URL?.trim() ||
  process.env.NEXT_PUBLIC_CAPTIONS_URL?.trim() ||
  (publicImageBaseUrl
    ? `${publicImageBaseUrl}/${encodeObjectKeyForUrl(captionsObjectKey)}`
    : '')
).trim();
const exifObjectKey = normalizeRelativeKey(
  process.env.EXIF_OBJECT_KEY?.trim() || 'photos-exif.json'
);
const publishedExifUrl = (
  process.env.EXIF_URL?.trim() ||
  (publicImageBaseUrl
    ? `${publicImageBaseUrl}/${encodeObjectKeyForUrl(exifObjectKey)}`
    : '')
).trim();

function loadLocalEnvFiles() {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = path.join(process.cwd(), fileName);

    if (!fsSync.existsSync(filePath)) {
      continue;
    }

    const source = fsSync.readFileSync(filePath, 'utf8');

    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith('#')) {
        continue;
      }

      const separatorIndex = line.indexOf('=');

      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if (!key || process.env[key] !== undefined) {
        continue;
      }

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}

function normalizePrefix(value) {
  const trimmedValue = value.trim().replace(/^\/+|\/+$/g, '');
  return trimmedValue ? `${trimmedValue}/` : '';
}

function encodeObjectKeyForUrl(objectKey) {
  return normalizeRelativeKey(objectKey)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function decodeXmlEntities(value) {
  return value.replace(
    /&(#x?[0-9A-Fa-f]+|amp|apos|gt|lt|quot);/g,
    (_, entity) => {
      switch (entity) {
        case 'amp':
          return '&';
        case 'apos':
          return "'";
        case 'gt':
          return '>';
        case 'lt':
          return '<';
        case 'quot':
          return '"';
        default: {
          if (entity.startsWith('#x')) {
            return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
          }

          if (entity.startsWith('#')) {
            return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
          }

          return entity;
        }
      }
    }
  );
}

function readXmlTag(source, tagName) {
  const tagMatch = source.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`));
  return tagMatch?.[1].trim() || '';
}

function parseListBucketXml(xml) {
  const contentsPattern = /<Contents>([\s\S]*?)<\/Contents>/g;
  const items = [];
  let contentsMatch = contentsPattern.exec(xml);

  while (contentsMatch) {
    const block = contentsMatch[1];
    const key = decodeXmlEntities(readXmlTag(block, 'Key'));

    if (key) {
      items.push({
        key,
        lastModified:
          decodeXmlEntities(readXmlTag(block, 'LastModified')) ||
          new Date(0).toISOString(),
      });
    }

    contentsMatch = contentsPattern.exec(xml);
  }

  return {
    items,
    isTruncated: readXmlTag(xml, 'IsTruncated') === 'true',
    nextContinuationToken: decodeXmlEntities(
      readXmlTag(xml, 'NextContinuationToken')
    ),
  };
}

function canonicalizePathname(pathname) {
  const segments = pathname.split('/').map((segment) => encodeRfc3986(segment));

  if (pathname.startsWith('/')) {
    segments[0] = '';
  }

  return segments.join('/');
}

function canonicalizeQuery(searchParams) {
  return [...searchParams.entries()]
    .sort(([firstKey, firstValue], [secondKey, secondValue]) => {
      if (firstKey !== secondKey) {
        return firstKey.localeCompare(secondKey);
      }

      return firstValue.localeCompare(secondValue);
    })
    .map(
      ([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`
    )
    .join('&');
}

function hmac(key, value) {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest();
}

function signRequest(url, method = 'GET') {
  const requestDate = new Date();
  const amzDate = requestDate
    .toISOString()
    .replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const canonicalQueryString = canonicalizeQuery(url.searchParams);
  const canonicalHeaders = [
    `host:${url.host}`,
    `x-amz-content-sha256:${emptyPayloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join('\n');
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    method,
    canonicalizePathname(url.pathname),
    canonicalQueryString,
    `${canonicalHeaders}\n`,
    signedHeaders,
    emptyPayloadHash,
  ].join('\n');
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex'),
  ].join('\n');
  const signingKey = hmac(
    hmac(
      hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), region),
      's3'
    ),
    'aws4_request'
  );
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(stringToSign, 'utf8')
    .digest('hex');

  return {
    headers: {
      authorization: [
        `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
        `SignedHeaders=${signedHeaders}`,
        `Signature=${signature}`,
      ].join(', '),
      'x-amz-content-sha256': emptyPayloadHash,
      'x-amz-date': amzDate,
    },
  };
}

function isImageKey(objectKey) {
  return imageExtensions.has(path.extname(objectKey).toLowerCase());
}

function isVideoKey(objectKey) {
  return videoExtensions.has(path.extname(objectKey).toLowerCase());
}

function stripPrefix(objectKey, prefix) {
  return prefix && objectKey.startsWith(prefix)
    ? objectKey.slice(prefix.length)
    : objectKey;
}

function normalizeRelativeKey(objectKey) {
  return objectKey.replace(/^\/+/, '').replace(/\\/g, '/');
}

function getRelativeStem(objectKey) {
  const normalizedKey = normalizeRelativeKey(objectKey);
  const extension = path.extname(normalizedKey);

  return extension
    ? normalizedKey.slice(0, normalizedKey.length - extension.length)
    : normalizedKey;
}

function compareByDateDescending(first, second) {
  const firstDate = Number.isNaN(new Date(first.date).getTime())
    ? 0
    : new Date(first.date).getTime();
  const secondDate = Number.isNaN(new Date(second.date).getTime())
    ? 0
    : new Date(second.date).getTime();

  if (firstDate !== secondDate) {
    return secondDate - firstDate;
  }

  return first.relativePath.localeCompare(second.relativePath, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function parseIsoTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

async function listBucketObjects() {
  const collectedItems = [];
  let continuationToken = '';

  do {
    const requestUrl = new URL(`${endpoint}/${bucketName}`);
    requestUrl.searchParams.set('list-type', '2');
    requestUrl.searchParams.set('max-keys', '1000');

    if (continuationToken) {
      requestUrl.searchParams.set('continuation-token', continuationToken);
    }

    const response = await fetch(requestUrl, {
      headers: signRequest(requestUrl).headers,
      method: 'GET',
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        `R2 object listing failed with ${response.status} ${response.statusText}: ${responseText}`
      );
    }

    const payload = parseListBucketXml(await response.text());
    collectedItems.push(...payload.items);
    continuationToken = payload.isTruncated
      ? payload.nextContinuationToken
      : '';
  } while (continuationToken);

  return collectedItems;
}

async function fetchSignedObjectText(objectKey) {
  const requestUrl = new URL(
    `${endpoint}/${bucketName}/${encodeObjectKeyForUrl(objectKey)}`
  );
  const response = await fetch(requestUrl, {
    headers: signRequest(requestUrl).headers,
    method: 'GET',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `R2 object fetch failed for ${objectKey} with ${response.status} ${response.statusText}: ${responseText}`
    );
  }

  return response.text();
}

function buildPhotoAssets(objects) {
  const thumbnailLookup = new Map();

  for (const object of objects) {
    if (
      photoThumbPrefix &&
      object.key.startsWith(photoThumbPrefix) &&
      isImageKey(object.key)
    ) {
      thumbnailLookup.set(
        getRelativeStem(stripPrefix(object.key, photoThumbPrefix)),
        object.key
      );
    }
  }

  const photoCandidates = objects.filter(
    (object) =>
      isImageKey(object.key) &&
      !(photoThumbPrefix && object.key.startsWith(photoThumbPrefix)) &&
      (!restrictPhotosToPrefix ||
        !photoPrefix ||
        object.key.startsWith(photoPrefix))
  );

  return {
    photos: photoCandidates
      .map((object) => {
        const relativePath = stripPrefix(object.key, photoPrefix);
        const thumbLookupKey = getRelativeStem(relativePath);

        return {
          objectKey: object.key,
          relativePath,
          thumbnailObjectKey: thumbnailLookup.get(thumbLookupKey) || null,
          date: object.lastModified || new Date(0).toISOString(),
        };
      })
      .sort(compareByDateDescending),
    thumbnailKeys: new Set(thumbnailLookup.values()),
  };
}

function buildVideoAssets(objects, excludedKeys) {
  const videoCandidates = objects
    .filter((object) => isVideoKey(object.key))
    .filter((object) => {
      if (videoPrefix) {
        return object.key.startsWith(videoPrefix);
      }

      return !excludedKeys.has(object.key);
    });

  return videoCandidates
    .map((object) => ({
      objectKey: object.key,
      relativePath: stripPrefix(object.key, videoPrefix),
      date: object.lastModified || new Date(0).toISOString(),
    }))
    .sort(compareByDateDescending);
}

function renderManifest(manifest) {
  return [
    "import type { MediaManifest } from '@/lib/media-assets';",
    '',
    `export const mediaManifest: MediaManifest = ${JSON.stringify(
      manifest,
      null,
      2
    )};`,
    '',
  ].join('\n');
}

function parseCaptionMap(source) {
  if (!(source && typeof source === 'object') || Array.isArray(source)) {
    throw new Error('Caption file must contain a JSON object.');
  }

  const entries = [];

  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith('_')) {
      continue;
    }

    entries.push([
      normalizeRelativeKey(key),
      typeof value === 'string' ? value : '',
    ]);
  }

  return entries;
}

function renderCaptionMap(entries) {
  const payload = {
    _README: captionsReadme,
  };

  for (const [key, value] of entries) {
    payload[key] = value;
  }

  return `${JSON.stringify(payload, null, 2)}\n`;
}

function normalizePhotoMetadataString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();
  return normalizedValue || undefined;
}

function normalizePhotoMetadataTags(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenTags = new Set();
  const tags = [];

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

function normalizePhotoMetadataEntry(value) {
  if (!(value && typeof value === 'object') || Array.isArray(value)) {
    return {};
  }

  const tags = normalizePhotoMetadataTags(value.tags);
  const series = normalizePhotoMetadataString(value.series);
  const weather = normalizePhotoMetadataString(value.weather);
  const country = normalizePhotoMetadataString(value.country);
  const location = normalizePhotoMetadataString(value.location);
  const year =
    typeof value.year === 'number' &&
    Number.isInteger(value.year) &&
    value.year >= 1000 &&
    value.year <= 9999
      ? value.year
      : undefined;
  const camera = normalizePhotoMetadataString(value.camera);
  const lens = normalizePhotoMetadataString(value.lens);
  const iso =
    typeof value.iso === 'number' && Number.isFinite(value.iso) && value.iso > 0
      ? value.iso
      : undefined;
  const shutterSpeed = normalizePhotoMetadataString(value.shutterSpeed);
  const aperture = normalizePhotoMetadataString(value.aperture);
  const focalLength = normalizePhotoMetadataString(value.focalLength);
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

  if (country) {
    entry.country = country;
  }

  if (location) {
    entry.location = location;
  }

  if (year) {
    entry.year = year;
  }

  if (camera) {
    entry.camera = camera;
  }

  if (lens) {
    entry.lens = lens;
  }

  if (iso) {
    entry.iso = iso;
  }

  if (shutterSpeed) {
    entry.shutterSpeed = shutterSpeed;
  }

  if (aperture) {
    entry.aperture = aperture;
  }

  if (focalLength) {
    entry.focalLength = focalLength;
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

async function loadCaptionEntries() {
  const currentSource = fsSync.existsSync(captionsPath)
    ? await fs.readFile(captionsPath, 'utf8')
    : '';
  const localEntries = currentSource
    ? parseCaptionMap(JSON.parse(currentSource))
    : [];
  if (publishedCaptionsUrl) {
    try {
      const publishedEntries = await fetchPublishedCaptions();

      if (publishedEntries) {
        return {
          currentSource,
          entries: publishedEntries,
          sourceLabel: publishedCaptionsUrl,
        };
      }
    } catch (error) {
      console.warn(
        `[sync:media] ${formatErrorWithCause(error)} Falling back to direct R2/local captions sync.`
      );
    }
  }

  if (hasRequiredR2Config()) {
    try {
      const directEntries = await fetchDirectCaptionEntries();

      if (directEntries) {
        return {
          currentSource,
          entries: directEntries,
          sourceLabel: `R2 ${captionsObjectKey}`,
        };
      }
    } catch (error) {
      console.warn(
        `[sync:media] ${formatErrorWithCause(error)} Keeping the existing local captions.`
      );
    }
  }

  return {
    currentSource,
    entries: localEntries,
    sourceLabel: 'local captions file',
  };
}

async function syncCaptionPlaceholders(mediaEntries) {
  const { currentSource, entries, sourceLabel } = await loadCaptionEntries();
  const captionMap = new Map(entries);
  const synchronizedEntries = [...entries];
  const addedKeys = [];

  for (const mediaEntry of mediaEntries) {
    const relativePath = normalizeRelativeKey(mediaEntry.relativePath);

    if (captionMap.has(relativePath)) {
      continue;
    }

    captionMap.set(relativePath, '');
    synchronizedEntries.push([relativePath, '']);
    addedKeys.push(relativePath);
  }

  const nextSource = renderCaptionMap(synchronizedEntries);

  if (nextSource !== currentSource) {
    await fs.writeFile(captionsPath, nextSource, 'utf8');

    if (sourceLabel !== 'local captions file') {
      console.log(`[sync:media] Synced captions from ${sourceLabel}.`);
    }
  }

  if (addedKeys.length > 0) {
    console.log(
      `[sync:media] Added ${addedKeys.length} new caption placeholder${addedKeys.length === 1 ? '' : 's'} in data/captions.json.`
    );
  }
}

async function fetchPublishedExifData() {
  if (!publishedExifUrl) {
    return null;
  }

  try {
    const requestUrl = new URL(publishedExifUrl);
    requestUrl.searchParams.set('_ts', Date.now().toString());

    const response = await fetch(requestUrl, {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });

    if (!response.ok) {
      console.warn(
        `[sync:media] Failed to fetch published EXIF data (${response.status} ${response.statusText}).`
      );
      return null;
    }

    const data = await response.json();

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return null;
    }

    return data;
  } catch (error) {
    console.warn(
      `[sync:media] Could not fetch published EXIF data: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

async function syncPhotoMetadataPlaceholders(photoEntries) {
  const currentSource = fsSync.existsSync(photoMetadataPath)
    ? await fs.readFile(photoMetadataPath, 'utf8')
    : '';
  const metadataEntries = currentSource
    ? parsePhotoMetadataMap(JSON.parse(currentSource))
    : [];
  const metadataMap = new Map(metadataEntries);
  const synchronizedEntries = [...metadataEntries];
  const addedKeys = [];

  // Fetch worker-published EXIF data from R2/CDN
  const publishedExif = await fetchPublishedExifData();
  let exifMergedCount = 0;

  for (const photoEntry of photoEntries) {
    const relativePath = normalizeRelativeKey(photoEntry.relativePath);

    if (metadataMap.has(relativePath)) {
      // Merge EXIF data into existing entry if it doesn't already have EXIF
      if (publishedExif && publishedExif[relativePath]) {
        const existing = metadataMap.get(relativePath);
        const exif = publishedExif[relativePath];
        let merged = false;

        for (const field of ['camera', 'lens', 'iso', 'shutterSpeed', 'aperture', 'focalLength']) {
          if (exif[field] !== undefined && existing[field] === undefined) {
            existing[field] = exif[field];
            merged = true;
          }
        }

        if (merged) {
          exifMergedCount++;
        }
      }

      continue;
    }

    // New photo — create placeholder, pre-fill with EXIF if available
    const entry = publishedExif && publishedExif[relativePath]
      ? { ...publishedExif[relativePath] }
      : {};

    metadataMap.set(relativePath, entry);
    synchronizedEntries.push([relativePath, entry]);
    addedKeys.push(relativePath);
  }

  const nextSource = renderPhotoMetadataMap(synchronizedEntries);

  if (nextSource !== currentSource) {
    await fs.writeFile(photoMetadataPath, nextSource, 'utf8');
  }

  if (addedKeys.length > 0) {
    console.log(
      `[sync:media] Added ${addedKeys.length} new photo metadata placeholder${addedKeys.length === 1 ? '' : 's'} in data/photoMetadata.json.`
    );
  }

  if (exifMergedCount > 0) {
    console.log(
      `[sync:media] Merged EXIF data into ${exifMergedCount} existing photo metadata ${exifMergedCount === 1 ? 'entry' : 'entries'}.`
    );
  }
}

async function writeSyncedMedia(manifest) {
  await fs.writeFile(manifestPath, renderManifest(manifest), 'utf8');
  await syncCaptionPlaceholders([...manifest.photos, ...manifest.videos]);
  await syncPhotoMetadataPlaceholders(manifest.photos);
}

function isManifestEntry(entry) {
  return (
    entry &&
    typeof entry === 'object' &&
    typeof entry.objectKey === 'string' &&
    typeof entry.relativePath === 'string' &&
    typeof entry.date === 'string'
  );
}

function validateManifest(manifest) {
  if (!(manifest && typeof manifest === 'object')) {
    throw new Error('Published media manifest response was not an object.');
  }

  if (!Array.isArray(manifest.photos) || !manifest.photos.every(isManifestEntry)) {
    throw new Error('Published media manifest photos payload was invalid.');
  }

  if (!Array.isArray(manifest.videos) || !manifest.videos.every(isManifestEntry)) {
    throw new Error('Published media manifest videos payload was invalid.');
  }

  return {
    generatedAt:
      typeof manifest.generatedAt === 'string'
        ? manifest.generatedAt
        : new Date().toISOString(),
    source: 'r2',
    photos: manifest.photos,
    videos: manifest.videos,
  };
}

async function fetchPublishedManifest() {
  if (!publishedManifestUrl) {
    return null;
  }

  const requestUrl = new URL(publishedManifestUrl);
  requestUrl.searchParams.set('_ts', Date.now().toString());

  const response = await fetch(requestUrl, {
    cache: 'no-store',
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Published media manifest request failed with ${response.status} ${response.statusText}`
    );
  }

  return validateManifest(await response.json());
}

async function fetchPublishedCaptions() {
  if (!publishedCaptionsUrl) {
    return null;
  }

  const requestUrl = new URL(publishedCaptionsUrl);
  requestUrl.searchParams.set('_ts', Date.now().toString());

  const response = await fetch(requestUrl, {
    cache: 'no-store',
    headers: {
      accept: 'application/json',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Published captions request failed with ${response.status} ${response.statusText}`
    );
  }

  return parseCaptionMap(await response.json());
}

async function fetchDirectCaptionEntries() {
  const source = await fetchSignedObjectText(captionsObjectKey);
  return source ? parseCaptionMap(JSON.parse(source)) : null;
}

function isManifestFreshEnough(observedGeneratedAt, expectedGeneratedAt) {
  if (!expectedGeneratedAt) {
    return true;
  }

  return (
    parseIsoTimestamp(observedGeneratedAt) >= parseIsoTimestamp(expectedGeneratedAt)
  );
}

async function waitForPublishedManifest(expectedGeneratedAt) {
  if (!expectedGeneratedAt) {
    return fetchPublishedManifest();
  }

  const timeoutMs =
    Number.isFinite(expectedPublishedWaitTimeoutMs) &&
    expectedPublishedWaitTimeoutMs > 0
      ? expectedPublishedWaitTimeoutMs
      : 90000;
  const pollMs =
    Number.isFinite(expectedPublishedWaitPollMs) && expectedPublishedWaitPollMs > 0
      ? expectedPublishedWaitPollMs
      : 1000;
  const deadline = Date.now() + timeoutMs;
  let lastObservedGeneratedAt = '';

  while (Date.now() <= deadline) {
    const manifest = await fetchPublishedManifest();
    lastObservedGeneratedAt = manifest.generatedAt;

    if (isManifestFreshEnough(manifest.generatedAt, expectedGeneratedAt)) {
      return manifest;
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  throw new Error(
    `Published media manifest did not reach generatedAt>=${expectedGeneratedAt} within ${timeoutMs}ms (last observed ${lastObservedGeneratedAt || 'missing'}).`
  );
}

function hasAnyR2Config() {
  return [
    bucketName,
    accountId,
    endpoint,
    accessKeyId,
    secretAccessKey,
  ].some(Boolean);
}

function hasRequiredR2Config() {
  return Boolean(bucketName && endpoint && accessKeyId && secretAccessKey);
}

function formatErrorWithCause(error) {
  const message = error instanceof Error ? error.message : String(error);
  const cause =
    error &&
    typeof error === 'object' &&
    'cause' in error &&
    error.cause instanceof Error
      ? ` Cause: ${error.cause.message}`
      : '';

  return `${message}${cause}`;
}

async function main() {
  if (publishedManifestUrl) {
    try {
      const manifest = await waitForPublishedManifest(
        expectedPublishedGeneratedAt
      );

      if (manifest) {
        await writeSyncedMedia(manifest);
        console.log(
          `[sync:media] Synced ${manifest.photos.length} photos and ${manifest.videos.length} videos from ${publishedManifestUrl} (generated ${manifest.generatedAt}${expectedPublishedGeneratedAt ? `, expected >= ${expectedPublishedGeneratedAt}` : ''}).`
        );
        return;
      }
    } catch (error) {
      if (!hasRequiredR2Config()) {
        throw error;
      }

      console.warn(
        `[sync:media] ${formatErrorWithCause(error)} Falling back to direct R2 sync.`
      );
    }
  }

  if (!hasAnyR2Config()) {
    console.log(
      '[sync:media] No R2 credentials configured. Keeping the existing media manifest.'
    );
    return;
  }

  if (!hasRequiredR2Config()) {
    throw new Error(
      'R2 sync requires R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and either R2_ENDPOINT or R2_ACCOUNT_ID.'
    );
  }

  const objects = await listBucketObjects();
  const { photos, thumbnailKeys } = buildPhotoAssets(objects);
  const excludedVideoKeys = new Set([
    ...photos.map((photo) => photo.objectKey),
    ...thumbnailKeys,
  ]);
  const videos = buildVideoAssets(objects, excludedVideoKeys);
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'r2',
    photos,
    videos,
  };

  await writeSyncedMedia(manifest);

  console.log(
    `[sync:media] Synced ${photos.length} photos and ${videos.length} videos.`
  );
}

function hasExistingManifest() {
  return fsSync.existsSync(manifestPath);
}

function shouldAllowExistingManifestFallback() {
  if (process.env.SYNC_MEDIA_ALLOW_FALLBACK === '1') {
    return true;
  }

  if (process.env.SYNC_MEDIA_ALLOW_FALLBACK === '0') {
    return false;
  }

  if (!expectedPublishedGeneratedAt) {
    return true;
  }

  return process.env.GITHUB_ACTIONS !== 'true';
}

main().catch((error) => {
  const message = formatErrorWithCause(error);

  if (hasExistingManifest() && shouldAllowExistingManifestFallback()) {
    console.warn(
      `[sync:media] ${message} Falling back to the existing media manifest.`
    );
    process.exit(0);
  }

  if (hasExistingManifest()) {
    console.error(
      `[sync:media] Existing media manifest fallback is disabled${expectedPublishedGeneratedAt ? ` (expected generatedAt >= ${expectedPublishedGeneratedAt})` : ''}.`
    );
  }

  console.error(`[sync:media] ${message}`);
  process.exit(1);
});
