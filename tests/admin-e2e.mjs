import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const runtimeModules = process.env.CODEX_NODE_MODULES;
assert(runtimeModules, 'CODEX_NODE_MODULES must point to a runtime containing Playwright.');
const { chromium } = require(path.join(runtimeModules, 'playwright'));

const BASE_URL = 'http://127.0.0.1:4173';
const ADMIN_PAGES = [
  'dashboard', 'appointments', 'doctors', 'treatments', 'blogs',
  'testimonials', 'gallery', 'seo', 'settings', 'analytics',
];
const MANAGERS = {
  appointments: {
    label: 'QA Appointment',
    updated: 'QA Appointment Updated',
    required: { name: 'QA Appointment', mobile: '+91 90000 00000' },
  },
  doctors: {
    label: 'QA Doctor',
    updated: 'QA Doctor Updated',
    required: {
      name: 'QA Doctor',
      designation: 'Consultant Dentist',
      specialization: 'General Dentistry',
    },
  },
  treatments: {
    label: 'QA Treatment',
    updated: 'QA Treatment Updated',
    required: {
      name: 'QA Treatment',
      shortDescription: 'Safe demonstration treatment copy.',
    },
  },
  blogs: {
    label: 'QA Blog',
    updated: 'QA Blog Updated',
    required: {
      title: 'QA Blog',
      excerpt: 'Safe demonstration article excerpt.',
      author: 'QA Contributor',
    },
    editor: '<p>Safe demonstration article content.</p>',
  },
  testimonials: {
    label: 'QA Testimonial',
    updated: 'QA Testimonial Updated',
    required: {
      name: 'QA Testimonial',
      review: 'A safe demonstration review for browser testing.',
    },
    selects: { status: 'Unpublished' },
  },
  gallery: {
    label: 'qa-media.webp',
    updated: 'qa-media-updated.webp',
    required: {
      title: 'QA Media',
      filename: 'qa-media.webp',
      alt: 'Safe demonstration media',
    },
  },
};

async function waitForAdmin(page) {
  await page.waitForLoadState('networkidle');
  await page.locator('body[data-admin-initialized="true"]').waitFor();
  assert(await page.locator('[data-admin-page-content]').innerText());
}

async function assertNoOverflow(page, pageName, width) {
  const overflow = await page.evaluate(
    () => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  );
  assert.equal(overflow, 0, `${pageName} overflows horizontally by ${overflow}px at ${width}px`);
}

async function fillNamedControl(form, name, value) {
  const control = form.locator(`[name="${name}"]`);
  assert.equal(await control.count(), 1, `Expected one ${name} field.`);
  await control.fill(value);
}

