#!/usr/bin/env node

/**
 * Generate Instagram-ready framed posters for every photo in the media manifest.
 *
 * Two layouts (auto-selected):
 *   - "title" layout (no caption): EXIF line bottom-left + photo title bottom-right.
 *   - "caption" layout: caption text centered + "BY WWW.NIAZPHOTOGRAPHY.COM" subline.
 *
 * Aspect handling:
 *   - Keep source aspect by default.
 *   - If the framed output would be taller than 4:5, center-crop the source so the
 *     framed output is exactly 4:5.
 *   - If wider than 1.91:1, center-crop so framed output is exactly 1.91:1.
 *
 * Idempotency: tracks per-photo source lastModified in data/instagram-state.json.
 * Skips any photo whose source hasn't changed since the last run, unless --all.
 *
 * Usage:
 *   node scripts/generate-instagram.mjs                   # process all changed
 *   node scripts/generate-instagram.mjs --all             # force re-render every photo
 *   node scripts/generate-instagram.mjs --path "Trees/X.jpg"
 *   node scripts/generate-instagram.mjs --preview         # write to out/instagram-preview/, no upload
 *   node scripts/generate-instagram.mjs --limit 2         # cap number of photos processed
 */

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

loadLocalEnvFiles();

// --- Config ---

const repoRoot = process.cwd();
const bucketName =
  process.env.MEDIA_BUCKET_NAME?.trim() ||
  process.env.R2_BUCKET_NAME?.trim() ||
  'niazphotography-images';
const accountId = process.env.R2_ACCOUNT_ID?.trim() || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || '';
const region = process.env.R2_REGION?.trim() || 'auto';
const endpoint = (
  process.env.R2_ENDPOINT?.trim() ||
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '')
).replace(/\/+$/, '');
const sourcePrefix = normalizePrefix(
  process.env.R2_PHOTO_PREFIX?.trim() || 'photos-web'
);
const instagramPrefix = normalizePrefix(
  process.env.R2_PHOTO_INSTAGRAM_PREFIX?.trim() || 'photos-instagram'
);
const cacheControl = `public, max-age=${
  process.env.INSTAGRAM_CACHE_MAX_AGE || 31536000
}, immutable`;
const emptyPayloadHash = crypto.createHash('sha256').update('').digest('hex');
const instagramFingerprintHeader = 'x-amz-meta-instagram-fingerprint';
const instagramPosterVersion = 'v2';

const manifestPath = path.join(repoRoot, 'data', 'mediaManifest.ts');
const captionsPath = path.join(repoRoot, 'data', 'captions.json');
const photoMetadataPath = path.join(repoRoot, 'data', 'photoMetadata.json');
const statePath = path.join(repoRoot, 'data', 'instagram-state.json');
const previewDir = path.join(repoRoot, 'out', 'instagram-preview');

const fontRegularPath = path.join(repoRoot, 'scripts', 'fonts', 'Montserrat-Regular.ttf');
const fontMediumPath = path.join(repoRoot, 'scripts', 'fonts', 'Montserrat-Medium.ttf');
const fontFamily = 'Montserrat';

// Border ratios (relative to source width after any forced crop).
const SIDE_BORDER_RATIO = 0.03;
const TOP_BORDER_RATIO = 0.03;
const BOTTOM_BORDER_RATIO = 0.09; // ≈ 3× top

// Instagram aspect bounds: H/W must be in [4/5, 1.91/1] inclusive.
const MIN_OUTPUT_RATIO = 0.8; // 4:5
const MAX_OUTPUT_RATIO = 1.91; // 1.91:1

// --- Helpers ---

function loadLocalEnvFiles() {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = path.join(process.cwd(), fileName);
    if (!fsSync.existsSync(filePath)) continue;
    const source = fsSync.readFileSync(filePath, 'utf8');
    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const sep = line.indexOf('=');
      if (sep === -1) continue;
      const key = line.slice(0, sep).trim();
      let value = line.slice(sep + 1).trim();
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
  const trimmed = (value || '').trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : '';
}

