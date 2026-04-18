#!/usr/bin/env node

/**
 * Extract EXIF data from photos in R2 and store in photoMetadata.json.
 *
 * Usage:
 *   node scripts/extract-exif.mjs                  # Process all photos missing EXIF
 *   node scripts/extract-exif.mjs --force           # Re-extract for all photos
 *   node scripts/extract-exif.mjs --path "wildlife/Robin on Perch.jpg"  # Single photo
 *
 * Requires R2 credentials in .env.local or environment variables.
 * Falls back to reading from the public image URL if R2 is not configured.
 */

import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

loadLocalEnvFiles();

const emptyPayloadHash = crypto.createHash('sha256').update('').digest('hex');

const bucketName = process.env.R2_BUCKET_NAME?.trim() || '';
const accountId = process.env.R2_ACCOUNT_ID?.trim() || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || '';
const region = process.env.R2_REGION?.trim() || 'auto';
const endpoint = (
  process.env.R2_ENDPOINT?.trim() ||
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '')
).replace(/\/+$/, '');
const photoPrefix = normalizePrefix(
  process.env.R2_PHOTO_PREFIX?.trim() || 'photos-web'
);
const publicImageBaseUrl = (
  process.env.PUBLIC_IMAGE_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim() ||
  ''
).replace(/\/+$/, '');

const photoMetadataPath = path.join(process.cwd(), 'data', 'photoMetadata.json');
const photoMetadataReadme =
  'Add photo organization metadata by relative path. Use tags, series, location, and year to keep the gallery browsable as it grows. New photo placeholders are added automatically during media sync.';

// --- CLI args ---
const args = process.argv.slice(2);
const forceAll = args.includes('--force');
const singlePathIndex = args.indexOf('--path');
const singlePath =
  singlePathIndex !== -1 ? args[singlePathIndex + 1]?.trim() : null;

// --- Helpers ---

function loadLocalEnvFiles() {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = path.join(process.cwd(), fileName);
    if (!fsSync.existsSync(filePath)) continue;
    const source = fsSync.readFileSync(filePath, 'utf8');
    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) continue;
      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();
      if (!key || process.env[key] !== undefined) continue;
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
  const trimmedValue = (value || '').trim().replace(/^\/+|\/+$/g, '');
  return trimmedValue ? `${trimmedValue}/` : '';
}

function normalizeRelativeKey(value) {
  return value.replace(/^\/+/, '').replace(/\\/g, '/');
}

function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function encodeObjectKeyForUrl(objectKey) {
  return normalizeRelativeKey(objectKey)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function canonicalizePathname(pathname) {
  const segments = pathname.split('/').map((segment) => encodeRfc3986(segment));
  if (pathname.startsWith('/')) segments[0] = '';
  return segments.join('/');
}

function canonicalizeQuery(searchParams) {
  return [...searchParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join('&');
}

function hmac(key, value) {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest();
}

function signRequest(url, method = 'GET') {
  const requestDate = new Date();
  const amzDate = requestDate.toISOString().replace(/[:-]|\.\d{3}/g, '');
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
    hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), region), 's3'),
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

function hasRequiredR2Config() {
  return Boolean(bucketName && endpoint && accessKeyId && secretAccessKey);
}

// --- EXIF Extraction ---

async function fetchImageBuffer(relativePath) {
  const objectKey = `${photoPrefix}${relativePath}`;

  // Try R2 signed request first
  if (hasRequiredR2Config()) {
    try {
      const requestUrl = new URL(
        `${endpoint}/${bucketName}/${encodeObjectKeyForUrl(objectKey)}`
      );
      // Only fetch the first 128KB – enough for EXIF headers
      const response = await fetch(requestUrl, {
        headers: {
          ...signRequest(requestUrl).headers,
          range: 'bytes=0-131071',
        },
        method: 'GET',
      });

      if (response.ok || response.status === 206) {
        return Buffer.from(await response.arrayBuffer());
      }

      console.warn(
        `[exif] R2 fetch failed for ${relativePath}: ${response.status}`
      );
    } catch (error) {
      // R2 not reachable, fall through to public URL
    }
  }

  // Fallback to public URL
  if (publicImageBaseUrl) {
    const publicUrl = `${publicImageBaseUrl}/${encodeObjectKeyForUrl(objectKey)}`;
    const response = await fetch(publicUrl, {
      headers: { range: 'bytes=0-131071' },
    });

    if (response.ok || response.status === 206) {
      return Buffer.from(await response.arrayBuffer());
    }

    console.warn(
      `[exif] Public URL fetch failed for ${relativePath}: ${response.status}`
    );
  }

  return null;
}

function formatExposureTime(value) {
  if (!value) return undefined;

  // value might be a fraction like [1, 250] or a number
  if (Array.isArray(value)) {
    const [num, den] = value;
    if (den === 1) return `${num}s`;
    return `${num}/${den}s`;
  }

  if (typeof value === 'number') {
    if (value >= 1) return `${value}s`;
    const denominator = Math.round(1 / value);
    return `1/${denominator}s`;
  }

  if (typeof value === 'string') return value;
  return undefined;
}

function formatFNumber(value) {
  if (!value) return undefined;

  if (typeof value === 'number') {
    return `f/${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}`;
  }

  if (typeof value === 'string') {
    if (value.startsWith('f/') || value.startsWith('F/')) return value;
    return `f/${value}`;
  }

  return undefined;
}

function formatFocalLength(value) {
  if (!value) return undefined;

  if (typeof value === 'number') {
    return `${Math.round(value)}mm`;
  }

  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (!isNaN(num)) return `${Math.round(num)}mm`;
    return value;
  }

  return undefined;
}

