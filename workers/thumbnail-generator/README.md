# Media Automation Worker

This Worker now does three jobs from the same R2 event stream:

- generates thumbnails for new photos in `photos-web/`
- publishes a combined `media-manifest.json`
- optionally triggers the GitHub Pages deploy workflow after media changes

That removes the site's dependency on the R2 S3 endpoint during `npm run build` and `npm run sync:media`.

## Buckets

Default bindings in [`wrangler.jsonc`](./wrangler.jsonc):

- image bucket: `niazphotography-images`
- video bucket: `niazphotography-videos`

The published manifest is written back into the image bucket at:

- `media-manifest.json`

With your current public image domain, that becomes:

- `https://images.niazphotography.com/media-manifest.json`

## What happens after upload

1. Upload a photo to `photos-web/...`
2. Cloudflare sends an R2 event to the queue
3. The Worker generates `photos-thumb/...`
4. The Worker rebuilds `media-manifest.json`
5. If GitHub deploy triggering is configured, the Worker dispatches the `deploy.yml` workflow on `main`
6. GitHub Pages rebuilds using the latest manifest JSON

Videos follow the same manifest + deploy path, but do not generate thumbnails.

## 1. Check Wrangler config

Open [`wrangler.jsonc`](./wrangler.jsonc) and confirm these values:

- `name`
- `queues.consumers[0].queue`
- `r2_buckets`
- `vars.MEDIA_BUCKET_NAME`
- `vars.VIDEO_BUCKET_NAME`
- `vars.GITHUB_REPOSITORY`

Important defaults:

```json
"THUMB_SOURCE_PREFIX": "photos-web",
"THUMB_DEST_PREFIX": "photos-thumb",
"VIDEO_SOURCE_PREFIX": "",
"MEDIA_MANIFEST_OBJECT_KEY": "media-manifest.json",
"GITHUB_REPOSITORY": "Ni4z/Ahmedclicks",
"GITHUB_WORKFLOW_FILE": "deploy.yml",
"GITHUB_DEPLOY_REF": "main"
```

If your videos live in a folder inside the video bucket, set:

```json
"VIDEO_SOURCE_PREFIX": "videos"
```

## 2. Add the GitHub token secret to the Worker

The deploy trigger is optional, but it is what makes the static GitHub Pages site update automatically after upload.

Create a GitHub personal access token that can trigger workflows on this repo, then store it as a Wrangler secret:

```bash
npx wrangler secret put GITHUB_DEPLOY_TOKEN -c workers/thumbnail-generator/wrangler.jsonc
```

Minimum practical permission:

- repository actions write access on `Ni4z/Ahmedclicks`

## 3. Create queue + notifications + deploy worker

Fastest path:

```bash
npm run thumbs:setup
```

That script will:

- create the queue
- deploy the worker
- connect image bucket create/delete notifications
- connect video bucket create/delete notifications

## 4. Verify the public manifest URL

After the worker handles at least one media event, check:

```text
https://images.niazphotography.com/media-manifest.json
```

You should see JSON with:

- `photos`
- `videos`
- `generatedAt`

## 5. How the site consumes it

[`scripts/sync-r2-media.mjs`](../../scripts/sync-r2-media.mjs) now fetches the published manifest from your public image domain during:

- `npm run sync:media`
- `npm run dev`
- `npm run build`

So the site no longer needs to list objects directly from the R2 S3 endpoint.

## 6. Expected workflow

After setup, your normal process is:

1. Upload original photo to `photos-web/...`
2. Wait for the queue worker to run
3. Thumbnail and manifest update automatically
4. If Cloudflare misses a thumbnail, the GitHub Pages workflow backfills it automatically before the site build
5. GitHub Pages rebuild starts automatically if `GITHUB_DEPLOY_TOKEN` is configured
6. The site updates with the new photo

For local development:

```bash
npm run sync:media
npm run dev
```

## 7. Manual thumbnail backfill

If the Worker publishes a photo but Cloudflare fails to generate its thumbnail,
use the local backfill script instead of re-uploading the original:

```bash
npm run thumbs:backfill -- Trees/mushroom.jpg
```

What it does:

- downloads `photos-web/...` from R2
- generates the resized thumbnail locally with `sharp`
- uploads it to `photos-thumb/...`
- patches `media-manifest.json` so the photo points at the new thumbnail
- best-effort triggers `deploy.yml` using `GITHUB_DEPLOY_TOKEN` or `gh`

Use `--no-deploy` if you only want to patch R2 + the manifest:

```bash
npm run thumbs:backfill -- Trees/mushroom.jpg --no-deploy
```

The deploy workflow also runs `npm run thumbs:heal` automatically, so this
manual command is only for one-off repairs outside the normal Pages pipeline.

## Notes

- The worker ignores generated thumbnail events to avoid manifest loops.
- The manifest is stored in the image bucket so one public URL can feed the site build.
- If the GitHub token is not configured, thumbnails and the manifest still update automatically, but GitHub Pages will not rebuild by itself.
