# Media Automation Worker

Handles three jobs from the R2 event stream:

- generates thumbnails for new photos in `photos-web/`
- publishes `media-manifest.json` to the image bucket
- publishes `captions.json` placeholder keys for all published photos
- dispatches the GitHub Pages `deploy.yml` workflow when `GITHUB_DEPLOY_TOKEN` is configured

## Current infrastructure (verified)

| Component | Value |
|-----------|-------|
| Image bucket | `niazphotography-images` |
| Video bucket | `niazphotography-videos` |
| Queue | `niaz-media-events` (2 producers, 1 consumer) |
| Worker | `niazphotography-thumbnail-generator` |
| Published manifest | `https://images.niazphotography.com/media-manifest.json` |
| Published captions | `https://images.niazphotography.com/captions.json` |

## End-to-end flow

```
Upload photo to R2            (photos-web/wildlife/Bird.jpg)
       │
       ▼
R2 bucket notification ──────► niaz-media-events queue
       │
       ▼
Worker: generateThumbnail()    (photos-thumb/wildlife/Bird.webp)
       │
       ▼
Worker: publishCaptionPlaceholders() (captions.json in image bucket)
       │
       ▼
Worker: publishMediaManifest() (media-manifest.json in image bucket)
       │
       ▼
Worker: waitForPublicManifestVisibility()
       │                       waits up to 30 s for CDN to serve new generatedAt
       ▼
Worker: triggerSiteDeploy()    (POST /repos/.../actions/workflows/deploy.yml/dispatches)
       │
       ▼
GitHub Actions: deploy.yml
  ├── thumbs:heal              backfills any thumbnails the worker missed
  ├── sync:media               fetches published manifest → data/mediaManifest.ts
  ├── next build               static export using latest manifest
  └── deploy to GitHub Pages
       │
       ▼
Live site shows the new photo
```

Supported image types: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`

Videos follow the same manifest + deploy path but do not generate thumbnails.

## Secrets and tokens

### 1. Worker secret: GITHUB_DEPLOY_TOKEN

This is what makes the site rebuild automatically after a photo upload.

```bash
npx wrangler secret put GITHUB_DEPLOY_TOKEN -c workers/thumbnail-generator/wrangler.jsonc
```

The token must be able to trigger workflow dispatches on `Ni4z/Ahmedclicks`:

| Token type | Required permissions |
|------------|---------------------|
| Fine-grained PAT | Repository permission **Actions** → Read and write |
| Classic PAT | Scopes: `repo` + `workflow` |

Test the token locally:

```bash
GITHUB_DEPLOY_TOKEN=ghp_... node scripts/test-deploy-trigger.mjs
```

If the token is missing or invalid, thumbnails and the manifest still update
automatically in R2, and captions placeholders still update, but the live site will not rebuild until the next push to
`main` or a manual `workflow_dispatch`.

### 2. GitHub Actions secrets (for `thumbs:heal`)

The `deploy.yml` workflow runs `npm run thumbs:heal` to backfill any thumbnails
the worker missed (e.g. `thumbnailObjectKey: null` entries in the manifest).
This step needs R2 write access.

Go to **Settings → Secrets and variables → Actions → Secrets**:

| Secret | Value |
|--------|-------|
| `R2_ACCESS_KEY_ID` | Your R2 API token key ID |
| `R2_SECRET_ACCESS_KEY` | Your R2 API token secret |

### 3. GitHub Actions variables (optional)

These already have hardcoded fallbacks in `deploy.yml`, but you can override
them under **Settings → Secrets and variables → Actions → Variables**:

| Variable | Default |
|----------|---------|
| `R2_BUCKET_NAME` | `niazphotography-images` |
| `R2_ACCOUNT_ID` | *(from R2 endpoint)* |
| `R2_PHOTO_PREFIX` | `photos-web` |
| `R2_PHOTO_THUMB_PREFIX` | `photos-thumb` |
| `NEXT_PUBLIC_IMAGE_BASE_URL` | `https://images.niazphotography.com` |
| `NEXT_PUBLIC_VIDEO_BASE_URL` | *(empty)* |
| `MEDIA_MANIFEST_URL` | `https://images.niazphotography.com/media-manifest.json` |

