#!/usr/bin/env node

import crypto from 'node:crypto';
import fsSync from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

loadLocalEnvFiles();

const emptyPayloadHash = crypto.createHash('sha256').update('').digest('hex');
const formatToExtension = {
  'image/avif': '.avif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

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
const photoThumbPrefix = normalizePrefix(
  process.env.R2_PHOTO_THUMB_PREFIX ||
    process.env.THUMB_DEST_PREFIX ||
    'photos-thumb'
);
const outputFormat = normalizeFormat(
  process.env.THUMB_OUTPUT_FORMAT?.trim() || 'image/webp'
);
const outputExtension = formatToExtension[outputFormat];
const maxWidth = Number(process.env.THUMB_MAX_WIDTH || 1200);
const maxHeight = Number(process.env.THUMB_MAX_HEIGHT || 1200);
const quality = Number(process.env.THUMB_QUALITY || 82);
const thumbCacheControl = `public, max-age=${process.env.THUMB_CACHE_MAX_AGE || 31536000}, immutable`;
const manifestObjectKey = normalizeRelativeKey(
  process.env.MEDIA_MANIFEST_OBJECT_KEY?.trim() || 'media-manifest.json'
);
const manifestCacheControl = `public, max-age=${process.env.MEDIA_MANIFEST_CACHE_MAX_AGE || 60}`;
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
const requestRetryCount = normalizePositiveInteger(
  process.env.THUMBS_HEAL_REQUEST_RETRY_COUNT,
  3
);
const requestRetryDelayMs = normalizePositiveInteger(
  process.env.THUMBS_HEAL_REQUEST_RETRY_DELAY_MS,
  1000
);

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

function normalizeRelativeKey(objectKey) {
  return objectKey.replace(/^\/+/, '').replace(/\\/g, '/');
}

function normalizeFormat(value) {
  const normalizedValue = value.trim().toLowerCase();
  return formatToExtension[normalizedValue] ? normalizedValue : 'image/webp';
}

function normalizePositiveInteger(value, fallback) {
  const parsedValue = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
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

function formatErrorMessage(error) {
  if (error instanceof Error) {
    const parts = [error.message];

    if (error.cause instanceof Error && error.cause.message) {
      parts.push(`Cause: ${error.cause.message}`);
    }

    return parts.join(' ');
  }

  return String(error);
}

function createError(message, options = {}) {
  const error = options.cause
    ? new Error(message, { cause: options.cause })
    : new Error(message);

  if (options.retryable !== undefined) {
    error.retryable = options.retryable;
  }

  return error;
}

function isRetryableStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function isRetryableError(error) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'retryable' in error &&
      error.retryable === true
  );
}

function sleep(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function withRetries(runRequest, description) {
  for (let attempt = 1; attempt <= requestRetryCount; attempt += 1) {
    try {
      return await runRequest();
    } catch (error) {
      if (!isRetryableError(error) || attempt >= requestRetryCount) {
        throw error;
      }

      const delayMs = requestRetryDelayMs * attempt;
      console.warn(
        `[thumbs:heal] ${description} failed on attempt ${attempt}/${requestRetryCount}: ${formatErrorMessage(error)} Retrying in ${delayMs}ms.`
      );
      await sleep(delayMs);
    }
  }

  throw createError(`${description} failed after ${requestRetryCount} attempts.`);
}

async function fetchWithContext(url, options, description) {
  try {
    return await fetch(url, options);
  } catch (error) {
    throw createError(
      `${description} request failed for ${url instanceof URL ? url.toString() : String(url)}.`,
      {
        cause: error instanceof Error ? error : undefined,
        retryable: true,
      }
    );
  }
}

function signRequest(url, options = {}) {
  const {
    method = 'GET',
    body = null,
    contentType = '',
    cacheControl = '',
  } = options;
  const requestDate = new Date();
  const amzDate = requestDate
    .toISOString()
    .replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = body
    ? crypto.createHash('sha256').update(body).digest('hex')
    : emptyPayloadHash;
  const canonicalQueryString = canonicalizeQuery(url.searchParams);
  const signedHeaderEntries = [
    ['host', url.host],
    ['x-amz-content-sha256', payloadHash],
    ['x-amz-date', amzDate],
  ];

  if (contentType) {
    signedHeaderEntries.push(['content-type', contentType]);
  }

  if (cacheControl) {
    signedHeaderEntries.push(['cache-control', cacheControl]);
  }

  signedHeaderEntries.sort(([firstKey], [secondKey]) =>
    firstKey.localeCompare(secondKey)
  );

  const canonicalHeaders = signedHeaderEntries
    .map(([key, value]) => `${key}:${value}`)
    .join('\n');
  const signedHeaders = signedHeaderEntries.map(([key]) => key).join(';');
  const canonicalRequest = [
    method,
    canonicalizePathname(url.pathname),
    canonicalQueryString,
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
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
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      ...(contentType ? { 'content-type': contentType } : {}),
      ...(cacheControl ? { 'cache-control': cacheControl } : {}),
    },
  };
}

