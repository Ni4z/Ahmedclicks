const imageExtensions = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.webp',
]);

const videoExtensions = new Set(['.m4v', '.mov', '.mp4', '.webm']);

const formatToExtension = {
  'image/avif': '.avif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const formatToCfImageOutput = {
  'image/avif': 'avif',
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const captionsReadme =
  'Add a caption for any photo or video by its relative path. Empty string or missing entry = no caption shown. New media placeholders are added automatically in the external captions store.';

function normalizePrefix(value, fallback = '') {
  const normalizedValue = (value ?? fallback).trim().replace(/^\/+|\/+$/g, '');
  return normalizedValue ? `${normalizedValue}/` : '';
}

function normalizeFormat(value) {
  const normalizedValue = (value || 'image/webp').trim().toLowerCase();
  return formatToExtension[normalizedValue] ? normalizedValue : 'image/webp';
}

function normalizePath(value) {
  return value.replace(/^\/+/, '').replace(/\\/g, '/');
}

function encodeObjectKey(objectKey) {
  return normalizePath(objectKey)
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
  const normalizedPath = normalizePath(filePath);
  const lastDotIndex = normalizedPath.lastIndexOf('.');
  const lastSlashIndex = normalizedPath.lastIndexOf('/');

  if (lastDotIndex <= lastSlashIndex) {
    return `${normalizedPath}${extension}`;
  }

  return `${normalizedPath.slice(0, lastDotIndex)}${extension}`;
}

function pathExtension(filePath) {
  const normalizedPath = normalizePath(filePath);
  const lastDotIndex = normalizedPath.lastIndexOf('.');
  const lastSlashIndex = normalizedPath.lastIndexOf('/');

  if (lastDotIndex <= lastSlashIndex) {
    return '';
  }

  return normalizedPath.slice(lastDotIndex).toLowerCase();
}

function isSupportedImage(objectKey) {
  return imageExtensions.has(pathExtension(objectKey));
}

function isSupportedVideo(objectKey) {
  return videoExtensions.has(pathExtension(objectKey));
}

function shouldHandleImage(objectKey, sourcePrefix, thumbPrefix) {
  const normalizedKey = normalizePath(objectKey);

  if (!isSupportedImage(normalizedKey)) {
    return false;
  }

  if (thumbPrefix && normalizedKey.startsWith(thumbPrefix)) {
    return false;
  }

  return true;
}

function getThumbnailKey(objectKey, sourcePrefix, thumbPrefix, outputExtension) {
  const relativePath = stripPrefix(normalizePath(objectKey), sourcePrefix);
  return `${thumbPrefix}${replaceExtension(relativePath, outputExtension)}`;
}

function getRelativeStem(objectKey) {
  const normalizedKey = normalizePath(objectKey);
  const extension = pathExtension(normalizedKey);

  return extension
    ? normalizedKey.slice(0, normalizedKey.length - extension.length)
    : normalizedKey;
}

function getPhotoRelativeStem(objectKey, env) {
  const sourcePrefix = normalizePrefix(env.THUMB_SOURCE_PREFIX, '');
  return getRelativeStem(stripPrefix(normalizePath(objectKey), sourcePrefix));
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

function getManifestObjectKey(env) {
  return normalizePath(env.MEDIA_MANIFEST_OBJECT_KEY || 'media-manifest.json');
}

function getManifestCacheControl(env) {
  return `public, max-age=${env.MEDIA_MANIFEST_CACHE_MAX_AGE || 60}`;
}

function getCaptionsObjectKey(env) {
  return normalizePath(env.CAPTIONS_OBJECT_KEY || 'captions.json');
}

function getCaptionsCacheControl(env) {
  return `public, max-age=${env.CAPTIONS_CACHE_MAX_AGE || 60}`;
}

function getMediaBucketName(env) {
  return (env.MEDIA_BUCKET_NAME || '').trim();
}

function getVideoBucketName(env) {
  return (env.VIDEO_BUCKET_NAME || '').trim();
}

function getPublicImageBaseUrl(env) {
  return (env.PUBLIC_IMAGE_BASE_URL || '').trim().replace(/\/+$/, '');
}

function getPublicManifestUrl(env) {
  const configuredUrl = (env.PUBLIC_MEDIA_MANIFEST_URL || '').trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  const publicImageBaseUrl = getPublicImageBaseUrl(env);

  if (!publicImageBaseUrl) {
    return '';
  }

  return `${publicImageBaseUrl}/${encodeObjectKey(getManifestObjectKey(env))}`;
}

function getManifestVisibilityTimeoutMs(env) {
  const configuredValue = Number(env.PUBLIC_MANIFEST_WAIT_TIMEOUT_MS || 30000);
  return Number.isFinite(configuredValue) && configuredValue > 0
    ? configuredValue
    : 30000;
}

function getManifestVisibilityPollMs(env) {
  const configuredValue = Number(env.PUBLIC_MANIFEST_WAIT_POLL_MS || 1000);
  return Number.isFinite(configuredValue) && configuredValue > 0
    ? configuredValue
    : 1000;
}

function getObjectDate(object) {
  if (object?.uploaded instanceof Date) {
    return object.uploaded.toISOString();
  }

  if (typeof object?.uploaded?.toISOString === 'function') {
    return object.uploaded.toISOString();
  }

  return new Date(0).toISOString();
}

async function listBucketObjects(bucket) {
  const objects = [];
  let cursor;

  do {
    const listing = await bucket.list({
      cursor,
      limit: 1000,
    });

    objects.push(
      ...listing.objects.map((object) => ({
        key: normalizePath(object.key),
        lastModified: getObjectDate(object),
      }))
    );
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);

  return objects;
}

function buildPhotoAssets(objects, env, thumbnailOverrides = new Map()) {
  const configuredPhotoPrefix = env.THUMB_SOURCE_PREFIX;
  const photoPrefix = normalizePrefix(configuredPhotoPrefix ?? 'photos-web');
  const photoThumbPrefix = normalizePrefix(
    env.THUMB_DEST_PREFIX || 'photos-thumb'
  );
  const thumbnailLookup = new Map();

  for (const object of objects) {
    if (
      photoThumbPrefix &&
      object.key.startsWith(photoThumbPrefix) &&
      isSupportedImage(object.key)
    ) {
      thumbnailLookup.set(
        getRelativeStem(stripPrefix(object.key, photoThumbPrefix)),
        object.key
      );
    }
  }

  const photoCandidates = objects.filter(
    (object) =>
      isSupportedImage(object.key) &&
      !(photoThumbPrefix && object.key.startsWith(photoThumbPrefix))
  );

  return {
    photos: photoCandidates
      .map((object) => {
        const relativePath = stripPrefix(object.key, photoPrefix);
        const thumbLookupKey = getRelativeStem(relativePath);

        return {
          objectKey: object.key,
          relativePath,
          thumbnailObjectKey: thumbnailOverrides.has(thumbLookupKey)
            ? thumbnailOverrides.get(thumbLookupKey)
            : thumbnailLookup.get(thumbLookupKey) || null,
          date: object.lastModified,
        };
      })
      .sort(compareByDateDescending),
    thumbnailKeys: new Set(thumbnailLookup.values()),
  };
}

function buildVideoAssets(objects, excludedKeys, env) {
  const videoPrefix =
    env.VIDEO_SOURCE_PREFIX === undefined
      ? ''
      : normalizePrefix(env.VIDEO_SOURCE_PREFIX);

  return objects
    .filter((object) => isSupportedVideo(object.key))
    .filter((object) => {
      if (videoPrefix) {
        return object.key.startsWith(videoPrefix);
      }

      return !excludedKeys.has(object.key);
    })
    .map((object) => ({
      objectKey: object.key,
      relativePath: stripPrefix(object.key, videoPrefix),
      date: object.lastModified,
    }))
    .sort(compareByDateDescending);
}

function parseCaptionEntries(source) {
  if (!(source && typeof source === 'object') || Array.isArray(source)) {
    throw new Error('Caption file must contain a JSON object.');
  }

  const entries = [];

  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith('_')) {
      continue;
    }

    entries.push([
      normalizePath(key),
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

async function publishCaptionPlaceholders(env, mediaEntries) {
  const captionsObjectKey = getCaptionsObjectKey(env);
  const currentObject = await env.MEDIA_BUCKET.get(captionsObjectKey);
  const currentSource = currentObject ? await currentObject.text() : '';
  const existingEntries = currentSource
    ? parseCaptionEntries(JSON.parse(currentSource))
    : [];
  const captionMap = new Map(existingEntries);
  const synchronizedEntries = [...existingEntries];
  let addedCount = 0;

  for (const mediaEntry of mediaEntries) {
    const relativePath = normalizePath(mediaEntry.relativePath);

    if (captionMap.has(relativePath)) {
      continue;
    }

    captionMap.set(relativePath, '');
    synchronizedEntries.push([relativePath, '']);
    addedCount += 1;
  }

  const nextSource = renderCaptionMap(synchronizedEntries);

  if (nextSource !== currentSource) {
    await env.MEDIA_BUCKET.put(captionsObjectKey, nextSource, {
      httpMetadata: {
        cacheControl: getCaptionsCacheControl(env),
        contentType: 'application/json; charset=utf-8',
      },
      customMetadata: {
        generator: 'thumbnail-generator-worker',
      },
    });
  }

  if (addedCount > 0) {
    console.log(
      `Published ${addedCount} new caption placeholder${addedCount === 1 ? '' : 's'} to ${captionsObjectKey}`
    );
  }
}

async function publishMediaManifest(env, options = {}) {
  const { thumbnailOverrides = new Map() } = options;
  const imageObjects = await listBucketObjects(env.MEDIA_BUCKET);
  const { photos, thumbnailKeys } = buildPhotoAssets(
    imageObjects,
    env,
    thumbnailOverrides
  );
  const manifestObjectKey = getManifestObjectKey(env);
  const mediaBucketName = getMediaBucketName(env);
  const videoBucketName = getVideoBucketName(env);
  const usesSeparateVideoBucket =
    env.VIDEO_BUCKET && videoBucketName && videoBucketName !== mediaBucketName;
  const excludedVideoKeys = new Set([
    manifestObjectKey,
    ...photos.map((photo) => photo.objectKey),
    ...thumbnailKeys,
  ]);
  const videoObjects = usesSeparateVideoBucket
    ? await listBucketObjects(env.VIDEO_BUCKET)
    : imageObjects;
  const videos = buildVideoAssets(
    videoObjects,
    usesSeparateVideoBucket ? new Set([manifestObjectKey]) : excludedVideoKeys,
    env
  );
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'r2',
    photos,
    videos,
  };

  await publishCaptionPlaceholders(env, [...photos, ...videos]);

  await env.MEDIA_BUCKET.put(manifestObjectKey, JSON.stringify(manifest, null, 2), {
    httpMetadata: {
      cacheControl: getManifestCacheControl(env),
      contentType: 'application/json; charset=utf-8',
    },
    customMetadata: {
      generator: 'thumbnail-generator-worker',
    },
  });

  return manifest;
}

function isDeployTriggerConfigured(env) {
  return Boolean(
    (env.GITHUB_REPOSITORY || '').trim() &&
      (env.GITHUB_WORKFLOW_FILE || 'deploy.yml').trim() &&
      (env.GITHUB_DEPLOY_REF || 'main').trim() &&
      env.GITHUB_DEPLOY_TOKEN
  );
}

async function waitForPublicManifestVisibility(env, expectedGeneratedAt) {
  const publicManifestUrl = getPublicManifestUrl(env);

  if (!publicManifestUrl) {
    console.warn(
      'Skipping public manifest visibility wait because no public manifest URL is configured.'
    );
    return false;
  }

  const timeoutMs = getManifestVisibilityTimeoutMs(env);
  const pollMs = getManifestVisibilityPollMs(env);
  const deadline = Date.now() + timeoutMs;
  let lastObservation = 'no successful response';

  while (Date.now() <= deadline) {
    const requestUrl = new URL(publicManifestUrl);
    requestUrl.searchParams.set('_ts', Date.now().toString());

    try {
      const response = await fetch(requestUrl.toString(), {
        cache: 'no-store',
        headers: {
          accept: 'application/json',
          'cache-control': 'no-cache',
        },
      });

      if (response.ok) {
        const manifest = await response.json();
        const observedGeneratedAt =
          typeof manifest?.generatedAt === 'string' ? manifest.generatedAt : '';

        if (observedGeneratedAt === expectedGeneratedAt) {
          return true;
        }

        lastObservation = observedGeneratedAt
          ? `generatedAt=${observedGeneratedAt}`
          : 'manifest missing generatedAt';
      } else {
        lastObservation = `${response.status} ${response.statusText}`;
      }
    } catch (error) {
      lastObservation =
        error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  throw new Error(
    `Public manifest did not expose generatedAt=${expectedGeneratedAt} within ${timeoutMs}ms (last observed ${lastObservation}).`
  );
}

async function triggerSiteDeploy(env, options = {}) {
  const { expectedManifestGeneratedAt = '' } = options;
  const repository = (env.GITHUB_REPOSITORY || '').trim();
  const workflowFile = (env.GITHUB_WORKFLOW_FILE || 'deploy.yml').trim();
  const deployRef = (env.GITHUB_DEPLOY_REF || 'main').trim();
  const deployToken = env.GITHUB_DEPLOY_TOKEN;

  if (!(repository && workflowFile && deployRef && deployToken)) {
    return false;
  }

  const response = await fetch(
    `https://api.github.com/repos/${repository}/actions/workflows/${encodeURIComponent(
      workflowFile
    )}/dispatches`,
    {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${deployToken}`,
        'content-type': 'application/json',
        'user-agent': 'niazphotography-thumbnail-generator',
      },
      body: JSON.stringify({
        ref: deployRef,
        ...(expectedManifestGeneratedAt
          ? {
              inputs: {
                manifest_generated_at: expectedManifestGeneratedAt,
              },
            }
          : {}),
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

async function generateThumbnail(objectKey, env) {
  const sourcePrefix = normalizePrefix(env.THUMB_SOURCE_PREFIX, '');
  const thumbPrefix = normalizePrefix(env.THUMB_DEST_PREFIX, 'photos-thumb');
  const outputFormat = normalizeFormat(env.THUMB_OUTPUT_FORMAT);
  const outputExtension = formatToExtension[outputFormat];

  if (!shouldHandleImage(objectKey, sourcePrefix, thumbPrefix)) {
    return null;
  }

  const originalObject = await env.MEDIA_BUCKET.get(objectKey);

  if (!originalObject) {
    throw new Error(`Source object not found: ${objectKey}`);
  }

  const maxInputBytes = Number(env.THUMB_MAX_INPUT_BYTES || 20_000_000);

  if (originalObject.size > maxInputBytes) {
    console.warn(
      `Skipping in-worker thumbnail for ${objectKey} (${(originalObject.size / 1_000_000).toFixed(1)} MB exceeds ${(maxInputBytes / 1_000_000).toFixed(0)} MB limit). Will be backfilled by thumbs:heal in CI.`
    );
    return null;
  }

  const originalBytes = await originalObject.arrayBuffer();
  const originalStream = new Response(originalBytes).body;

  if (!originalStream) {
    throw new Error(`Unable to create a readable stream for ${objectKey}`);
  }

  const transformOptions = {
    fit: 'scale-down',
    width: Number(env.THUMB_MAX_WIDTH || 1200),
    height: Number(env.THUMB_MAX_HEIGHT || 1200),
    metadata: 'none',
  };
  const outputOptions = {
    format: outputFormat,
    quality: Number(env.THUMB_QUALITY || 82),
  };
  let response;

  try {
    const transformedImage = await env.IMAGES
      .input(originalStream)
      .transform(transformOptions)
      .output(outputOptions);
    response = await transformedImage.response();
  } catch (error) {
    const publicImageBaseUrl = getPublicImageBaseUrl(env);

    if (!publicImageBaseUrl) {
      throw error;
    }

    const fallbackResponse = await fetch(
      `${publicImageBaseUrl}/${encodeObjectKey(objectKey)}`,
      {
        cf: {
          image: {
            fit: transformOptions.fit,
            width: transformOptions.width,
            height: transformOptions.height,
            metadata: transformOptions.metadata,
            format: formatToCfImageOutput[outputFormat],
            quality: outputOptions.quality,
          },
        },
      }
    );
    const resizeStatus = fallbackResponse.headers.get('cf-resized');

    if (!fallbackResponse.ok || !fallbackResponse.body || !resizeStatus) {
      const fallbackResponseText = (await fallbackResponse.text())
        .replace(/\s+/g, ' ')
        .slice(0, 200);
      const messageText =
        error instanceof Error ? error.message : String(error);
      const resizeDetail = resizeStatus
        ? `cf-resized=${resizeStatus}`
        : 'cf-resized header missing';

      throw new Error(
        `Images binding failed (${messageText}); public resize fallback failed with ${fallbackResponse.status} ${fallbackResponse.statusText} (${resizeDetail}): ${fallbackResponseText}`
      );
    }

    response = fallbackResponse;
  }

  if (!response.ok || !response.body) {
    throw new Error(
      `Image transformation failed for ${objectKey} with status ${response.status}`
    );
  }

  const thumbnailKey = getThumbnailKey(
    objectKey,
    sourcePrefix,
    thumbPrefix,
    outputExtension
  );

  await env.MEDIA_BUCKET.put(thumbnailKey, response.body, {
    httpMetadata: {
      cacheControl: `public, max-age=${env.THUMB_CACHE_MAX_AGE || 31536000}, immutable`,
      contentType: outputFormat,
    },
    customMetadata: {
      generatedFrom: normalizePath(objectKey),
      generator: 'thumbnail-generator-worker',
    },
  });

  return thumbnailKey;
}

async function removeThumbnail(objectKey, env) {
  const sourcePrefix = normalizePrefix(env.THUMB_SOURCE_PREFIX, '');
  const thumbPrefix = normalizePrefix(env.THUMB_DEST_PREFIX, 'photos-thumb');
  const outputFormat = normalizeFormat(env.THUMB_OUTPUT_FORMAT);
  const outputExtension = formatToExtension[outputFormat];

  if (!shouldHandleImage(objectKey, sourcePrefix, thumbPrefix)) {
    return null;
  }

  const thumbnailKey = getThumbnailKey(
    objectKey,
    sourcePrefix,
    thumbPrefix,
    outputExtension
  );

  await env.MEDIA_BUCKET.delete(thumbnailKey);
  return thumbnailKey;
}

function getEventType(payload) {
  return (
    payload?.eventType ||
    payload?.event_type ||
    payload?.type ||
    payload?.action ||
    ''
  );
}

function getObjectKey(payload) {
  const candidate =
    payload?.object?.key ||
    payload?.object?.name ||
    payload?.key ||
    payload?.name ||
    payload?.objectKey ||
    '';

  return typeof candidate === 'string' ? normalizePath(candidate) : '';
}

function getBucketName(payload) {
  const candidate =
    payload?.bucket?.name ||
    payload?.bucket?.bucketName ||
    payload?.bucket?.id ||
    payload?.bucket ||
    payload?.bucketName ||
    payload?.bucket_name ||
    payload?.sourceBucket ||
    '';

  return typeof candidate === 'string' ? candidate.trim() : '';
}

function isDeleteEvent(eventType) {
  return /delete|remove/i.test(eventType);
}

function isCreateEvent(eventType) {
  return /create|put|copy|complete/i.test(eventType);
}

function affectsPublishedMedia(objectKey, bucketName, env) {
  if (!objectKey) {
    return false;
  }

  const normalizedKey = normalizePath(objectKey);
  const manifestObjectKey = getManifestObjectKey(env);
  const captionsObjectKey = getCaptionsObjectKey(env);
  const thumbPrefix = normalizePrefix(env.THUMB_DEST_PREFIX, 'photos-thumb');
  const photoPrefix = normalizePrefix(env.THUMB_SOURCE_PREFIX, '');
  const videoPrefix =
    env.VIDEO_SOURCE_PREFIX === undefined
      ? ''
      : normalizePrefix(env.VIDEO_SOURCE_PREFIX);
  const videoBucketName = getVideoBucketName(env);

  if (normalizedKey === manifestObjectKey) {
    return false;
  }

  if (normalizedKey === captionsObjectKey) {
    return false;
  }

  if (thumbPrefix && normalizedKey.startsWith(thumbPrefix)) {
    return false;
  }

  if (bucketName && videoBucketName && bucketName === videoBucketName) {
    return isSupportedVideo(normalizedKey) && (!videoPrefix || normalizedKey.startsWith(videoPrefix));
  }

  if (shouldHandleImage(normalizedKey, photoPrefix, thumbPrefix)) {
    return true;
  }

  return isSupportedVideo(normalizedKey) && (!videoPrefix || normalizedKey.startsWith(videoPrefix));
}

export default {
  async queue(batch, env) {
    const processedMessages = [];
    let shouldRefreshManifest = false;
    let shouldTriggerDeploy = false;
    const thumbnailOverrides = new Map();
    const photoSourcePrefix = normalizePrefix(env.THUMB_SOURCE_PREFIX, '');
    const thumbPrefix = normalizePrefix(env.THUMB_DEST_PREFIX, 'photos-thumb');

    for (const message of batch.messages) {
      const payload = message.body;
      const objectKey = getObjectKey(payload);
      const eventType = getEventType(payload);
      const bucketName = getBucketName(payload);
      const publishedMediaChanged = affectsPublishedMedia(objectKey, bucketName, env);

      if (!objectKey) {
        console.warn('Skipping queue message without an object key.');
        processedMessages.push(message);
        continue;
      }

      try {
        if (isDeleteEvent(eventType)) {
          const deletedThumbnailKey = await removeThumbnail(objectKey, env);

          if (deletedThumbnailKey) {
            console.log(`Deleted thumbnail ${deletedThumbnailKey}`);
            thumbnailOverrides.set(getPhotoRelativeStem(objectKey, env), null);
          }
        } else if (isCreateEvent(eventType) || !eventType) {
          const thumbnailKey = await generateThumbnail(objectKey, env);

          if (thumbnailKey) {
            console.log(`Generated thumbnail ${thumbnailKey}`);
            thumbnailOverrides.set(
              getPhotoRelativeStem(objectKey, env),
              thumbnailKey
            );
          }
        } else {
          console.log(`Skipping unsupported event "${eventType}" for ${objectKey}`);
        }

        processedMessages.push(message);
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : String(error);
        const shouldPublishWithoutThumbnail =
          publishedMediaChanged &&
          shouldHandleImage(objectKey, photoSourcePrefix, thumbPrefix);

        if (shouldPublishWithoutThumbnail) {
          console.error(
            `Thumbnail processing failed for ${objectKey}; continuing with manifest publish: ${messageText}`
          );
          thumbnailOverrides.set(getPhotoRelativeStem(objectKey, env), null);
          processedMessages.push(message);
        } else {
          console.error(`Thumbnail processing failed for ${objectKey}: ${messageText}`);
          message.retry({ delaySeconds: 30 });
          continue;
        }
      }

      if (publishedMediaChanged) {
        shouldRefreshManifest = true;
        shouldTriggerDeploy = true;
      }
    }

    if (shouldRefreshManifest) {
      let manifest;

      try {
        manifest = await publishMediaManifest(env, {
          thumbnailOverrides,
        });
        console.log(
          `Published media manifest with ${manifest.photos.length} photos and ${manifest.videos.length} videos`
        );
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : String(error);
        console.error(`Media manifest publishing failed: ${messageText}`);

        for (const message of processedMessages) {
          message.retry({ delaySeconds: 60 });
        }

        return;
      }

      if (shouldTriggerDeploy) {
        if (isDeployTriggerConfigured(env)) {
          try {
            const manifestVisible = await waitForPublicManifestVisibility(
              env,
              manifest.generatedAt
            );

            if (manifestVisible) {
              console.log(
                `Public manifest is visible with generatedAt=${manifest.generatedAt}`
              );
            }
          } catch (error) {
            const messageText =
              error instanceof Error ? error.message : String(error);
            console.error(`Public manifest propagation wait failed: ${messageText}`);

            for (const message of processedMessages) {
              message.retry({ delaySeconds: 30 });
            }

            return;
          }
        }

        try {
          const deployTriggered = await triggerSiteDeploy(env, {
            expectedManifestGeneratedAt: manifest.generatedAt,
          });

          if (deployTriggered) {
            console.log('Triggered GitHub Pages deploy after manifest update');
          }
        } catch (error) {
          const messageText =
            error instanceof Error ? error.message : String(error);
          console.error(`GitHub deploy trigger failed: ${messageText}`);
        }
      }
    }

    for (const message of processedMessages) {
      message.ack();
    }
  },
};
