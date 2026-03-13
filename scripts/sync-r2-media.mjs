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
const manifestObjectKey = normalizeRelativeKey(
  process.env.MEDIA_MANIFEST_OBJECT_KEY?.trim() || 'media-manifest.json'
);
const publicImageBaseUrl = (
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

async function main() {
  if (publishedManifestUrl) {
    const manifest = await fetchPublishedManifest();

    if (manifest) {
      await fs.writeFile(manifestPath, renderManifest(manifest), 'utf8');
      console.log(
        `[sync:media] Synced ${manifest.photos.length} photos and ${manifest.videos.length} videos from ${publishedManifestUrl} (generated ${manifest.generatedAt}).`
      );
      return;
    }
  }

  const hasAnyR2Config = [
    bucketName,
    accountId,
    endpoint,
    accessKeyId,
    secretAccessKey,
  ].some(Boolean);

  if (!hasAnyR2Config) {
    console.log(
      '[sync:media] No R2 credentials configured. Keeping the existing media manifest.'
    );
    return;
  }

  if (!(bucketName && endpoint && accessKeyId && secretAccessKey)) {
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

  await fs.writeFile(manifestPath, renderManifest(manifest), 'utf8');

  console.log(
    `[sync:media] Synced ${photos.length} photos and ${videos.length} videos.`
  );
}

function hasExistingManifest() {
  return fsSync.existsSync(manifestPath);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  const cause =
    error &&
    typeof error === 'object' &&
    'cause' in error &&
    error.cause instanceof Error
      ? ` Cause: ${error.cause.message}`
      : '';

  if (hasExistingManifest()) {
    console.warn(
      `[sync:media] ${message}${cause} Falling back to the existing media manifest.`
    );
    process.exit(0);
  }

  console.error(`[sync:media] ${message}${cause}`);
  process.exit(1);
});
