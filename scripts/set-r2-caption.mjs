#!/usr/bin/env node

import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

loadLocalEnvFiles();

const captionsReadme =
  'Add a caption for any photo by its relative path. Empty string or missing entry = no caption shown. New photo placeholders are added automatically in the external captions store.';

const bucketName =
  process.env.MEDIA_BUCKET_NAME?.trim() ||
  process.env.R2_BUCKET_NAME?.trim() ||
  'niazphotography-images';
const manifestPath = path.join(process.cwd(), 'data', 'mediaManifest.ts');
const sourcePrefix = normalizePrefix(
  process.env.THUMB_SOURCE_PREFIX?.trim() ||
    process.env.R2_PHOTO_PREFIX?.trim() ||
    'photos-web'
);
const publicImageBaseUrl = (
  process.env.PUBLIC_IMAGE_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim() ||
  ''
).replace(/\/+$/, '');
const manifestObjectKey = normalizeRelativeKey(
  process.env.MEDIA_MANIFEST_OBJECT_KEY?.trim() || 'media-manifest.json'
);
const publishedManifestUrl = (
  process.env.MEDIA_MANIFEST_URL?.trim() ||
  process.env.NEXT_PUBLIC_MEDIA_MANIFEST_URL?.trim() ||
  (publicImageBaseUrl
    ? `${publicImageBaseUrl}/${encodeObjectKeyForUrl(manifestObjectKey)}`
    : '')
).trim();
const captionsObjectKey = normalizeRelativeKey(
  process.env.CAPTIONS_OBJECT_KEY?.trim() || 'captions.json'
);
const captionsCacheControl = `public, max-age=${process.env.CAPTIONS_CACHE_MAX_AGE || 60}`;
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

function encodeObjectKeyForUrl(objectKey) {
  return normalizeRelativeKey(objectKey)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function normalizeSearchKey(value) {
  return normalizeRelativeKey(value).toLowerCase();
}

function basenameLowerCase(value) {
  return path.posix.basename(value).toLowerCase();
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

function resolveCaptionKey(input) {
  const normalizedInput = normalizeRelativeKey(input.trim());

  if (!normalizedInput) {
    throw new Error('Provide a photo path like "Trees/Emerald Mist.jpg".');
  }

  return sourcePrefix && normalizedInput.startsWith(sourcePrefix)
    ? normalizedInput.slice(sourcePrefix.length)
    : normalizedInput;
}

function validateManifest(manifest) {
  if (
    !(manifest && typeof manifest === 'object') ||
    !Array.isArray(manifest.photos)
  ) {
    throw new Error('Media manifest payload was invalid.');
  }

  return manifest;
}

async function fetchPublishedPhotoPaths() {
  if (!publishedManifestUrl) {
    return [];
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

  const manifest = validateManifest(await response.json());

  return manifest.photos
    .map((entry) =>
      typeof entry?.relativePath === 'string'
        ? normalizeRelativeKey(entry.relativePath)
        : ''
    )
    .filter(Boolean);
}

async function loadLocalPhotoPaths() {
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

async function loadKnownPhotoPaths() {
  try {
    const publishedPaths = await fetchPublishedPhotoPaths();

    if (publishedPaths.length > 0) {
      return publishedPaths;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[caption:set] ${message} Falling back to local media manifest validation.`
    );
  }

  return loadLocalPhotoPaths();
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

async function resolveExistingCaptionKey(input) {
  const candidateKey = resolveCaptionKey(input);
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
      '  npm run caption:set -- <photo-relative-path> <caption> [--no-deploy]',
      '',
      'Examples:',
      '  npm run caption:set -- "Trees/Emerald Mist.jpg" "Morning fog drifts softly over layers of quiet forest."',
      '  npm run caption:set -- "photos-web/wildlife/DSC05232.jpg" "Bullfinch at first light."',
      '  npm run caption:set -- "wildlife/DSC05232.jpg" "" --no-deploy',
    ].join('\n')
  );
}

function parseArgs(argv) {
  let sourcePath = '';
  let caption;
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

    if (caption === undefined) {
      caption = arg;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!sourcePath || caption === undefined) {
    printUsage();
    process.exit(1);
  }

  return {
    sourcePath,
    caption,
    triggerDeploy,
  };
}

async function loadRemoteCaptionEntries() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'caption-set-'));
  const localFilePath = path.join(
    tmpDir,
    path.basename(captionsObjectKey) || 'captions.json'
  );

  try {
    runCommand('npx', [
      'wrangler',
      'r2',
      'object',
      'get',
      `${bucketName}/${captionsObjectKey}`,
      '--remote',
      '--file',
      localFilePath,
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('The specified key does not exist')) {
      return {
        currentSource: '',
        entries: [],
      };
    }

    throw error;
  }

  try {
    const currentSource = await fs.readFile(localFilePath, 'utf8');
    return {
      currentSource,
      entries: currentSource
        ? parseCaptionMap(JSON.parse(currentSource))
        : [],
    };
  } finally {
    await fs.rm(tmpDir, { force: true, recursive: true });
  }
}

async function publishCaptionMap(source) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'caption-set-'));
  const localFilePath = path.join(
    tmpDir,
    path.basename(captionsObjectKey) || 'captions.json'
  );

  try {
    await fs.writeFile(localFilePath, source, 'utf8');
    runCommand('npx', [
      'wrangler',
      'r2',
      'object',
      'put',
      `${bucketName}/${captionsObjectKey}`,
      '--remote',
      '--file',
      localFilePath,
      '--content-type',
      'application/json; charset=utf-8',
      '--cache-control',
      captionsCacheControl,
    ]);
  } finally {
    await fs.rm(tmpDir, { force: true, recursive: true });
  }
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
        'user-agent': 'niazphotography-caption-setter',
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
      `[caption:set] Triggered ${githubWorkflowFile} on ${githubRepository}@${githubDeployRef} with GITHUB_DEPLOY_TOKEN.`
    );
    return;
  }

  try {
    if (triggerDeployWithGh()) {
      console.log(
        `[caption:set] Triggered ${githubWorkflowFile} on ${githubRepository}@${githubDeployRef} with GitHub CLI.`
      );
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[caption:set] ${message}`);
  }

  console.warn(
    '[caption:set] Caption updated, but no deploy was triggered. Set GITHUB_DEPLOY_TOKEN locally or rerun the workflow manually.'
  );
}

async function main() {
  const { sourcePath, caption, triggerDeploy: shouldTriggerDeploy } = parseArgs(
    process.argv.slice(2)
  );

  const captionKey = await resolveExistingCaptionKey(sourcePath);
  const { currentSource, entries } = await loadRemoteCaptionEntries();
  const nextEntries = [];
  let foundExistingEntry = false;

  for (const [key, value] of entries) {
    if (key === captionKey) {
      nextEntries.push([key, caption]);
      foundExistingEntry = true;
      continue;
    }

    nextEntries.push([key, value]);
  }

  if (!foundExistingEntry) {
    nextEntries.push([captionKey, caption]);
  }

  const nextSource = renderCaptionMap(nextEntries);

  if (nextSource === currentSource) {
    console.log(`[caption:set] No change for ${captionKey}.`);
    return;
  }

  await publishCaptionMap(nextSource);
  console.log(
    `[caption:set] Updated ${captionKey} in ${bucketName}/${captionsObjectKey}.`
  );

  if (shouldTriggerDeploy) {
    await triggerDeploy();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[caption:set] ${message}`);
  process.exit(1);
});
