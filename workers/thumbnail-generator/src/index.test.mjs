import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from './index.mjs';

async function processUpload(testContext, options = {}) {
  const { status = 204, token = 'test-token', networkError = false } = options;
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
          objects: [{ key: objectKey, uploaded: new Date('2026-10-03T15:47:02Z') }],
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