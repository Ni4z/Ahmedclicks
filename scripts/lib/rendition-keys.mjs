// Thumbnail/display renditions keep the source extension in their key, so
// "wildlife/Robin.jpg" and "wildlife/Robin.png" can never share one image:
//   photos-web/wildlife/Robin.jpg  ->  photos-thumb/wildlife/Robin.jpg.webp
//   photos-web/wildlife/Robin.png  ->  photos-thumb/wildlife/Robin.png.webp
// Older renditions were named without it (photos-thumb/wildlife/Robin.webp);
// those are still used, but only while no other photo shares the name.

function normalizeKey(value) {
  return String(value).replace(/^\/+/, '').replace(/\\/g, '/');
}

export function getRelativeStem(relativePath) {
  const normalizedPath = normalizeKey(relativePath);
  const lastDotIndex = normalizedPath.lastIndexOf('.');
  const lastSlashIndex = normalizedPath.lastIndexOf('/');

  return lastDotIndex > lastSlashIndex
    ? normalizedPath.slice(0, lastDotIndex)
    : normalizedPath;
}

export function getRenditionKey(relativePath, destPrefix, outputExtension) {
  return `${destPrefix}${normalizeKey(relativePath)}${outputExtension}`;
}

export function getLegacyRenditionKey(relativePath, destPrefix, outputExtension) {
  return `${destPrefix}${getRelativeStem(relativePath)}${outputExtension}`;
}

export function createRenditionResolver(objectKeys, destPrefix, photoRelativePaths) {
  const renditionKeysByStem = new Map();

  for (const objectKey of objectKeys) {
    const normalizedKey = normalizeKey(objectKey);

    if (destPrefix && normalizedKey.startsWith(destPrefix)) {
      renditionKeysByStem.set(
        getRelativeStem(normalizedKey.slice(destPrefix.length)),
        normalizedKey
      );
    }
  }

  const photoPaths = new Set(photoRelativePaths.map(normalizeKey));
  const photoCountByStem = new Map();

  for (const relativePath of photoPaths) {
    const stem = getRelativeStem(relativePath);
    photoCountByStem.set(stem, (photoCountByStem.get(stem) || 0) + 1);
  }

  return (relativePath) => {
    const normalizedPath = normalizeKey(relativePath);
    const exactKey = renditionKeysByStem.get(normalizedPath);

    if (exactKey) {
      return exactKey;
    }

    const stem = getRelativeStem(normalizedPath);

    if (photoCountByStem.get(stem) !== 1 || photoPaths.has(stem)) {
      return null;
    }

    return renditionKeysByStem.get(stem) || null;
  };
}
