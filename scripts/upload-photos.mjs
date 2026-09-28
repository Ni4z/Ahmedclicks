#!/usr/bin/env node

// Uploads photos to R2 without ever replacing an existing one: a name that is
// already taken in the folder (case-insensitive, any extension) gets "-2", "-3", ...

import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getRelativeStem } from './lib/rendition-keys.mjs';

loadLocalEnvFiles();

const contentTypes = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
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
const photoPrefix = normalizePrefix(process.env.R2_PHOTO_PREFIX?.trim() || 'photos-web');

function loadLocalEnvFiles() {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = path.join(process.cwd(), fileName);

    if (!fsSync.existsSync(filePath)) {
      continue;
    }

    for (const rawLine of fsSync.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      const separatorIndex = line.indexOf('=');

      if (!line || line.startsWith('#') || separatorIndex === -1) {
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

function isSupportedImage(filePath) {
  return Object.hasOwn(contentTypes, path.extname(filePath).toLowerCase());
}

// "Urban Decay .png", "urban decay.JPG" and "Urban  Decay.jpg" all count as the same name.
function getNameKey(relativePath) {
  return getRelativeStem(relativePath).replace(/\s+/g, ' ').trim().toLowerCase();
}

function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function encodeObjectKeyForUrl(objectKey) {
  return objectKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hmac(key, value) {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest();
}

function decodeXmlEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&amp;/g, '&');
}

function readXmlTag(source, tagName) {
  const match = source.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`));
  return match ? decodeXmlEntities(match[1].trim()) : '';
}

function signedHeaders(url, method, payloadHash, extraHeaders = {}) {
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const headers = {
    host: url.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...extraHeaders,
  };
  const headerNames = Object.keys(headers).sort();
  const canonicalQuery = [...url.searchParams.entries()]
    .sort(([firstKey, firstValue], [secondKey, secondValue]) =>
      firstKey === secondKey
        ? firstValue.localeCompare(secondValue)
        : firstKey.localeCompare(secondKey)
    )
    .map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
    .join('&');
  const canonicalRequest = [
    method,
    url.pathname
      .split('/')
      .map((segment) => encodeRfc3986(decodeURIComponent(segment)))
      .join('/'),
    canonicalQuery,
    `${headerNames.map((name) => `${name}:${headers[name]}`).join('\n')}\n`,
    headerNames.join(';'),
    payloadHash,
  ].join('\n');
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), region), 's3'),
    'aws4_request'
  );
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(
      ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n'),
      'utf8'
    )
    .digest('hex');
  const requestHeaders = { ...headers };
  delete requestHeaders.host;

  return {
    ...requestHeaders,
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${headerNames.join(';')}, Signature=${signature}`,
  };
}

async function listExistingPhotos() {
  const photos = [];
  let continuationToken = '';

  do {
    const url = new URL(`${endpoint}/${bucketName}`);
    url.searchParams.set('list-type', '2');
    url.searchParams.set('prefix', photoPrefix);

    if (continuationToken) {
      url.searchParams.set('continuation-token', continuationToken);
    }

    const response = await fetch(url, {
      headers: signedHeaders(url, 'GET', sha256Hex('')),
    });
    const xml = await response.text();

    if (!response.ok) {
      throw new Error(`Listing ${bucketName}/${photoPrefix} failed with ${response.status} ${response.statusText}: ${xml.slice(0, 200)}`);
    }

    for (const [, block] of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = readXmlTag(block, 'Key');

      if (isSupportedImage(key)) {
        photos.push({
          relativePath: key.slice(photoPrefix.length),
          etag: readXmlTag(block, 'ETag').replace(/"/g, '').toLowerCase(),
        });
      }
    }

    continuationToken =
      readXmlTag(xml, 'IsTruncated') === 'true'
        ? readXmlTag(xml, 'NextContinuationToken')
        : '';
  } while (continuationToken);

  return photos;
}

async function uploadIfAbsent(relativePath, body, contentType) {
  const url = new URL(`${endpoint}/${bucketName}/${encodeObjectKeyForUrl(`${photoPrefix}${relativePath}`)}`);
  const response = await fetch(url, {
    method: 'PUT',
    headers: signedHeaders(url, 'PUT', sha256Hex(body), {
      'content-type': contentType,
      'if-none-match': '*',
    }),
    body,
  });

  if (response.status === 412) {
    return false;
  }

  if (!response.ok) {
    throw new Error(`Upload of ${relativePath} failed with ${response.status} ${response.statusText}: ${(await response.text()).slice(0, 200)}`);
  }

  return true;
}

function printUsage() {
  console.log(
    [
      'Usage:',
      '  npm run photo:upload -- <gallery-folder> <image-or-folder>... [--dry-run]',
      '',
      'Examples:',
      '  npm run photo:upload -- wildlife "C:\\Exports\\DSC05063.jpg"',
      '  npm run photo:upload -- landscape "C:\\Exports\\Alps trip"',
      '  npm run photo:upload -- wildlife "C:\\Exports\\Robin.jpg" --dry-run',
      '',
      'Existing photos are never replaced. If the name is taken in that folder',
      '(any letter case or extension), the upload is saved as "Name-2.jpg", "Name-3.jpg", ...',
      'Files already uploaded with identical content are skipped.',
    ].join('\n')
  );
}

function parseArgs(argv) {
  const positional = [];
  let dryRun = false;

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positional.push(arg);
  }

  const [folderInput, ...inputs] = positional;

  if (!folderInput || inputs.length === 0) {
    printUsage();
    process.exit(1);
  }

  const folderSegments = folderInput
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (folderSegments.length === 0 || folderSegments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error(`Invalid gallery folder: "${folderInput}". Use a folder like "wildlife" or "landscape".`);
  }

  return { folderSegments, inputs, dryRun };
}

async function collectImageFiles(inputs) {
  const files = [];

  for (const input of inputs) {
    const resolvedPath = path.resolve(input);
    const stats = await fs.stat(resolvedPath).catch(() => null);

    if (!stats) {
      throw new Error(`File or folder not found: ${input}`);
    }

    if (stats.isDirectory()) {
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      files.push(
        ...entries
          .filter((entry) => entry.isFile() && isSupportedImage(entry.name))
          .map((entry) => path.join(resolvedPath, entry.name))
          .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))
      );
    } else if (isSupportedImage(resolvedPath)) {
      files.push(resolvedPath);
    } else {
      throw new Error(`Not a supported image (${Object.keys(contentTypes).join(', ')}): ${input}`);
    }
  }

  return [...new Set(files)];
}

