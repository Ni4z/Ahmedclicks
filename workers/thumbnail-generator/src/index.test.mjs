import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from './index.mjs';

async function processUpload(testContext, options = {}) {
  const { status = 204, token = 'test-token', networkError = false, extraObjects = [] } = options;
  const objectKey = 'photos-web/wildlife/Morning Visitor.jpg';
  const retries = [];
  const dispatches = [];
  let acknowledgements = 0;
  let manifest;

  for (const method of ['log', 'warn', 'error']) {
    testContext.mock.method(console, method, () => {});
  }

  testContext.mock.method(globalThis, 'fetch', async (input, request) => {
    if (new URL(input).hostname === 'api.github.com') {
      dispatches.push(JSON.parse(request.body));

      if (networkError) {
        throw new Error('Connection reset');
      }

      return status === 204
        ? new Response(null, { status })
        : Response.json({ message: 'Deploy rejected' }, { status });
    }

    return Response.json(manifest);
  });

  const env = {
    MEDIA_BUCKET_NAME: 'niazphotography-images',
    THUMB_SOURCE_PREFIX: 'photos-web',
    THUMB_DEST_PREFIX: 'photos-thumb',
    DISPLAY_DEST_PREFIX: 'photos-display',
    PUBLIC_IMAGE_BASE_URL: 'https://images.example.test',
    GITHUB_REPOSITORY: 'Ni4z/Ahmedclicks',
    GITHUB_DEPLOY_TOKEN: token,
    MEDIA_BUCKET: {
      async get(key) {
        return key === objectKey ? { size: 20_000_001 } : null;
      },
      async list() {
        return {
          objects: [{ key: objectKey, uploaded: new Date('2026-10-03T15:47:02Z') }, ...extraObjects],
          truncated: false,
        };
      },
      async put(key, value) {
        if (key === 'media-manifest.json') {
          manifest = JSON.parse(value);
        }
      },
    },
  };
  const message = {
    body: {
      action: 'PutObject',
      bucket: 'niazphotography-images',
      object: { key: objectKey },
    },
    ack() {
      acknowledgements += 1;
    },
    retry(settings) {
      retries.push(settings);
    },
  };

  await worker.queue({ messages: [message] }, env);

  assert.equal(manifest.photos[0].objectKey, objectKey);
  return { acknowledgements, retries, dispatches, manifest };
}

test('acknowledges an upload after GitHub accepts its deploy', async (testContext) => {
  const result = await processUpload(testContext);

  assert.equal(result.acknowledgements, 1);
  assert.deepEqual(result.retries, []);
  assert.deepEqual(result.dispatches, [{
    ref: 'main',
    inputs: { manifest_generated_at: result.manifest.generatedAt },
  }]);
});

for (const status of [401, 403, 500]) {
  test(`retries an upload when GitHub rejects its deploy with HTTP ${status}`, async (testContext) => {
    const result = await processUpload(testContext, { status });

    assert.equal(result.acknowledgements, 0);
    assert.deepEqual(result.retries, [{ delaySeconds: 60 }]);
    assert.equal(result.dispatches.length, 1);
  });
}

test('retries an upload when the GitHub request fails to connect', async (testContext) => {
  const result = await processUpload(testContext, { networkError: true });

  assert.equal(result.acknowledgements, 0);
  assert.deepEqual(result.retries, [{ delaySeconds: 60 }]);
});

test('retries an upload when the worker deploy token is missing', async (testContext) => {
  const result = await processUpload(testContext, { token: '' });

  assert.equal(result.acknowledgements, 0);
  assert.deepEqual(result.retries, [{ delaySeconds: 60 }]);
  assert.deepEqual(result.dispatches, []);
});

test('lists only five valid print-folder images in filename order', async () => {
  const entries = [
    { key: 'featured-prints/10-Last.jpg', size: 12 },
    { key: 'featured-prints/2-Second.jpg', size: 12 },
    { key: 'featured-prints/1-First.jpg', size: 12 },
    { key: 'featured-prints/3-Third.jpg', size: 12 },
    { key: 'featured-prints/4-Fourth.jpg', size: 12 },
    { key: 'featured-prints/5-Fifth.jpg', size: 12 },
    { key: 'featured-prints/0-Empty.jpg', size: 0 },
    { key: 'featured-prints/README.txt', size: 12 },
    { key: 'photos-web/private.jpg', size: 12 },
  ];
  const prefixes = [];
  const env = {
    PUBLIC_IMAGE_BASE_URL: 'https://images.example.test',
    MEDIA_BUCKET: {
      async list(options) {
        prefixes.push(options.prefix);
        return { objects: entries, truncated: false };
      },
      async head(key) {
        return key.endsWith('1-First.jpg')
          ? { customMetadata: { title: 'Selected title', width: '6000', height: '4000' } }
          : { customMetadata: {} };
      },
    },
  };
  const response = await worker.fetch(new Request('https://worker.test/featured-prints'), env);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.deepEqual(prefixes, ['featured-prints/']);
  assert.equal(data.photos.length, 5);
  assert.deepEqual(data.photos.map((photo) => photo.title), ['Selected title', 'Second', 'Third', 'Fourth', 'Fifth']);
  assert.equal(data.photos[0].width, 6000);
  assert.equal(data.photos[0].height, 4000);
});