function replaceExtension(filePath, extension) {
  const lastDot = filePath.lastIndexOf('.');
  const lastSlash = filePath.lastIndexOf('/');
  if (lastDot <= lastSlash) return `${filePath}${extension}`;
  return `${filePath.slice(0, lastDot)}${extension}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hasR2Credentials() {
  return Boolean(accessKeyId && secretAccessKey && endpoint && bucketName);
}

async function probeR2Reachability() {
  try {
    const url = new URL(`${endpoint}/${bucketName}`);
    url.searchParams.set('list-type', '2');
    url.searchParams.set('max-keys', '1');
    const response = await fetch(url, {
      method: 'GET',
      headers: signRequest(url, 'GET', emptyPayloadHash).headers,
    });
    if (response.status === 401 || response.status === 403) {
      return { ok: false, reason: `R2 rejected credentials (${response.status}).` };
    }
    if (!response.ok) {
      return {
        ok: false,
        reason: `R2 list-objects returned ${response.status} ${response.statusText}.`,
      };
    }
    return { ok: true };
  } catch (error) {
    const cause = error?.cause?.code || error?.cause?.message;
    const accountIdHint =
      accountId && accountId.length !== 32
        ? ` (R2_ACCOUNT_ID is ${accountId.length} chars; Cloudflare account IDs are 32 hex chars — env var may be truncated)`
        : '';
    return {
      ok: false,
      reason: `R2 endpoint unreachable: ${cause || error.message}${accountIdHint}`,
    };
  }
}

function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function encodeObjectKeyForUrl(objectKey) {
  return objectKey
    .replace(/^\/+/, '')
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => encodeRfc3986(segment))
    .join('/');
}

function canonicalizePathname(pathname) {
  const segments = pathname.split('/').map((segment) => encodeRfc3986(segment));
  if (pathname.startsWith('/')) segments[0] = '';
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
    .map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
    .join('&');
}

function hmac(key, value) {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest();
}

function signRequest(url, method, payloadHash, extraHeaders = {}) {
  const requestDate = new Date();
  const amzDate = requestDate.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const headerEntries = [
    ['host', url.host],
    ['x-amz-content-sha256', payloadHash],
    ['x-amz-date', amzDate],
    ...Object.entries(extraHeaders).map(([key, value]) => [key.toLowerCase(), value]),
  ].sort(([a], [b]) => a.localeCompare(b));
  const canonicalHeaders = headerEntries.map(([k, v]) => `${k}:${v}`).join('\n');
  const signedHeaders = headerEntries.map(([k]) => k).join(';');
  const canonicalRequest = [
    method,
    canonicalizePathname(url.pathname),
    canonicalizeQuery(url.searchParams),
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
    hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), region), 's3'),
    'aws4_request'
  );
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(stringToSign, 'utf8')
    .digest('hex');

  const headers = {
    authorization: [
      `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(', '),
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...extraHeaders,
  };
  return { headers };
}

