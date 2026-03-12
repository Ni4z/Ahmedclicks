const imageExtensions = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.webp',
]);

const formatToExtension = {
  'image/avif': '.avif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

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

function isSupportedImage(objectKey) {
  const extension = objectKey.slice(objectKey.lastIndexOf('.')).toLowerCase();
  return imageExtensions.has(extension);
}

function shouldHandleImage(objectKey, sourcePrefix, thumbPrefix) {
  const normalizedKey = normalizePath(objectKey);

  if (!isSupportedImage(normalizedKey)) {
    return false;
  }

  if (thumbPrefix && normalizedKey.startsWith(thumbPrefix)) {
    return false;
  }

  if (sourcePrefix && !normalizedKey.startsWith(sourcePrefix)) {
    return false;
  }

  return true;
}

function getThumbnailKey(objectKey, sourcePrefix, thumbPrefix, outputExtension) {
  const relativePath = stripPrefix(normalizePath(objectKey), sourcePrefix);
  return `${thumbPrefix}${replaceExtension(relativePath, outputExtension)}`;
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

  const transformedImage = env.IMAGES
    .input(originalObject.body)
    .transform({
      fit: 'scale-down',
      width: Number(env.THUMB_MAX_WIDTH || 1200),
      height: Number(env.THUMB_MAX_HEIGHT || 1200),
      metadata: 'none',
    })
    .output({
      format: outputFormat,
      quality: Number(env.THUMB_QUALITY || 82),
    });
  const response = await transformedImage.response();

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

function isDeleteEvent(eventType) {
  return /delete|remove/i.test(eventType);
}

function isCreateEvent(eventType) {
  return /create|put|copy|complete/i.test(eventType);
}

export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      const payload = message.body;
      const objectKey = getObjectKey(payload);
      const eventType = getEventType(payload);

      if (!objectKey) {
        console.warn('Skipping queue message without an object key.');
        message.ack();
        continue;
      }

      try {
        if (isDeleteEvent(eventType)) {
          const deletedThumbnailKey = await removeThumbnail(objectKey, env);

          if (deletedThumbnailKey) {
            console.log(`Deleted thumbnail ${deletedThumbnailKey}`);
          }
        } else if (isCreateEvent(eventType) || !eventType) {
          const thumbnailKey = await generateThumbnail(objectKey, env);

          if (thumbnailKey) {
            console.log(`Generated thumbnail ${thumbnailKey}`);
          }
        } else {
          console.log(`Skipping unsupported event "${eventType}" for ${objectKey}`);
        }

        message.ack();
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : String(error);
        console.error(`Thumbnail processing failed for ${objectKey}: ${messageText}`);
        message.retry({ delaySeconds: 30 });
      }
    }
  },
};