function stripPrefix(objectKey, prefix) {
  return prefix && objectKey.startsWith(prefix)
    ? objectKey.slice(prefix.length)
    : objectKey;
}

function replaceExtension(filePath, extension) {
  const normalizedPath = normalizeRelativeKey(filePath);
  const extensionIndex = normalizedPath.lastIndexOf('.');
  const lastSlashIndex = normalizedPath.lastIndexOf('/');

  if (extensionIndex <= lastSlashIndex) {
    return `${normalizedPath}${extension}`;
  }

  return `${normalizedPath.slice(0, extensionIndex)}${extension}`;
}

function getThumbnailObjectKey(photoObjectKey) {
  const relativePath = stripPrefix(normalizeRelativeKey(photoObjectKey), photoPrefix);
  return `${photoThumbPrefix}${replaceExtension(relativePath, outputExtension)}`;
}

function createObjectUrl(objectKey) {
  return new URL(`${endpoint}/${bucketName}/${encodeObjectKeyForUrl(objectKey)}`);
}

async function requestSignedObject(objectKey, options = {}) {
  const { method = 'GET', body = null, contentType = '', cacheControl = '' } = options;

  return withRetries(async () => {
    const requestUrl = createObjectUrl(objectKey);
    const response = await fetchWithContext(requestUrl, {
      method,
      headers: signRequest(requestUrl, {
        method,
        body,
        contentType,
        cacheControl,
      }).headers,
      ...(body ? { body } : {}),
    }, `R2 ${method}`);

    if (!response.ok) {
      const responseText = await response.text();
      throw createError(
        `R2 ${method} ${objectKey} failed with ${response.status} ${response.statusText}: ${responseText}`,
        { retryable: isRetryableStatus(response.status) }
      );
    }

    return response;
  }, `R2 ${method} ${objectKey}`);
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

    const response = await withRetries(async () => {
      const listingResponse = await fetchWithContext(requestUrl, {
        headers: signRequest(requestUrl).headers,
        method: 'GET',
      }, 'R2 bucket listing');

      if (!listingResponse.ok) {
        const responseText = await listingResponse.text();
        throw createError(
          `R2 object listing failed with ${listingResponse.status} ${listingResponse.statusText}: ${responseText}`,
          { retryable: isRetryableStatus(listingResponse.status) }
        );
      }

      return listingResponse;
    }, 'R2 bucket listing');

    const payload = parseListBucketXml(await response.text());
    collectedItems.push(...payload.items);
    continuationToken = payload.isTruncated
      ? payload.nextContinuationToken
      : '';
  } while (continuationToken);

  return collectedItems;
}

async function fetchPublishedManifest() {
  if (!publishedManifestUrl) {
    throw createError(
      'Published manifest URL is not configured. Set MEDIA_MANIFEST_URL, NEXT_PUBLIC_MEDIA_MANIFEST_URL, or NEXT_PUBLIC_IMAGE_BASE_URL.'
    );
  }

  return withRetries(async () => {
    const requestUrl = new URL(publishedManifestUrl);
    requestUrl.searchParams.set('_ts', Date.now().toString());

    const response = await fetchWithContext(requestUrl, {
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    }, 'Published manifest');

    if (!response.ok) {
      throw createError(
        `Published media manifest request failed with ${response.status} ${response.statusText}.`,
        { retryable: isRetryableStatus(response.status) }
      );
    }

    const manifest = await response.json();

    if (
      !(manifest && typeof manifest === 'object') ||
      !Array.isArray(manifest.photos) ||
      !Array.isArray(manifest.videos)
    ) {
      throw createError('Published media manifest payload was invalid.');
    }

    return manifest;
  }, 'Published manifest');
}

async function publishManifest(manifest) {
  const body = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');

  await requestSignedObject(manifestObjectKey, {
    method: 'PUT',
    body,
    contentType: 'application/json; charset=utf-8',
    cacheControl: manifestCacheControl,
  });
}