function extractExifTag(tags, ...keys) {
  for (const key of keys) {
    const tag = tags[key];
    if (tag) {
      // ExifReader returns objects with .value and .description
      if (tag.description !== undefined && tag.description !== '') {
        return tag.description;
      }
      if (tag.value !== undefined && tag.value !== '') {
        return tag.value;
      }
    }
  }
  return undefined;
}

async function extractExifData(relativePath) {
  const buffer = await fetchImageBuffer(relativePath);
  if (!buffer) {
    console.warn(`[exif] Could not fetch image data for ${relativePath}`);
    return null;
  }

  try {
    // Dynamic import since exifreader is ESM-compatible
    const { default: ExifReader } = await import('exifreader');
    const tags = ExifReader.load(buffer, { expanded: false });

    const camera = extractExifTag(tags, 'Model', 'UniqueCameraModel');
    const make = extractExifTag(tags, 'Make');
    const lens = extractExifTag(tags, 'LensModel', 'Lens');
    const isoRaw = extractExifTag(tags, 'ISOSpeedRatings', 'PhotographicSensitivity', 'ISO');
    const shutterRaw = extractExifTag(tags, 'ExposureTime', 'ShutterSpeedValue');
    const apertureRaw = extractExifTag(tags, 'FNumber', 'ApertureValue');
    const focalLengthRaw = extractExifTag(tags, 'FocalLength', 'FocalLengthIn35mmFilm');

    const exif = {};

    if (camera) {
      // Combine make + model if make isn't already in model
      const cameraStr = String(camera).trim();
      const makeStr = make ? String(make).trim() : '';
      exif.camera =
        makeStr && !cameraStr.toLowerCase().startsWith(makeStr.toLowerCase())
          ? `${makeStr} ${cameraStr}`
          : cameraStr;
    }

    if (lens) {
      exif.lens = String(lens).trim();
    }

    if (isoRaw !== undefined) {
      const isoNum = typeof isoRaw === 'number' ? isoRaw : parseInt(String(isoRaw), 10);
      if (!isNaN(isoNum)) exif.iso = isoNum;
    }

    if (shutterRaw !== undefined) {
      const formatted = formatExposureTime(shutterRaw);
      if (formatted) exif.shutterSpeed = formatted;
    }

    if (apertureRaw !== undefined) {
      const formatted = formatFNumber(apertureRaw);
      if (formatted) exif.aperture = formatted;
    }

    if (focalLengthRaw !== undefined) {
      const formatted = formatFocalLength(focalLengthRaw);
      if (formatted) exif.focalLength = formatted;
    }

    return Object.keys(exif).length > 0 ? exif : null;
  } catch (error) {
    console.warn(
      `[exif] Failed to parse EXIF for ${relativePath}: ${error.message}`
    );
    return null;
  }
}

// --- Metadata file operations ---

function loadPhotoMetadata() {
  if (!fsSync.existsSync(photoMetadataPath)) {
    return {};
  }
  return JSON.parse(fsSync.readFileSync(photoMetadataPath, 'utf8'));
}

function getPhotoRelativePaths(metadata) {
  return Object.keys(metadata).filter((key) => !key.startsWith('_'));
}

function hasExifData(entry) {
  if (!entry || typeof entry !== 'object') return false;
  return Boolean(
    entry.camera || entry.lens || entry.iso || entry.shutterSpeed || entry.aperture || entry.focalLength
  );
}

async function savePhotoMetadata(metadata) {
  await fs.writeFile(
    photoMetadataPath,
    JSON.stringify(metadata, null, 2) + '\n',
    'utf8'
  );
}

// --- Main ---

async function main() {
  console.log('[exif] Starting EXIF extraction...');

  const metadata = loadPhotoMetadata();
  const allPaths = getPhotoRelativePaths(metadata);

  let pathsToProcess;

  if (singlePath) {
    const normalized = normalizeRelativeKey(singlePath);
    if (!allPaths.includes(normalized)) {
      console.error(`[exif] Photo not found in metadata: ${normalized}`);
      console.log('[exif] Available paths (first 10):');
      allPaths.slice(0, 10).forEach((p) => console.log(`  ${p}`));
      process.exit(1);
    }
    pathsToProcess = [normalized];
  } else if (forceAll) {
    pathsToProcess = allPaths;
  } else {
    pathsToProcess = allPaths.filter((p) => !hasExifData(metadata[p]));
  }

  if (pathsToProcess.length === 0) {
    console.log('[exif] All photos already have EXIF data. Use --force to re-extract.');
    return;
  }

  console.log(`[exif] Processing ${pathsToProcess.length} photo(s)...`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const relativePath of pathsToProcess) {
    process.stdout.write(`[exif] ${relativePath}... `);

    const exif = await extractExifData(relativePath);

    if (!exif) {
      console.log('no EXIF data found');
      skipCount++;
      continue;
    }

    // Merge EXIF into existing metadata (preserving tags, series, location, year)
    const existing = metadata[relativePath] || {};
    metadata[relativePath] = {
      ...existing,
      ...exif,
    };

    console.log(
      `${[
        exif.camera && `camera: ${exif.camera}`,
        exif.lens && `lens: ${exif.lens}`,
        exif.focalLength && `focal: ${exif.focalLength}`,
        exif.aperture && `aperture: ${exif.aperture}`,
        exif.shutterSpeed && `shutter: ${exif.shutterSpeed}`,
        exif.iso && `ISO: ${exif.iso}`,
      ]
        .filter(Boolean)
        .join(', ')}`
    );

    successCount++;
  }

  await savePhotoMetadata(metadata);

  console.log(
    `\n[exif] Done. ${successCount} extracted, ${skipCount} skipped, ${failCount} failed.`
  );
}

main().catch((error) => {
  console.error(`[exif] Fatal error: ${error.message}`);
  process.exit(1);
});
