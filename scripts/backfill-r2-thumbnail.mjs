#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

loadLocalEnvFiles();

const formatToExtension = {
  'image/avif': '.avif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const defaultBucketName =
  process.env.MEDIA_BUCKET_NAME?.trim() ||
  process.env.R2_BUCKET_NAME?.trim() ||
  'niazphotography-images';
const sourcePrefix = normalizePrefix(
  process.env.THUMB_SOURCE_PREFIX?.trim() ||
    process.env.R2_PHOTO_PREFIX?.trim() ||
    'photos-web'
);
const thumbPrefix = normalizePrefix(
  process.env.THUMB_DEST_PREFIX?.trim() ||
    process.env.R2_PHOTO_THUMB_PREFIX?.trim() ||
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
const githubRepository =
  process.env.GITHUB_REPOSITORY?.trim() || 'Ni4z/Ahmedclicks';
const githubWorkflowFile =
  process.env.GITHUB_WORKFLOW_FILE?.trim() || 'deploy.yml';
const githubDeployRef = process.env.GITHUB_DEPLOY_REF?.trim() || 'main';

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
  const trimmedValue = (value || '').trim().replace(/^\/+|\/+$/g, '');
  return trimmedValue ? `${trimmedValue}/` : '';
}

function normalizeRelativeKey(value) {
  return value.replace(/^\/+/, '').replace(/\\/g, '/');
}

function normalizeFormat(value) {
  const normalizedValue = value.trim().toLowerCase();
  return formatToExtension[normalizedValue] ? normalizedValue : 'image/webp';
}

function encodeObjectKeyForUrl(objectKey) {
  return normalizeRelativeKey(objectKey)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
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

function resolveSourceObjectKey(input) {
  const normalizedInput = normalizeRelativeKey(input.trim());

  if (!normalizedInput) {
    throw new Error('Provide a source image path like "Trees/mushroom.jpg".');
  }

  if (sourcePrefix && normalizedInput.startsWith(sourcePrefix)) {
    return normalizedInput;
  }

  return `${sourcePrefix}${normalizedInput}`;
}

function getThumbnailObjectKey(sourceObjectKey) {
  const relativePath = stripPrefix(sourceObjectKey, sourcePrefix);
  return `${thumbPrefix}${replaceExtension(relativePath, outputExtension)}`;
}

function printUsage() {
  console.log(
    [
      'Usage:',
      '  npm run thumbs:backfill -- <photo-relative-path> [--no-deploy]',
      '',
      'Examples:',
      '  npm run thumbs:backfill -- Trees/mushroom.jpg',
      '  npm run thumbs:backfill -- photos-web/Trees/mushroom.jpg --no-deploy',
    ].join('\n')
  );
}

function parseArgs(argv) {
  let sourcePath = '';
  let triggerDeploy = true;

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    if (arg === '--no-deploy') {
      triggerDeploy = false;
      continue;
    }

    if (!sourcePath) {
      sourcePath = arg;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!sourcePath) {
    printUsage();
    process.exit(1);
  }

  return {
    sourcePath,
    triggerDeploy,
  };
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    const details = [stderr, stdout].filter(Boolean).join('\n');

    throw new Error(
      `${command} ${args.join(' ')} failed${details ? `:\n${details}` : '.'}`
    );
  }

  return result;
}

async function fetchPublishedManifest() {
  if (!publishedManifestUrl) {
    throw new Error(
      'Published manifest URL is not configured. Set MEDIA_MANIFEST_URL, NEXT_PUBLIC_MEDIA_MANIFEST_URL, or PUBLIC_IMAGE_BASE_URL.'
    );
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
      `Published media manifest request failed with ${response.status} ${response.statusText}.`
    );
  }

  const manifest = await response.json();

  if (
    !(manifest && typeof manifest === 'object') ||
    !Array.isArray(manifest.photos) ||
    !Array.isArray(manifest.videos)
  ) {
    throw new Error('Published media manifest payload was invalid.');
  }

  return manifest;
}