function matchExistingFolder(folderSegments, existingPaths) {
  const [firstSegment, ...rest] = folderSegments;
  const existingFolder = existingPaths
    .map((relativePath) => relativePath.split('/')[0])
    .find((folder) => folder.toLowerCase() === firstSegment.toLowerCase());

  return [existingFolder || firstSegment, ...rest].join('/');
}

function chooseFreeName(folder, fileStem, extension, takenStems) {
  for (let counter = 1; counter <= 999; counter += 1) {
    const candidate = `${folder}/${counter === 1 ? fileStem : `${fileStem}-${counter}`}${extension}`;

    if (!takenStems.has(getNameKey(candidate))) {
      return candidate;
    }
  }

  throw new Error(`No free name found for ${folder}/${fileStem}${extension}.`);
}

async function main() {
  const { folderSegments, inputs, dryRun } = parseArgs(process.argv.slice(2));

  if (!(bucketName && endpoint && accessKeyId && secretAccessKey)) {
    throw new Error(
      'Missing R2 settings. Set R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ACCOUNT_ID (or R2_ENDPOINT) in .env.local.'
    );
  }

  const files = await collectImageFiles(inputs);

  if (files.length === 0) {
    throw new Error('No supported images found in the given paths.');
  }

  const existingPhotos = await listExistingPhotos();
  const folder = matchExistingFolder(folderSegments, existingPhotos.map((photo) => photo.relativePath));
  const takenStems = new Set(
    existingPhotos.map((photo) => getNameKey(photo.relativePath))
  );
  const pathByEtag = new Map(existingPhotos.map((photo) => [photo.etag, photo.relativePath]));
  const uploadedPaths = [];

  if (folder !== folderSegments.join('/')) {
    console.log(`[photo:upload] Using existing folder "${folder}".`);
  }

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const body = await fs.readFile(filePath);
    const duplicateOf = pathByEtag.get(crypto.createHash('md5').update(body).digest('hex'));

    if (duplicateOf) {
      console.log(`[photo:upload] Skipped ${fileName}: identical photo already uploaded as "${duplicateOf}".`);
      continue;
    }

    const extension = path.extname(fileName);
    const fileStem = path.basename(fileName, extension).trim().replace(/\s+/g, ' ');
    const contentType = contentTypes[extension.toLowerCase()];
    let relativePath = chooseFreeName(folder, fileStem, extension, takenStems);

    if (!dryRun) {
      // If-None-Match makes R2 refuse the write if another upload claimed the name in the meantime.
      while (!(await uploadIfAbsent(relativePath, body, contentType))) {
        takenStems.add(getNameKey(relativePath));
        relativePath = chooseFreeName(folder, fileStem, extension, takenStems);
      }
    }

    takenStems.add(getNameKey(relativePath));
    uploadedPaths.push(relativePath);

    const uploadedName = path.posix.basename(relativePath);
    const note =
      uploadedName !== `${fileStem}${extension}`
        ? ' (renamed: that name is already used in this folder)'
        : uploadedName !== fileName
          ? ' (extra spaces removed from the name)'
          : '';
    console.log(
      `[photo:upload] ${dryRun ? 'Would upload' : 'Uploaded'} ${fileName} -> ${relativePath}${note}`
    );
  }

  if (uploadedPaths.length === 0) {
    console.log('[photo:upload] Nothing to upload.');
    return;
  }

  if (dryRun) {
    console.log(`[photo:upload] Dry run only: ${uploadedPaths.length} photo(s) would be uploaded. Run again without --dry-run to upload.`);
    return;
  }

  console.log(
    [
      `[photo:upload] Uploaded ${uploadedPaths.length} photo(s). The media worker now creates thumbnails and redeploys the site (usually a few minutes).`,
      'Add a caption with:',
      `  npm run caption:set -- "${uploadedPaths[0]}" "Your caption"`,
    ].join('\n')
  );
}

main().catch((error) => {
  console.error(`[photo:upload] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
