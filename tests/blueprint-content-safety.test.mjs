import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

async function migrationSql() {
  const directory = new URL('../supabase/migrations/', import.meta.url);
  const files = await readdir(directory);
  const chunks = await Promise.all(files.filter((file) => file.endsWith('.sql')).map((file) => readFile(new URL(file, directory), 'utf8')));
  return chunks.join('\n');
}

test('production content includes all blueprint treatment packs', async () => {
  const sql = await migrationSql();
  for (const slug of [
    'dental-implants',
    'root-canal-treatment',
    'clear-aligners',
    'braces-orthodontics',
    'smile-makeover',
    'professional-teeth-whitening',
    'dental-veneers',
    'crowns-bridges',
    'gum-care-periodontics',
    'wisdom-tooth-assessment-removal',
    'pediatric-dentistry',
    'preventive-general-dentistry',
  ]) {
    assert.match(sql, new RegExp(`'${slug}'`));
  }
});

test('launch copy avoids fake proof and unsafe guarantees', async () => {
  const files = [
    await read('index.html'),
    await read('assets/js/pages/home.js'),
    await read('testimonials.html'),
    await read('assets/js/pages/testimonials.js'),
    await read('treatments.html'),
  ].join('\n');
  assert.doesNotMatch(files, /5000\+|15\+|smiles transformed|Dr\. Priya Mehta/i);
  assert.doesNotMatch(files, /guaranteed|painless|best dental|permanent solution/i);
  assert.match(files, /Your experience matters/i);
});
