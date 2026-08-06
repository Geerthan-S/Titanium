import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('inner-page heroes share the home hero alignment rules', async () => {
  const css = await readFile(new URL('../assets/css/hero-alignment.css', import.meta.url), 'utf8');

  for (const hero of ['about', 'treatments', 'doctors', 'blog']) {
    assert.match(css, new RegExp(`\\.${hero}-hero`));
  }

  for (const hero of ['about', 'treatments', 'doctors', 'blog']) {
    assert.match(css, new RegExp(`\\.${hero}-hero__content`));
  }

  assert.match(css, /min-height:\s*760px/);
  assert.match(css, /width:\s*min\(44%,\s*560px\)/);
  assert.match(css, /@media \(max-width:\s*1023px\)/);
  assert.match(css, /@media \(max-width:\s*767px\)/);
});

test('appointment form sets a five-minute WhatsApp reply expectation', async () => {
  const modal = await readFile(new URL('../components/appointment-modal.html', import.meta.url), 'utf8');
  assert.match(modal, /We’ll reply on WhatsApp within 5 minutes\./);
});

test('treatment cards keep detailed information off the home-page preview', async () => {
  const treatments = await readFile(new URL('../assets/js/pages/treatments.js', import.meta.url), 'utf8');
  const home = await readFile(new URL('../assets/js/pages/home.js', import.meta.url), 'utf8');

  assert.match(treatments, /View Details/);
  assert.match(treatments, /Price confirmed after consultation/);
  assert.match(treatments, /<dt>Duration<\/dt><dd>\$\{cardDuration\(treatment\)\}/);
  assert.match(treatments, /\? 'Varies' : treatment\.duration/);
  assert.doesNotMatch(home.match(/function renderFeaturedTreatments\(\)[\s\S]*?\n}\n/)?.[0] ?? '', /Book appointment/);
});

test('treatment catalogue has premium responsive card rules and clear actions', async () => {
  const css = await readFile(new URL('../assets/css/treatment-catalogue-polish.css', import.meta.url), 'utf8');
  const treatments = await readFile(new URL('../assets/js/pages/treatments.js', import.meta.url), 'utf8');

  assert.match(css, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 1279px\)/);
  assert.match(css, /@media \(max-width: 1023px\)/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /border-radius:\s*24px/);
  assert.match(treatments, /button button--secondary treatment-card__details/);
  assert.match(treatments, /button treatment-card__booking/);
  assert.match(treatments, /calendar-days/);
});
