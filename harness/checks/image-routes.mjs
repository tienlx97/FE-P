import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Required application routes must survive Docker context filtering.
const manifest = JSON.parse(readFileSync('.next/server/app-paths-manifest.json', 'utf8'));
for (const route of ['/(protected)/admin/backups/page', '/api/health/ready/route', '/api/session/login/route', '/api/backend/[...path]/route']) {
  assert.ok(manifest[route], `Image is missing required route ${route}; check .dockerignore.`);
}
console.log('Required runtime routes exist.');
