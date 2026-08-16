import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('static hosting security headers are configured', async () => {
  const headers = await read('public/_headers');
  const vercel = await read('vercel.json');
  for (const source of [headers, vercel]) {
    assert.match(source, /Content-Security-Policy/);
    assert.match(source, /frame-ancestors 'none'/);
    assert.match(source, /X-Frame-Options/);
    assert.match(source, /X-Content-Type-Options/);
    assert.match(source, /Referrer-Policy/);
    assert.match(source, /Permissions-Policy/);
    assert.match(source, /Strict-Transport-Security/);
  }
});
