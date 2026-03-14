#!/usr/bin/env node

/**
 * Tests the GITHUB_DEPLOY_TOKEN by dispatching a no-op deploy.yml workflow.
 *
 * Usage:
 *   GITHUB_DEPLOY_TOKEN=ghp_... node scripts/test-deploy-trigger.mjs
 *
 * The token must have "Actions" read & write permission on Ni4z/Ahmedclicks.
 * - Fine-grained PAT: repository permission "Actions" → Read and write
 * - Classic PAT: `repo` + `workflow` scopes
 */

const repository = process.env.GITHUB_REPOSITORY || 'Ni4z/Ahmedclicks';
const workflowFile = process.env.GITHUB_WORKFLOW_FILE || 'deploy.yml';
const ref = process.env.GITHUB_DEPLOY_REF || 'main';
const token = process.env.GITHUB_DEPLOY_TOKEN || '';

if (!token) {
  console.error(
    'Missing GITHUB_DEPLOY_TOKEN. Run with:\n\n  GITHUB_DEPLOY_TOKEN=ghp_... node scripts/test-deploy-trigger.mjs\n'
  );
  process.exit(1);
}

const url = `https://api.github.com/repos/${repository}/actions/workflows/${encodeURIComponent(workflowFile)}/dispatches`;

console.log(`Dispatching ${workflowFile} on ${repository}@${ref} ...`);
console.log(`POST ${url}\n`);

const response = await fetch(url, {
  method: 'POST',
  headers: {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'user-agent': 'niazphotography-deploy-test',
  },
  body: JSON.stringify({ ref }),
});

const body = await response.text();

if (response.status === 204) {
  console.log('✅ Dispatch accepted (HTTP 204). The workflow should start shortly.');
  console.log(
    `Check: https://github.com/${repository}/actions/workflows/${workflowFile}`
  );
} else {
  console.error(`❌ Dispatch failed: ${response.status} ${response.statusText}`);
  console.error(body);
  console.error(
    '\nCommon causes:\n' +
      '  403 — token lacks "Actions" write permission or "workflow" scope\n' +
      '  404 — repository or workflow file not found, or token cannot see the repo\n' +
      '  422 — the ref does not exist\n'
  );
  process.exit(1);
}