async function createEditDelete(page, manager, config) {
  console.log(`QA_MANAGER_START=${manager}`);
  await page.goto(`${BASE_URL}/admin/${manager}.html`);
  await waitForAdmin(page);

  await page.locator('[data-add-record]').click();
  const drawer = page.locator('.admin-drawer');
  await drawer.waitFor({ state: 'visible' });
  assert.equal(await drawer.getAttribute('role'), 'dialog');

  const form = drawer.locator('form');
  for (const [name, value] of Object.entries(config.required)) {
    await fillNamedControl(form, name, value);
  }
  for (const [name, value] of Object.entries(config.selects || {})) {
    await form.locator(`[name="${name}"]`).selectOption({ label: value });
  }
  if (config.editor) await form.locator('[data-editor-content]').fill(config.editor);

  await form.locator('button[type="submit"]').click();
  await drawer.waitFor({ state: 'detached' });

  const search = page.locator('[data-table-search]');
  await search.fill(config.label);
  assert.equal(await page.locator('tbody tr').count(), 1, `${manager} record was not created.`);
  let row = page.locator('tbody tr').first();
  assert((await row.innerText()).includes(config.label));

  await page.locator('[data-table-sort]').first().click();
  assert((await page.locator('[data-table-sort]').first().innerText()).includes('↓'));

  const filterControl = page.locator('[data-table-filter]').first();
  if (await filterControl.count()) {
    if (await filterControl.locator('option').count() > 1) {
      await filterControl.selectOption({ index: 1 });
      await filterControl.selectOption({ index: 0 });
    }
  }

  row = page.locator('tbody tr').first();
  await row.locator('[data-row-action="edit"], [data-row-action="view"]').first().click();
  const editDrawer = page.locator('.admin-drawer');
  await editDrawer.waitFor({ state: 'visible' });
  const key = manager === 'blogs' ? 'title' : manager === 'gallery' ? 'filename' : 'name';
  await editDrawer.locator(`[name="${key}"]`).fill(config.updated);
  await editDrawer.locator('button[type="submit"]').click();
  try {
    await editDrawer.waitFor({ state: 'detached', timeout: 5000 });
  } catch (error) {
    const invalid = await editDrawer.locator(':invalid').evaluateAll(
      (items) => items.map((item) => ({
        name: item.getAttribute('name'),
        message: item.validationMessage,
        value: item.value,
      })),
    );
    const status = await editDrawer.locator('[data-record-form-status]').innerText();
    throw new Error(`${manager} edit did not close. Invalid=${JSON.stringify(invalid)} Status=${status}`, { cause: error });
  }

  await search.fill(config.updated);
  const updatedRow = page.locator('tbody tr').first();
  assert((await updatedRow.innerText()).includes(config.updated), `${manager} record was not updated.`);
  await updatedRow.locator('[data-row-action="delete"]').click();
  const confirm = page.locator('[data-admin-confirm]');
  await confirm.waitFor({ state: 'visible' });
  await confirm.locator('[data-confirm-accept]').click();
  await confirm.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('tbody tr').count(), 0, `${manager} record was not deleted.`);
  console.log(`QA_MANAGER_PASS=${manager}`);
}

