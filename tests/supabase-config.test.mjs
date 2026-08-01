import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Supabase browser and CLI dependencies are exactly pinned', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.dependencies['@supabase/supabase-js'], '2.111.0');
  assert.equal(pkg.dependencies.dompurify, '3.4.12');
  assert.equal(pkg.devDependencies.supabase, '2.110.0');
});

test('environment example contains only safe public variable names', async () => {
  const example = await read('.env.example');
  assert.match(example, /^VITE_SUPABASE_URL=/m);
  assert.match(example, /^VITE_SUPABASE_PUBLISHABLE_KEY=/m);
  assert.doesNotMatch(example, /service_role|secret_key|database_password/i);
});

test('Supabase config targets the public schema and project migration directory', async () => {
  const config = await read('supabase/config.toml');
  assert.match(config, /project_id = "titanium-roots"/);
  assert.match(config, /schemas = \["public", "storage"\]/);
});
