import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const photosRoot = path.join(projectRoot, 'public', 'photos');
const webRoot = path.join(projectRoot, 'public', 'photos-web');
const thumbRoot = path.join(projectRoot, 'public', 'photos-thumb');
const outputPath = path.join(projectRoot, 'data', 'photoManifest.ts');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const skippedRelativePaths = new Set(['wildlife/DSC04877.jpg']);

function isImageFile(fileName) {
  return supportedExtensions.has(path.extname(fileName).toLowerCase());
}

function walkDirectory(rootDirectory, currentDirectory = rootDirectory) {
  const entries = fs.readdirSync(currentDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDirectory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkDirectory(rootDirectory, absolutePath));
      continue;
    }

    if (!entry.isFile() || !isImageFile(entry.name)) {
      continue;
    }

    files.push(path.relative(rootDirectory, absolutePath));
  }

  return files;
}

const availableWebAssets = new Set(
  walkDirectory(webRoot).map((relativePath) => relativePath.replaceAll(path.sep, '/'))
);
const availableThumbAssets = new Set(
  walkDirectory(thumbRoot).map((relativePath) => relativePath.replaceAll(path.sep, '/'))
);

const manifest = walkDirectory(photosRoot)
  .map((relativePath) => relativePath.replaceAll(path.sep, '/'))
  .filter((relativePath) => !skippedRelativePaths.has(relativePath))
  .filter(
    (relativePath) =>
      availableWebAssets.has(relativePath) && availableThumbAssets.has(relativePath)
  )
  .sort((first, second) =>
    first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' })
  )
  .map((relativePath) => {
    const absolutePath = path.join(photosRoot, relativePath);
    return {
      relativePath,
      date: fs.statSync(absolutePath).mtime.toISOString(),
    };
  });

const fileContents = `export type PhotoManifestEntry = {
  relativePath: string;
  date: string;
};

export const photoManifest: PhotoManifestEntry[] = ${JSON.stringify(manifest, null, 2)};\n`;

fs.writeFileSync(outputPath, fileContents);

console.log(`Wrote ${manifest.length} photo entries to ${path.relative(projectRoot, outputPath)}`);