async function updateManifest(sourceObjectKey, thumbnailObjectKey, tmpDir) {
  const manifest = await fetchPublishedManifest();
  const relativePath = stripPrefix(sourceObjectKey, sourcePrefix);
  const photoEntry = manifest.photos.find(
    (entry) =>
      entry?.objectKey === sourceObjectKey || entry?.relativePath === relativePath
  );

  if (!photoEntry) {
    throw new Error(
      `Photo ${relativePath} was not found in ${manifestObjectKey}. Publish the source image first, then rerun this backfill.`
    );
  }

  photoEntry.objectKey = sourceObjectKey;
  photoEntry.relativePath = relativePath;
  photoEntry.thumbnailObjectKey = thumbnailObjectKey;
  manifest.generatedAt = new Date().toISOString();
  manifest.source = 'r2';

  const manifestFilePath = path.join(tmpDir, path.basename(manifestObjectKey));
  await fs.writeFile(manifestFilePath, JSON.stringify(manifest, null, 2), 'utf8');

  runCommand('npx', [
    'wrangler',
    'r2',
    'object',
    'put',
    `${defaultBucketName}/${manifestObjectKey}`,
    '--remote',
    '--file',
    manifestFilePath,
    '--content-type',
    'application/json; charset=utf-8',
    '--cache-control',
    manifestCacheControl,
  ]);
}

async function triggerDeployWithToken() {
  const deployToken = process.env.GITHUB_DEPLOY_TOKEN?.trim();

  if (!deployToken) {
    return false;
  }

  const response = await fetch(
    `https://api.github.com/repos/${githubRepository}/actions/workflows/${encodeURIComponent(
      githubWorkflowFile
    )}/dispatches`,
    {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${deployToken}`,
        'content-type': 'application/json',
        'user-agent': 'niazphotography-thumbnail-backfill',
      },
      body: JSON.stringify({
        ref: githubDeployRef,
      }),
    }
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `GitHub deploy trigger failed with ${response.status} ${response.statusText}: ${responseText}`
    );
  }

  return true;
}

function triggerDeployWithGh() {
  const ghCheck = spawnSync('gh', ['auth', 'status'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (ghCheck.status !== 0) {
    return false;
  }

  runCommand('gh', [
    'workflow',
    'run',
    githubWorkflowFile,
    '--repo',
    githubRepository,
    '--ref',
    githubDeployRef,
  ]);

  return true;
}

async function triggerDeploy() {
  if (await triggerDeployWithToken()) {
    console.log(
      `[thumbs:backfill] Triggered ${githubWorkflowFile} on ${githubRepository}@${githubDeployRef} with GITHUB_DEPLOY_TOKEN.`
    );
    return;
  }

  try {
    if (triggerDeployWithGh()) {
      console.log(
        `[thumbs:backfill] Triggered ${githubWorkflowFile} on ${githubRepository}@${githubDeployRef} with GitHub CLI.`
      );
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[thumbs:backfill] ${message}`);
  }

  console.warn(
    `[thumbs:backfill] Manifest updated, but no deploy was triggered. Set GITHUB_DEPLOY_TOKEN locally or run the workflow manually.`
  );
}

async function generateThumbnail(sourceFilePath, thumbnailFilePath) {
  let pipeline = sharp(sourceFilePath).rotate().resize({
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

  await pipeline.toFile(thumbnailFilePath);
}

async function main() {
  const { sourcePath, triggerDeploy: shouldTriggerDeploy } = parseArgs(
    process.argv.slice(2)
  );

  const sourceObjectKey = resolveSourceObjectKey(sourcePath);
  const thumbnailObjectKey = getThumbnailObjectKey(sourceObjectKey);
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'thumb-backfill-'));
  const sourceFilePath = path.join(tmpDir, path.basename(sourceObjectKey));
  const thumbnailFilePath = path.join(tmpDir, path.basename(thumbnailObjectKey));

  try {
    runCommand('npx', [
      'wrangler',
      'r2',
      'object',
      'get',
      `${defaultBucketName}/${sourceObjectKey}`,
      '--remote',
      '--file',
      sourceFilePath,
    ]);
    await generateThumbnail(sourceFilePath, thumbnailFilePath);
    runCommand('npx', [
      'wrangler',
      'r2',
      'object',
      'put',
      `${defaultBucketName}/${thumbnailObjectKey}`,
      '--remote',
      '--file',
      thumbnailFilePath,
      '--content-type',
      outputFormat,
      '--cache-control',
      thumbCacheControl,
    ]);
    await updateManifest(sourceObjectKey, thumbnailObjectKey, tmpDir);

    console.log(
      `[thumbs:backfill] Uploaded ${thumbnailObjectKey} from ${sourceObjectKey}.`
    );

    if (shouldTriggerDeploy) {
      await triggerDeploy();
    }
  } finally {
    await fs.rm(tmpDir, { force: true, recursive: true });
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[thumbs:backfill] ${message}`);
  process.exit(1);
});
