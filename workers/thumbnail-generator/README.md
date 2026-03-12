# Thumbnail Generator Worker

This Worker consumes Cloudflare Queue messages created by R2 object event notifications and writes thumbnails back into the same bucket under `photos-thumb/`.

## What it does

- Watches image uploads in your main photo area
- Generates a resized thumbnail automatically
- Writes the thumbnail to `photos-thumb/...`
- Deletes the generated thumbnail when the original image is deleted

## Default behavior

- Source bucket: same bucket you already use for photos and videos
- Source prefix: all image objects in the bucket, unless you set `THUMB_SOURCE_PREFIX`
- Thumbnail prefix: `photos-thumb/`
- Output format: `image/webp`
- Thumbnail size: max `1200x1200`

## 1. Edit Wrangler config

Open `workers/thumbnail-generator/wrangler.jsonc` and replace:

- `bucket_name`
- `queue`
- `name`

Your config is now set for originals under `photos-web/` and generated thumbs under `photos-thumb/`.

If you ever move originals outside `photos-web/`, change:

```json
"THUMB_SOURCE_PREFIX": "photos-web"
```
to:

```json
"THUMB_SOURCE_PREFIX": ""
```

## 2. Create the Queue

Fastest option:

```bash
npm run thumbs:setup
```

That script will try to:

- create the queue
- deploy the Worker
- create the object-create notification
- create the object-delete notification

If you want to do it manually instead, use the commands below.

## 3. Manual Queue Create

```bash
npx wrangler queues create niaz-media-events
```

Use the same queue name you set in `wrangler.jsonc`.

## 4. Manual Worker Deploy

```bash
npx wrangler deploy -c workers/thumbnail-generator/wrangler.jsonc
```

Note:

- The Worker uses the Cloudflare Images binding to resize uploads.
- Cloudflare documents Images bindings separately from R2, and each generated thumbnail counts as an image transformation.

## 5. Manual R2 Event Notifications

Create two notification rules on the same bucket:

1. Object create events -> queue
2. Object delete events -> queue

Using Wrangler:

```bash
npx wrangler r2 bucket notification create niazphotography-images \
  --event-type object-create \
  --queue niaz-media-events
```

```bash
npx wrangler r2 bucket notification create niazphotography-images \
  --event-type object-delete \
  --queue niaz-media-events
```

If you only want originals from a specific folder to trigger thumbnails, add a prefix filter in the Cloudflare dashboard or configure `THUMB_SOURCE_PREFIX`.

## 5. Keep the site sync config aligned

Your site sync script already expects thumbnails under `photos-thumb/`. Generated `.webp` thumbnails are now matched automatically against originals like:

- `wildlife/fox.jpg` -> `photos-thumb/wildlife/fox.webp`
- `photos-web/wildlife/fox.jpg` -> `photos-thumb/wildlife/fox.webp`

## Workflow

After this is deployed:

1. Upload original photo to R2
2. Cloudflare sends an event to the queue
3. Worker generates thumbnail in `photos-thumb/...`
4. Restart `npm run dev` or run `npm run sync:media`
5. The new image appears in the site with its generated thumbnail