async function waitForManifestUpdate(expectedThumbnailKeys, generatedAt) {
  if (!publishedManifestUrl) {
    return;
  }

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const manifest = await fetchPublishedManifest();
    const hasGeneratedAt = manifest.generatedAt === generatedAt;
    const hasAllThumbnails = expectedThumbnailKeys.every(({ relativePath, thumbnailObjectKey }) =>
      manifest.photos.some(
        (entry) =>
          entry.relativePath === relativePath &&
          entry.thumbnailObjectKey === thumbnailObjectKey
      )
    );

    if (hasGeneratedAt && hasAllThumbnails) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(
    'Updated media manifest did not become visible on the public URL within 20 seconds.'
  );
}

async function generateThumbnailBuffer(sourceBuffer) {
  let pipeline = sharp(sourceBuffer).rotate().resize({
    width: maxWidth,
    height: maxHeight,
    fit: 'inside',
    withoutEnlargement: true,
  });

  switch (outputFormat) {
    case 'image/avif':
      pipeline = pipeline.avif({ quality });
      break;
    case 'image/jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'image/png':
      pipeline = pipeline.png({ quality });
      break;
    default:
      pipeline = pipeline.webp({ quality });
      break;
  }

  return pipeline.toBuffer();
}

function hasRequiredConfig() {
  return Boolean(
    bucketName &&
      endpoint &&
      accessKeyId &&
      secretAccessKey &&
      publishedManifestUrl
  );
}

function shouldFailOnError() {
  return process.env.GITHUB_ACTIONS !== 'true' || process.env.THUMBS_HEAL_STRICT === '1';
}

async function main() {
  if (process.env.GITHUB_ACTIONS !== 'true' && process.env.THUMBS_HEAL_FORCE !== '1') {
    console.log(
      '[thumbs:heal] Skipping outside GitHub Actions. Use npm run thumbs:backfill for local one-off repairs.'
    );
    return;
  }

  if (!hasRequiredConfig()) {
    console.log(
      '[thumbs:heal] Missing R2 or manifest configuration. Skipping automatic thumbnail healing.'
    );
    return;
  }

  const [manifest, objects] = await Promise.all([
    fetchPublishedManifest(),
    listBucketObjects(),
  ]);
  const existingKeys = new Set(objects.map((object) => normalizeRelativeKey(object.key)));
  const photosToHeal = manifest.photos.filter((photo) => {
    if (!(photo && typeof photo.objectKey === 'string' && typeof photo.relativePath === 'string')) {
      return false;
    }

    const currentThumbnailObjectKey =
      typeof photo.thumbnailObjectKey === 'string' && photo.thumbnailObjectKey
        ? normalizeRelativeKey(photo.thumbnailObjectKey)
        : '';

    return !currentThumbnailObjectKey || !existingKeys.has(currentThumbnailObjectKey);
  });

  if (photosToHeal.length === 0) {
    console.log('[thumbs:heal] No missing thumbnails detected.');
    return;
  }

  const healedEntries = [];

  for (const photo of photosToHeal) {
    const sourceObjectKey = normalizeRelativeKey(photo.objectKey);
    const thumbnailObjectKey = getThumbnailObjectKey(sourceObjectKey);
    const sourceResponse = await requestSignedObject(sourceObjectKey);
    const sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer());
    const thumbnailBuffer = await generateThumbnailBuffer(sourceBuffer);

    await requestSignedObject(thumbnailObjectKey, {
      method: 'PUT',
      body: thumbnailBuffer,
      contentType: outputFormat,
      cacheControl: thumbCacheControl,
    });

    photo.thumbnailObjectKey = thumbnailObjectKey;
    healedEntries.push({
      relativePath: photo.relativePath,
      thumbnailObjectKey,
    });

    console.log(
      `[thumbs:heal] Backfilled ${thumbnailObjectKey} from ${sourceObjectKey}.`
    );
  }

  manifest.generatedAt = new Date().toISOString();
  manifest.source = 'r2';

  await publishManifest(manifest);
  await waitForManifestUpdate(healedEntries, manifest.generatedAt);
  console.log(
    `[thumbs:heal] Published healed manifest with ${healedEntries.length} backfilled thumbnail${healedEntries.length === 1 ? '' : 's'}.`
  );
}

main().catch((error) => {
  const message = formatErrorMessage(error);

  if (!shouldFailOnError()) {
    console.warn(
      `[thumbs:heal] ${message} Skipping automatic thumbnail healing for this build.`
    );
    process.exit(0);
  }

  console.error(`[thumbs:heal] ${message}`);
  process.exit(1);
});
