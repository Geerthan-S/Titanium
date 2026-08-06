import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

// Helper to escape HTML safely
const htmlEscape = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const rootDirectory = resolve(process.cwd());
const dumpPath = resolve(rootDirectory, 'treatments_dump.json');
const templatePath = resolve(rootDirectory, 'templates/treatment-detail.html');

// Read source data
const treatmentsDump = JSON.parse(readFileSync(dumpPath, 'utf8'));
const templateHtml = readFileSync(templatePath, 'utf8');

// Include all treatments that have a slug
const activeTreatments = treatmentsDump.filter(t => t.slug);

console.log(`Starting generation of ${activeTreatments.length} physical treatment pages for SEO.`);

let generated = 0;

for (const treatment of activeTreatments) {
    if (!treatment.slug) continue;

    const title = `${treatment.name} | Titanium Roots Dental Clinic`;
    const description = treatment.seo_description || treatment.short_description || `Learn about ${treatment.name} at Titanium Roots Dental Clinic.`;
    const canonical = `https://titaniumroots.com/treatments/${treatment.slug}.html`;

    // Create SSR basic skeleton for spiders that don't execute JS
    const ssrHtml = `<article class="treatment-detail" data-treatment-detail>
    <header class="treatments-hero">
      <div class="container">
        <p class="section-eyebrow">${htmlEscape(treatment.category)}</p>
        <h1>${htmlEscape(treatment.name)}</h1>
        <p>${htmlEscape(treatment.full_description || treatment.short_description)}</p>
      </div>
    </header>
  </article>`;

    // Inject meta tags and payload
    const finalHtml = templateHtml
        .replace('<article class="treatment-detail" data-treatment-detail></article>', ssrHtml)
        .replaceAll('__PAGE_DATA__', htmlEscape(JSON.stringify(treatment)))
        .replaceAll('__META_TITLE__', htmlEscape(title))
        .replaceAll('__META_DESCRIPTION__', htmlEscape(description))
        .replaceAll('__CANONICAL_URL__', htmlEscape(canonical))
        .replaceAll('__OG_TITLE__', htmlEscape(title))
        .replaceAll('__OG_DESCRIPTION__', htmlEscape(description))
        .replaceAll('__ROBOTS__', `index, follow`);

    // Write flat .html files into the treatments directory for SEO
    const outputPath = resolve(rootDirectory, 'treatments', `${treatment.slug}.html`);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, finalHtml, 'utf8');
    generated++;
}

console.log(`Successfully generated ${generated} physical SEO HTML pages.`);