test('supports print-folder pagination and empty selections', async () => {
  const cursors = [];
  const env = {
    PUBLIC_IMAGE_BASE_URL: 'https://images.example.test',
    MEDIA_BUCKET: {
      async list({ cursor }) {
        cursors.push(cursor);
        return cursor
          ? { objects: [], truncated: false }
          : { objects: [], truncated: true, cursor: 'next-page' };
      },
    },
  };
  const response = await worker.fetch(new Request('https://worker.test/featured-prints'), env);
  assert.deepEqual((await response.json()).photos, []);
  assert.deepEqual(cursors, [undefined, 'next-page']);
});

test('print endpoint is read-only and does not expose other paths', async () => {
  assert.equal((await worker.fetch(new Request('https://worker.test/featured-prints', { method: 'OPTIONS' }), {})).status, 204);
  assert.equal((await worker.fetch(new Request('https://worker.test/featured-prints', { method: 'POST' }), {})).status, 405);
  assert.equal((await worker.fetch(new Request('https://worker.test/other'), {})).status, 404);
});

test('failed print-folder access returns a non-cacheable generic error', async () => {
  const response = await worker.fetch(new Request('https://worker.test/featured-prints'), {
    PUBLIC_IMAGE_BASE_URL: 'https://images.example.test',
    MEDIA_BUCKET: { async list() { throw new Error('Sensitive internal details'); } },
  });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(JSON.stringify(await response.json()).includes('Sensitive'), false);
});

test('print replacements get versioned image URLs and deleted objects are skipped', async () => {
  const response = await worker.fetch(new Request('https://worker.test/featured-prints'), {
    PUBLIC_IMAGE_BASE_URL: 'https://images.example.test',
    MEDIA_BUCKET: {
      async list() {
        return { objects: [
          { key: 'featured-prints/01-New photo.jpg', size: 12, etag: 'new-version' },
          { key: 'featured-prints/02-Removed.jpg', size: 12, etag: 'removed' },
        ], truncated: false };
      },
      async head(key) {
        return key.endsWith('Removed.jpg') ? null : { customMetadata: {} };
      },
    },
  });
  const { photos } = await response.json();
  assert.equal(photos.length, 1);
  assert.equal(photos[0].id, 'featured-prints/01-New photo.jpg:new-version');
  assert.equal(photos[0].image, 'https://images.example.test/featured-prints/01-New%20photo.jpg?v=new-version');
});

test('print titles preserve camera-number suffixes', async () => {
  const response = await worker.fetch(new Request('https://worker.test/featured-prints'), {
    PUBLIC_IMAGE_BASE_URL: 'https://images.example.test',
    MEDIA_BUCKET: {
      async list() {
        return { objects: [{ key: 'featured-prints/05-Wildlife Frame 04928-6.jpg', size: 12 }], truncated: false };
      },
      async head() { return { customMetadata: {} }; },
    },
  });
  assert.equal((await response.json()).photos[0].title, 'Wildlife Frame 04928-6');
});

test('print-folder uploads do not mutate the gallery or trigger a website build', async (testContext) => {
  let acknowledgements = 0;
  let writes = 0;
  let requests = 0;
  for (const method of ['log', 'warn', 'error']) {
    testContext.mock.method(console, method, () => {});
  }
  testContext.mock.method(globalThis, 'fetch', async () => {
    requests += 1;
    return new Response(null, { status: 204 });
  });
  await worker.queue({ messages: [{
    body: {
      action: 'PutObject',
      bucket: 'niazphotography-images',
      object: { key: 'featured-prints/01-Selected.jpg' },
    },
    ack() { acknowledgements += 1; },
    retry() { assert.fail('A print-folder event must not retry the gallery workflow'); },
  }] }, {
    MEDIA_BUCKET_NAME: 'niazphotography-images',
    THUMB_SOURCE_PREFIX: 'photos-web',
    THUMB_DEST_PREFIX: 'photos-thumb',
    DISPLAY_DEST_PREFIX: 'photos-display',
    MEDIA_BUCKET: {
      async get() { return null; },
      async list() { return { objects: [], truncated: false }; },
      async put() { writes += 1; },
    },
  });
  assert.equal(acknowledgements, 1);
  assert.equal(writes, 0);
  assert.equal(requests, 0);
});

test('later gallery syncs exclude print-folder photos and videos', async (testContext) => {
  const result = await processUpload(testContext, { extraObjects: [
    { key: 'featured-prints/01-Copy.jpg', uploaded: new Date('2026-10-30T12:00:00Z') },
    { key: 'featured-prints/accidental-video.mp4', uploaded: new Date('2026-10-30T12:00:00Z') },
  ] });
  assert.equal(result.manifest.photos.length, 1);
  assert.equal(result.manifest.videos.length, 0);
  assert.equal(result.acknowledgements, 1);
});