async function r2GetObject(objectKey) {
  const url = new URL(`${endpoint}/${bucketName}/${encodeObjectKeyForUrl(objectKey)}`);
  const response = await fetch(url, {
    method: 'GET',
    headers: signRequest(url, 'GET', emptyPayloadHash).headers,
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`R2 GET ${objectKey} failed: ${response.status} ${response.statusText}: ${body}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function r2HeadObject(objectKey) {
  const url = new URL(`${endpoint}/${bucketName}/${encodeObjectKeyForUrl(objectKey)}`);
  const response = await fetch(url, {
    method: 'HEAD',
    headers: signRequest(url, 'HEAD', emptyPayloadHash).headers,
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`R2 HEAD ${objectKey} failed: ${response.status} ${response.statusText}`);
  }
  return {
    etag: response.headers.get('etag'),
    lastModified: response.headers.get('last-modified'),
    instagramFingerprint: response.headers.get(instagramFingerprintHeader),
  };
}

async function r2PutObject(objectKey, body, contentType, metadata = {}) {
  const url = new URL(`${endpoint}/${bucketName}/${encodeObjectKeyForUrl(objectKey)}`);
  const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
  const extraHeaders = {
    'content-type': contentType,
    'content-length': String(body.length),
    'cache-control': cacheControl,
  };
  for (const [key, value] of Object.entries(metadata)) {
    extraHeaders[`x-amz-meta-${key}`] = String(value);
  }
  const { headers } = signRequest(url, 'PUT', payloadHash, extraHeaders);
  const response = await fetch(url, { method: 'PUT', headers, body });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`R2 PUT ${objectKey} failed: ${response.status} ${response.statusText}: ${errorBody}`);
  }
}

// --- Wrangler fallback (works when local wrangler is authed but R2 SigV4 isn't reachable) ---

let wranglerAvailable = null;
let wranglerUnavailableReason = '';

function summarizeCommandOutput(value) {
  return String(value || '')
    .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 500);
}

function checkWranglerAvailable() {
  if (wranglerAvailable !== null) return wranglerAvailable;
  // A bucket-list call is the simplest op that reliably surfaces auth failure
  // in non-interactive environments (whoami returns 0 even when not authed).
  const result = spawnSync('npx', ['wrangler', 'r2', 'bucket', 'list'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  wranglerAvailable = result.status === 0;
  if (!wranglerAvailable) {
    wranglerUnavailableReason =
      summarizeCommandOutput(result.stderr) ||
      summarizeCommandOutput(result.stdout) ||
      `wrangler exited with status ${result.status ?? 'unknown'}`;
  }
  return wranglerAvailable;
}

function wranglerGetObject(objectKey, destFile) {
  const result = spawnSync('npx', [
    'wrangler', 'r2', 'object', 'get',
    `${bucketName}/${objectKey}`,
    '--remote', '--file', destFile,
  ], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status !== 0) {
    throw new Error(`wrangler get ${objectKey} failed: ${result.stderr?.trim() || result.stdout?.trim()}`);
  }
}

function wranglerPutObject(objectKey, sourceFile, contentType) {
  const result = spawnSync('npx', [
    'wrangler', 'r2', 'object', 'put',
    `${bucketName}/${objectKey}`,
    '--remote', '--file', sourceFile,
    '--content-type', contentType,
    '--cache-control', cacheControl,
  ], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status !== 0) {
    throw new Error(`wrangler put ${objectKey} failed: ${result.stderr?.trim() || result.stdout?.trim()}`);
  }
}

// --- Unified R2 access (S3 first, wrangler fallback) ---

let useWrangler = false;

async function r2DownloadToBuffer(objectKey, tmpDir) {
  if (!useWrangler) {
    return r2GetObject(objectKey);
  }
  const tmpFile = path.join(tmpDir, `wget-${Date.now()}-${path.basename(objectKey)}`);
  wranglerGetObject(objectKey, tmpFile);
  const buf = await fs.readFile(tmpFile);
  await fs.unlink(tmpFile).catch(() => {});
  return buf;
}

async function r2UploadBuffer(objectKey, buffer, contentType, tmpDir, metadata = {}) {
  if (!useWrangler) {
    return r2PutObject(objectKey, buffer, contentType, metadata);
  }
  const tmpFile = path.join(tmpDir, `wput-${Date.now()}-${path.basename(objectKey)}`);
  await fs.writeFile(tmpFile, buffer);
  try {
    wranglerPutObject(objectKey, tmpFile, contentType);
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
  }
}

// --- Argument parsing ---

function parseArgs(argv) {
  const opts = {
    all: false,
    preview: false,
    onlyPath: null,
    limit: Infinity,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--all') opts.all = true;
    else if (arg === '--preview') opts.preview = true;
    else if (arg === '--path') {
      opts.onlyPath = argv[index + 1];
      index += 1;
    } else if (arg === '--limit') {
      opts.limit = Number(argv[index + 1]);
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: node scripts/generate-instagram.mjs [--all] [--preview] [--path X] [--limit N]'
      );
      process.exit(0);
    }
  }

  return opts;
}

// --- Manifest loader (parse the TS file via JSON-like extraction) ---

function loadMediaManifest() {
  const source = fsSync.readFileSync(manifestPath, 'utf8');
  const assignmentMatch = source.match(/=\s*(\{[\s\S]*?\});?\s*$/);
  if (!assignmentMatch) {
    throw new Error('Could not parse mediaManifest.ts');
  }
  return JSON.parse(assignmentMatch[1]);
}

function loadJsonOrDefault(filePath, fallback) {
  if (!fsSync.existsSync(filePath)) return fallback;
  const text = fsSync.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function writeJsonAtomic(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, filePath);
}

// --- Title derivation ---

function deriveTitle(relativePath) {
  const base = path.posix.basename(relativePath);
  const stem = base.replace(/\.[^.]+$/, '');
  return stem
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

// --- EXIF line builder ---

function formatExifLine(meta) {
  if (!meta) return null;
  const parts = [];
  if (meta.iso != null) parts.push(`ISO ${meta.iso}`);
  if (meta.focalLength) {
    const num = String(meta.focalLength).match(/\d+/);
    parts.push(`${num ? num[0] : meta.focalLength}MM`);
  }
  if (meta.aperture) {
    const cleaned = String(meta.aperture).replace(/^f\/?/i, '');
    parts.push(`F${cleaned}`);
  }
  if (meta.shutterSpeed) {
    const ss = String(meta.shutterSpeed).trim();
    parts.push(/s$/i.test(ss) ? ss.toUpperCase() : `${ss}S`);
  }
  return parts.length > 0 ? parts.join('   ') : null;
}

function createInstagramFingerprint({
  sourceObjectKey,
  lastModified,
  caption,
  exifLine,
  title,
}) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        version: instagramPosterVersion,
        sourceObjectKey,
        lastModified,
        caption: caption || '',
        exifLine: exifLine || '',
        title: title || '',
      })
    )
    .digest('hex');
}

// --- Text rendering via sharp (Pango) ---

// Pango letter-spacing is in 1024ths of a point. ~em*0.001 ≈ 1024 units per em-percent.
function pangoLetterSpacingForEm(fontSize, em) {
  return Math.round(fontSize * em * 1024);
}

async function renderTextImage({
  text,
  fontSize,
  align,
  letterSpacingEm = 0,
  width,
}) {
  if (!text) return null;
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const spacing = pangoLetterSpacingForEm(fontSize, letterSpacingEm);
  const markup =
    letterSpacingEm > 0
      ? `<span letter_spacing="${spacing}" foreground="#1a1a1a">${escaped}</span>`
      : `<span foreground="#1a1a1a">${escaped}</span>`;

  const opts = {
    text: markup,
    font: `${fontFamily} ${fontSize}px`,
    fontfile: fontRegularPath,
    rgba: true,
    align,
    wrap: 'word',
    spacing: Math.round(fontSize * 0.45),
  };
  if (width) opts.width = Math.round(width);

  const { data, info } = await sharp({ text: opts })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

async function buildOverlayLayers({
  outputWidth,
  topMargin,
  bottomMargin,
  innerHeight,
  sideMargin,
  layout,
  caption,
  exifLine,
  title,
}) {
  const layers = [];
  const innerWidth = outputWidth - sideMargin * 2;
  const small = Math.round(innerWidth * 0.014);
  const bottomTopY = topMargin + innerHeight;

  if (layout === 'caption' && caption) {
    const captionFontSize = small;
    const bylineFontSize = Math.max(12, Math.round(small * 0.78));
    const usableWidth = Math.round(innerWidth * 0.88);

    const captionImg = await renderTextImage({
      text: caption.toUpperCase(),
      fontSize: captionFontSize,
      align: 'center',
      letterSpacingEm: 0.08,
      width: usableWidth,
    });
    const bylineImg = await renderTextImage({
      text: 'BY WWW.NIAZPHOTOGRAPHY.COM',
      fontSize: bylineFontSize,
      align: 'center',
      letterSpacingEm: 0.22,
      width: usableWidth,
    });

    const gap = Math.round(bottomMargin * 0.18);
    const totalHeight = (captionImg?.height || 0) + gap + (bylineImg?.height || 0);
    const blockTop = bottomTopY + Math.max(0, Math.round((bottomMargin - totalHeight) / 2));

    if (captionImg) {
      layers.push({
        input: captionImg.buffer,
        left: Math.round((outputWidth - captionImg.width) / 2),
        top: blockTop,
      });
    }
    if (bylineImg) {
      layers.push({
        input: bylineImg.buffer,
        left: Math.round((outputWidth - bylineImg.width) / 2),
        top: blockTop + (captionImg?.height || 0) + gap,
      });
    }
  } else {
    const fontSize = small;
    const insetX = Math.round(sideMargin * 1.15);

    if (exifLine) {
      const exifImg = await renderTextImage({
        text: exifLine,
        fontSize,
        align: 'left',
        letterSpacingEm: 0.18,
      });
      if (exifImg) {
        layers.push({
          input: exifImg.buffer,
          left: insetX,
          top: bottomTopY + Math.round((bottomMargin - exifImg.height) / 2),
        });
      }
    }
    if (title) {
      const titleImg = await renderTextImage({
        text: title,
        fontSize,
        align: 'right',
        letterSpacingEm: 0.18,
      });
      if (titleImg) {
        layers.push({
          input: titleImg.buffer,
          left: outputWidth - insetX - titleImg.width,
          top: bottomTopY + Math.round((bottomMargin - titleImg.height) / 2),
        });
      }
    }
  }

  return layers;
}

// --- Crop math ---

function requiredSourceRatioForOutput(targetOutputRatio) {
  // Borders are computed against the cropped inner width W'.
  //   outputW = W' * (1 + 2*SIDE)
  //   outputH = H' + W' * (TOP + BOTTOM)
  //   outputR = (1 + 2*SIDE) / (1/sourceR' + TOP + BOTTOM)
  // Solving for sourceR' given a target outputR:
  const horizontal = 1 + SIDE_BORDER_RATIO * 2;
  const vertical = TOP_BORDER_RATIO + BOTTOM_BORDER_RATIO;
  return 1 / (horizontal / targetOutputRatio - vertical);
}

function currentOutputRatio(sourceRatio) {
  const horizontal = 1 + SIDE_BORDER_RATIO * 2;
  const vertical = TOP_BORDER_RATIO + BOTTOM_BORDER_RATIO;
  return horizontal / (1 / sourceRatio + vertical);
}

function computeCropForInstagram(width, height) {
  const sourceR = width / height;
  const outputR = currentOutputRatio(sourceR);

  let cropWidth = width;
  let cropHeight = height;

  if (outputR < MIN_OUTPUT_RATIO) {
    // Too tall — crop top+bottom so post-crop sourceR matches the target.
    const requiredSourceR = requiredSourceRatioForOutput(MIN_OUTPUT_RATIO);
    cropHeight = Math.round(width / requiredSourceR);
    cropWidth = width;
  } else if (outputR > MAX_OUTPUT_RATIO) {
    const requiredSourceR = requiredSourceRatioForOutput(MAX_OUTPUT_RATIO);
    cropWidth = Math.round(height * requiredSourceR);
    cropHeight = height;
  }

  cropWidth = Math.min(cropWidth, width);
  cropHeight = Math.min(cropHeight, height);

  const left = Math.floor((width - cropWidth) / 2);
  const top = Math.floor((height - cropHeight) / 2);
  return { left, top, width: cropWidth, height: cropHeight };
}

// --- Renderer ---

async function renderInstagramPoster(sourceFilePath, { caption, exifLine, title }) {
  const inputBuffer = await fs.readFile(sourceFilePath);
  const baseImage = sharp(inputBuffer, { failOn: 'none' }).rotate();
  const baseMeta = await baseImage.metadata();
  const sourceWidth = baseMeta.width;
  const sourceHeight = baseMeta.height;
  if (!sourceWidth || !sourceHeight) {
    throw new Error('Could not read source image dimensions.');
  }

  const crop = computeCropForInstagram(sourceWidth, sourceHeight);
  const croppedBuffer = await sharp(inputBuffer, { failOn: 'none' })
    .rotate()
    .extract(crop)
    .toBuffer();

  const innerWidth = crop.width;
  const innerHeight = crop.height;
  const sideMargin = Math.round(innerWidth * SIDE_BORDER_RATIO);
  const topMargin = Math.round(innerWidth * TOP_BORDER_RATIO);
  const bottomMargin = Math.round(innerWidth * BOTTOM_BORDER_RATIO);
  const outputWidth = innerWidth + sideMargin * 2;
  const outputHeight = innerHeight + topMargin + bottomMargin;

  const layout = caption ? 'caption' : 'title';
  const overlayLayers = await buildOverlayLayers({
    outputWidth,
    topMargin,
    bottomMargin,
    innerHeight,
    sideMargin,
    layout,
    caption,
    exifLine,
    title,
  });

  const result = await sharp({
    create: {
      width: outputWidth,
      height: outputHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: croppedBuffer, left: sideMargin, top: topMargin },
      ...overlayLayers,
    ])
    .jpeg({ quality: 95, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toBuffer();

  return { buffer: result, layout, width: outputWidth, height: outputHeight };
}

// --- Per-photo flow ---

async function processPhoto(photoEntry, options, captions, photoMetadata, state, tmpDir) {
  const relativePath = photoEntry.relativePath;
  const sourceObjectKey =
    photoEntry.objectKey || `${sourcePrefix}${relativePath}`;
  const lastModified = photoEntry.date || '';
  const stateKey = relativePath;
  const captionRaw = captions[relativePath];
  const caption = typeof captionRaw === 'string' && captionRaw.trim() ? captionRaw.trim() : null;
  const meta = photoMetadata[relativePath];
  const exifLine = formatExifLine(meta);
  const title = deriveTitle(relativePath);

  if (!caption && !exifLine && !title) {
    return { status: 'skipped', reason: 'no-overlay-data' };
  }

  const outputRelativeKey = replaceExtension(relativePath, '.jpg');
  const outputObjectKey = `${instagramPrefix}${outputRelativeKey}`;
  const fingerprint = createInstagramFingerprint({
    sourceObjectKey,
    lastModified,
    caption,
    exifLine,
    title,
  });
  const previousFingerprint = state[stateKey];

  if (!options.all && previousFingerprint === fingerprint && !options.preview) {
    return { status: 'skipped', reason: 'unchanged' };
  }

  if (!options.all && !options.preview && !useWrangler) {
    const existingOutput = await r2HeadObject(outputObjectKey);
    if (existingOutput?.instagramFingerprint === fingerprint) {
      state[stateKey] = fingerprint;
      return { status: 'skipped', reason: 'unchanged-in-r2' };
    }
  }

  // Download source from R2 to tmp.
  const sourceBuffer = await r2DownloadToBuffer(sourceObjectKey, tmpDir);
  if (!sourceBuffer) {
    throw new Error(`source not found in R2: ${sourceObjectKey}`);
  }
  const sourceFile = path.join(tmpDir, `src-${Date.now()}-${path.basename(relativePath)}`);
  await fs.writeFile(sourceFile, sourceBuffer);

  const { buffer, layout, width, height } = await renderInstagramPoster(sourceFile, {
    caption,
    exifLine,
    title,
  });

  await fs.unlink(sourceFile).catch(() => {});

  if (options.preview) {
    const previewPath = path.join(previewDir, outputRelativeKey);
    await fs.mkdir(path.dirname(previewPath), { recursive: true });
    await fs.writeFile(previewPath, buffer);
    return {
      status: 'previewed',
      layout,
      width,
      height,
      previewPath,
    };
  }

  await r2UploadBuffer(outputObjectKey, buffer, 'image/jpeg', tmpDir, {
    'instagram-fingerprint': fingerprint,
  });

  state[stateKey] = fingerprint;
  return {
    status: 'uploaded',
    layout,
    width,
    height,
    objectKey: outputObjectKey,
  };
}

// --- Main ---

async function main() {
  const options = parseArgs(process.argv.slice(2));

  // Decide R2 access path: prefer direct S3, fall back to wrangler.
  let s3Ok = false;
  if (hasR2Credentials()) {
    const probe = await probeR2Reachability();
    s3Ok = probe.ok;
    if (!s3Ok) {
      console.log(`[insta] direct R2 access not available — ${probe.reason}`);
    }
  } else {
    console.log('[insta] R2 SigV4 credentials not configured.');
  }

  if (!s3Ok) {
    if (checkWranglerAvailable()) {
      useWrangler = true;
      console.log('[insta] using wrangler CLI as R2 fallback.');
    } else {
      console.log(
        `[insta] wrangler CLI fallback not available — ${
          wranglerUnavailableReason || 'bucket list failed'
        }.`
      );
      console.log('[insta] Skipping Instagram poster generation.');
      return;
    }
  }

  const manifest = loadMediaManifest();
  const captions = loadJsonOrDefault(captionsPath, {});
  const photoMetadata = loadJsonOrDefault(photoMetadataPath, {});
  const state = loadJsonOrDefault(statePath, {});

  let photos = Array.isArray(manifest.photos) ? manifest.photos : [];

  if (options.onlyPath) {
    photos = photos.filter(
      (entry) =>
        entry.relativePath === options.onlyPath ||
        entry.objectKey === options.onlyPath
    );
    if (photos.length === 0) {
      console.error(`[insta] No photo matched --path "${options.onlyPath}".`);
      process.exit(1);
    }
  }

  const candidates = photos.slice(0, options.limit);
  if (candidates.length === 0) {
    console.log('[insta] No photos to process.');
    return;
  }

  if (options.preview) {
    await fs.mkdir(previewDir, { recursive: true });
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'insta-poster-'));
  let uploaded = 0;
  let previewed = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (const photo of candidates) {
      try {
        const result = await processPhoto(
          photo,
          options,
          captions,
          photoMetadata,
          state,
          tmpDir
        );
        if (result.status === 'uploaded') {
          uploaded += 1;
          console.log(
            `[insta] uploaded ${result.objectKey} (${result.layout}, ${result.width}x${result.height}).`
          );
        } else if (result.status === 'previewed') {
          previewed += 1;
          console.log(
            `[insta] preview ${result.previewPath} (${result.layout}, ${result.width}x${result.height}).`
          );
        } else {
          skipped += 1;
        }
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : String(error);
        const cause = error instanceof Error && error.cause ? ` (cause: ${error.cause.code || error.cause.message || error.cause})` : '';
        console.warn(`[insta] failed ${photo.relativePath}: ${message}${cause}`);
      }

      if (!options.preview) {
        await writeJsonAtomic(statePath, state);
      }
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  console.log(
    `[insta] done. uploaded=${uploaded} previewed=${previewed} skipped=${skipped} failed=${failed}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