## Setup (first time)

```bash
npm run thumbs:setup
```

Creates the queue, deploys the worker, and connects R2 bucket notifications.

## Wrangler config

Key values in [`wrangler.jsonc`](./wrangler.jsonc):

```jsonc
"THUMB_SOURCE_PREFIX": "photos-web",
"THUMB_DEST_PREFIX": "photos-thumb",
"MEDIA_MANIFEST_OBJECT_KEY": "media-manifest.json",
"CAPTIONS_OBJECT_KEY": "captions.json",
"GITHUB_REPOSITORY": "Ni4z/Ahmedclicks",
"GITHUB_WORKFLOW_FILE": "deploy.yml",
"GITHUB_DEPLOY_REF": "main"
```

## Verifying the manifest

```bash
curl -s https://images.niazphotography.com/media-manifest.json | head -20
```

Should return JSON with `generatedAt`, `photos`, and `videos`.

Verify captions placeholders:

```bash
curl -s https://images.niazphotography.com/captions.json | head -20
```

Should return JSON with photo relative paths as keys and empty-string placeholders
for new uploads.

Update one caption and trigger a rebuild:

```bash
npm run caption:set -- "Trees/Emerald Mist.jpg" "Morning fog drifts softly over layers of quiet forest."
```

Add `--no-deploy` if you only want to update `captions.json` without triggering
the site rebuild.

## Manual thumbnail backfill

If the worker misses a thumbnail, use the local backfill script:

```bash
npm run thumbs:backfill -- Trees/mushroom.jpg
```

This downloads the original from R2, generates the thumbnail locally with
`sharp`, uploads it to `photos-thumb/`, patches the manifest, and optionally
triggers a deploy.

Use `--no-deploy` to skip the deploy trigger:

```bash
npm run thumbs:backfill -- Trees/mushroom.jpg --no-deploy
```

The `deploy.yml` workflow also runs `npm run thumbs:heal` automatically, so
manual backfill is only needed for one-off repairs.

## Troubleshooting

**Photo uploaded but does not appear on the live site:**

1. Check the manifest has the photo: `curl -s https://images.niazphotography.com/media-manifest.json | grep <filename>`
2. Check captions placeholders exist: `curl -s https://images.niazphotography.com/captions.json | grep <filename>`
3. Check the thumbnail exists: `curl -sI https://images.niazphotography.com/photos-thumb/<path>.webp`
4. Test the deploy token: `GITHUB_DEPLOY_TOKEN=... node scripts/test-deploy-trigger.mjs`
5. Check recent workflow runs: `https://github.com/Ni4z/Ahmedclicks/actions`
6. Check Cloudflare worker logs: `npx wrangler tail -c workers/thumbnail-generator/wrangler.jsonc`

**`thumbs:heal` fails in CI with "fetch failed":**

R2 secrets are not configured in GitHub Actions. Add `R2_ACCESS_KEY_ID` and
`R2_SECRET_ACCESS_KEY` as repository secrets. This step has `continue-on-error: true`
so it does not block the build.

**Some photos have `thumbnailObjectKey: null`:**

The Cloudflare Images transform failed for that photo. The `thumbs:heal` step
in the deploy workflow backfills these automatically (once R2 secrets are configured).
For immediate fixes, use `npm run thumbs:backfill -- <relative-path>`.

## Notes

- The worker ignores events in `photos-thumb/` to avoid infinite loops.
- The manifest is stored in the image bucket so one public URL feeds the build.
- `cf-cache-status: DYNAMIC` — the manifest is not edge-cached, so the
  visibility check after publish should pass quickly.
- If the deploy trigger fails, the error is logged but the queue messages are
  still acknowledged. Check `wrangler tail` for `GitHub deploy trigger failed`.
