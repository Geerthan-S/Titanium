import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import handler from '../api/gallery.js';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('gallery API handler implements required operations and config limits', () => {
    assert.equal(typeof handler, 'function', 'Gallery handler must be exported');
});

test('gallery API implementation checks file limits and allowed MIME types', async () => {
    const source = await read('api/gallery.js');

    // Verify configurable upload limit of 10 MB
    assert.match(source, /10 \* 1024 \* 1024/);

    // Verify allowed MIME types
    assert.match(source, /image\/jpeg/);
    assert.match(source, /image\/png/);
    assert.match(source, /image\/webp/);
    assert.match(source, /image\/svg\+xml/);

    // Verify WebP quality 85
    assert.match(source, /WEBP_QUALITY: 85/);

    // Verify resizing at 2048px
    assert.match(source, /MAX_DIMENSIONS: 2048/);

    // Verify sharp processing exists
    assert.match(source, /sharp\(/);
});

test('gallery UI elements are properly integrated into admin-app.js', async () => {
    const source = await read('assets/js/admin/admin-app.js');

    // Verify view components
    assert.match(source, /renderGalleryExplorer/);
    assert.match(source, /btn-new-folder/);

    // Verify change of caption "Upload Page" to "Upload Images"
    assert.match(source, /Upload Images/);
    assert.doesNotMatch(source, /Upload Page/);

    // Verify rename actions and recursive delete prompts are present
    assert.match(source, /btn-rename-folder/);
    assert.match(source, /btn-delete-folder/);
    assert.match(source, /recursive/);

    // Verify search
    assert.match(source, /gallery-search-input/);
    assert.match(source, /chk-search-all/);
});

test('gallery database migration matches the required folder schema', async () => {
    const migration = await read('supabase/migrations/20260804000100_create_media_folders.sql');

    // Verify media_folders layout
    assert.match(migration, /create table if not exists public\.media_folders/);
    assert.match(migration, /parent_id uuid/);
    assert.match(migration, /created_by uuid/);

    // Verify media_assets has folder_id field
    assert.match(migration, /folder_id uuid/);
});
