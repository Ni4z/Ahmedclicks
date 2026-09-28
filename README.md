# NiazPhotography Portfolio

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
npm run photo:upload -- wildlife "C:\Exports\Robin on Perch.jpg" --dry-run
npm run photo:upload -- wildlife "C:\Exports\Robin on Perch.jpg"
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

### 1. Upload new photos

```bash
npm run photo:upload -- <gallery-folder> <image-or-folder>... [--dry-run]
npm run photo:upload -- landscape "C:\Exports\Alps trip"
```

This uploads to `photos-web/<gallery-folder>/` in R2 and never replaces an existing photo:

| You upload | Already in `wildlife/` | Saved as |
|------------|------------------------|----------|
| `DSC05063.jpg` | nothing | `wildlife/DSC05063.jpg` |
| `DSC05063.jpg` | `DSC05063.jpg` (a different photo) | `wildlife/DSC05063-2.jpg` |
| `DSC05063.JPG` | `DSC05063.jpg` | `wildlife/DSC05063-2.JPG` |
| exact same file again | `DSC05063.jpg` | skipped |

Use `--dry-run` to preview the names first. Camera file names like `DSC00001` repeat after 9999 shots, so this matters even if you never rename files. It needs the R2 settings in `.env.local` with write access.

To deliberately replace a photo (for example a re-edit), upload the new file under the exact same name in the Cloudflare dashboard. The page URL stays the same and new thumbnails are generated.

### 2. Sync new media

```bash
npm run sync:media
```

This updates the local media manifest and adds new placeholder entries in `data/photoMetadata.json` and `data/captions.json`.

### 3. Add photo metadata

```bash
npm run photo:meta:set -- "wildlife/Robin on Perch.jpg" --tags "robin,bird,perch" --series "Morning Birds" --location "Muenster Wetland"
```

You can also edit `data/photoMetadata.json` manually if you prefer.

### 4. Add or update a caption

```bash
npm run caption:set -- "wildlife/Robin on Perch.jpg" "A robin resting quietly on a mossy perch." --no-deploy
```

### 5. Verify before pushing

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
