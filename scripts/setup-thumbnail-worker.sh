#!/usr/bin/env bash

set -euo pipefail

QUEUE_NAME="${QUEUE_NAME:-niaz-media-events}"
IMAGE_BUCKET_NAME="${IMAGE_BUCKET_NAME:-niazphotography-images}"
VIDEO_BUCKET_NAME="${VIDEO_BUCKET_NAME:-niazphotography-videos}"
WORKER_CONFIG="workers/thumbnail-generator/wrangler.jsonc"

echo "Creating queue: ${QUEUE_NAME}"
if ! npx wrangler queues create "${QUEUE_NAME}"; then
  echo "Queue creation failed or the queue already exists. Continuing."
fi

echo "Deploying thumbnail worker"
npx wrangler deploy -c "${WORKER_CONFIG}"

echo "Creating object-create notification for ${IMAGE_BUCKET_NAME}"
if ! npx wrangler r2 bucket notification create "${IMAGE_BUCKET_NAME}" \
  --event-type object-create \
  --queue "${QUEUE_NAME}"; then
  echo "object-create notification failed or already exists. Continuing."
fi

echo "Creating object-delete notification for ${IMAGE_BUCKET_NAME}"
if ! npx wrangler r2 bucket notification create "${IMAGE_BUCKET_NAME}" \
  --event-type object-delete \
  --queue "${QUEUE_NAME}"; then
  echo "object-delete notification failed or already exists. Continuing."
fi

if [[ -n "${VIDEO_BUCKET_NAME}" && "${VIDEO_BUCKET_NAME}" != "${IMAGE_BUCKET_NAME}" ]]; then
  echo "Creating object-create notification for ${VIDEO_BUCKET_NAME}"
  if ! npx wrangler r2 bucket notification create "${VIDEO_BUCKET_NAME}" \
    --event-type object-create \
    --queue "${QUEUE_NAME}"; then
    echo "video object-create notification failed or already exists. Continuing."
  fi

  echo "Creating object-delete notification for ${VIDEO_BUCKET_NAME}"
  if ! npx wrangler r2 bucket notification create "${VIDEO_BUCKET_NAME}" \
    --event-type object-delete \
    --queue "${QUEUE_NAME}"; then
    echo "video object-delete notification failed or already exists. Continuing."
  fi
fi

echo "Thumbnail and manifest automation setup finished."
