import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('admin authentication uses Supabase and contains no demo credential acceptance', async () => {
  const auth = await read('assets/js/admin/admin-auth.js');
  assert.match(auth, /signInWithPassword|getUser|isCmsAdmin/);
  assert.match(auth, /signOut/);
  assert.doesNotMatch(auth, /loginDemo|getDemoSession|sessionStorage|six-character demo/i);
});

test('CMS access requires an active administrator membership', async () => {
  const auth = await read('assets/js/admin/admin-auth.js');
  const repository = await read('assets/js/data/auth-repository.js');
  for (const source of [auth, repository]) {
    assert.match(source, /\.from\(['"]cms_admins['"]\)/);
    assert.match(source, /\.eq\(['"]user_id['"], user\.id\)/);
    assert.match(source, /\.eq\(['"]is_active['"], true\)/);
    assert.doesNotMatch(source, /function isCmsAdmin\(user\)[\s\S]*return Boolean\(user\)/);
  }
});

test('login has recovery but no signup', async () => {
  const login = await read('admin/login.html');
  assert.match(login, /data-forgot-password/);
  assert.doesNotMatch(login, /sign up|register/i);
  assert.ok((await read('admin/reset-password.html')).includes('data-admin-reset-form'));
});