async function run() {
  const errors = [];
  const failedRequests = [];
  const failedResponses = [];
  const checks = [];
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  try {
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    await page.waitForURL('**/admin/login.html');
    checks.push('protected redirect');

    const qaEmail = process.env.QA_ADMIN_EMAIL ?? 'qa@titaniumroots.example';
    const qaPassword = process.env.QA_ADMIN_PASSWORD ?? 'demo-pass';
    await page.locator('[name="email"]').fill(qaEmail);
    await page.locator('[name="password"]').fill(qaPassword);
    await page.locator('[data-password-toggle]').click();
    assert.equal(await page.locator('[name="password"]').getAttribute('type'), 'text');
    await page.locator('[data-password-toggle]').click();
    await page.locator('[data-admin-login-form]').evaluate((form) => form.requestSubmit());
    await page.waitForURL('**/admin/dashboard.html');
    await waitForAdmin(page);
    checks.push('demo login');

    for (const adminPage of ADMIN_PAGES) {
      await page.goto(`${BASE_URL}/admin/${adminPage}.html`);
      await waitForAdmin(page);
      await page.locator('h2').first().waitFor({ state: 'visible' });
      assert.equal(
        await page.locator(`[data-admin-nav="${adminPage}"]`).first().getAttribute('aria-current'),
        'page',
      );
      await assertNoOverflow(page, adminPage, 1440);
    }
    assert.equal(await page.locator('canvas').count(), 6);
    assert(await page.locator('canvas').evaluateAll(
      (items) => items.every((canvas) => canvas.width > 0 && canvas.height > 0),
    ));
    checks.push('all routes and charts');

    for (const [manager, config] of Object.entries(MANAGERS)) {
      await createEditDelete(page, manager, config);
    }
    checks.push('all manager CRUD workflows');

    await page.goto(`${BASE_URL}/admin/testimonials.html`);
    await waitForAdmin(page);
    let pending = page.locator('tbody tr').filter({ hasText: 'Patient Display 02' });
    assert.equal(await pending.count(), 1);
    await pending.locator('[data-row-action="approve"]').click();
    pending = page.locator('tbody tr').filter({ hasText: 'Patient Display 02' });
    await pending.locator('[data-row-action="publish"]').click();
    const toast = page.locator('.toast').last();
    await toast.waitFor({ state: 'visible' });
    assert((await toast.innerText()).includes('requires approval and confirmed consent'));
    checks.push('testimonial publishing guard');

    await page.goto(`${BASE_URL}/admin/seo.html`);
    await waitForAdmin(page);
    let title = page.locator('[name="metaTitle"]');
    const originalTitle = await title.inputValue();
    await title.fill('QA SEO Title');
    await page.locator('[data-seo-form]').evaluate((form) => form.requestSubmit());
    await page.reload();
    await waitForAdmin(page);
    title = page.locator('[name="metaTitle"]');
    assert.equal(await title.inputValue(), 'QA SEO Title');
    await title.fill(originalTitle);
    await page.locator('[data-seo-form]').evaluate((form) => form.requestSubmit());
    checks.push('SEO persistence');

    await page.goto(`${BASE_URL}/admin/settings.html`);
    await waitForAdmin(page);
    let clinicName = page.locator('[name="clinicName"]');
    const originalName = await clinicName.inputValue();
    await clinicName.fill('QA Titanium Roots');
    await page.locator('[data-settings-form]').evaluate((form) => form.requestSubmit());
    await page.reload();
    await waitForAdmin(page);
    clinicName = page.locator('[name="clinicName"]');
    assert.equal(await clinicName.inputValue(), 'QA Titanium Roots');
    await clinicName.fill(originalName);
    await page.locator('[data-settings-form]').evaluate((form) => form.requestSubmit());
    checks.push('settings persistence');

    await page.locator('[data-command-open]:visible').first().click();
    const command = page.locator('[data-admin-command]');
    await command.waitFor({ state: 'visible' });
    await command.locator('[data-command-input]').fill('Analytics');
    assert((await command.locator('[data-command-results]').innerText()).includes('Analytics'));
    await page.keyboard.press('Escape');
    await command.waitFor({ state: 'hidden' });
    checks.push('command palette');

    for (const width of [375, 430, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      for (const adminPage of ['dashboard', 'appointments', 'seo', 'settings', 'analytics']) {
        await page.goto(`${BASE_URL}/admin/${adminPage}.html`);
        await waitForAdmin(page);
        await assertNoOverflow(page, adminPage, width);
      }
    }
    checks.push('responsive widths');

    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    await waitForAdmin(page);
    await page.locator('[data-admin-menu]:visible').first().click();
    assert((await page.locator('[data-admin-sidebar]').getAttribute('class')).includes('is-open'));
    await page.keyboard.press('Escape');
    assert(!(await page.locator('[data-admin-sidebar]').getAttribute('class')).includes('is-open'));
    checks.push('mobile drawer');

    await page.locator('[data-admin-menu]:visible').first().click();
    await page.locator('[data-admin-sidebar] [data-admin-logout]').click();
    await page.waitForURL('**/admin/login.html');
    await page.goto(`${BASE_URL}/admin/analytics.html`);
    await page.waitForURL('**/admin/login.html');
    checks.push('logout and session removal');
  } finally {
    await browser.close();
  }

  assert.deepEqual(errors, [], errors.join('\n'));
  assert.deepEqual(failedRequests, [], failedRequests.join('\n'));
  assert.deepEqual(failedResponses, [], failedResponses.join('\n'));
  console.log(`E2E_CHECKS_PASSED=${checks.length}`);
  checks.forEach((check) => console.log(`PASS: ${check}`));
  console.log('BROWSER_ERRORS=0');
  console.log('FAILED_REQUESTS=0');
  console.log('FAILED_RESPONSES=0');
}

await run();
