# Ahmed Photography Portfolio

A modern photography portfolio built with Next.js, React, Tailwind CSS, and Framer Motion.

## Public-Safe Commands

These are the commands you can safely keep in a public README. No secrets, tokens, or private environment values are included here.

### Setup and Development

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
npx tsc -p tsconfig.json --noEmit
```

### Media and Gallery Workflow

```bash
npm run sync:media
npm run photo:meta:set -- "wildlife/Robin on Perch.jpg" --tags "robin,bird,perch" --series "Morning Birds" --location "Muenster Wetland"
npm run photo:meta:set -- "landscape/Lets Walk.jpg" --tags "forest,path" --location "Woodland Trail" --year 2026
npm run photo:meta:set -- "wildlife/Robin on Perch.jpg" --clear-series --clear-location
npm run caption:set -- "wildlife/Robin on Perch.jpg" "A robin resting quietly on a mossy perch." --no-deploy
```

### Thumbnail Worker Commands

```bash
npm run thumbs:setup
npm run thumbs:dev
npm run thumbs:backfill
npm run thumbs:heal
npm run thumbs:test-deploy
npm run thumbs:deploy
```

These commands are safe to document publicly, but the deploy-related ones still depend on your local Cloudflare auth and project configuration when you run them.

## Media Files You Will Edit

- `data/photoMetadata.json`: photo organization data like `tags`, `series`, `location`, and optional `year`
- `data/captions.json`: captions for photos and videos
- `data/mediaManifest.ts`: synced media manifest generated from storage

## Typical Workflow

### 1. Sync new media

```bash
npm run sync:media
```

This updates the local media manifest and adds new placeholder entries in `data/photoMetadata.json` and `data/captions.json`.

### 2. Add photo metadata

```bash
npm run photo:meta:set -- "wildlife/Robin on Perch.jpg" --tags "robin,bird,perch" --series "Morning Birds" --location "Muenster Wetland"
```

You can also edit `data/photoMetadata.json` manually if you prefer.

### 3. Add or update a caption

```bash
npm run caption:set -- "wildlife/Robin on Perch.jpg" "A robin resting quietly on a mossy perch." --no-deploy
```

### 4. Verify before pushing

```bash
npm run build
```

## Photo Metadata Format

The metadata file is keyed by photo path:

```json
{
  "wildlife/Robin on Perch.jpg": {
    "tags": ["robin", "bird", "perch"],
    "series": "Morning Birds",
    "location": "Muenster Wetland",
    "year": 2026
  }
}
```

`year` is optional. If you leave it out, the gallery falls back to the photo date automatically.

## Project Notes

- The gallery can now be filtered by category, tag, series, location, and year.
- `photo:meta:set` updates the local `data/photoMetadata.json` file only.
- `caption:set` is documented above with `--no-deploy` so the README stays public-safe.
