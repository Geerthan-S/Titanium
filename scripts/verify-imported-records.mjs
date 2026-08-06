import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { parseMarkdown } from './validate-treatment-import.mjs';

const MASTER_FILE = 'Titanium_Roots_94_Treatment_CMS_Master_v2_Editorial_SEO_Clean.md';

async function runVerification() {
    console.log('[Verification] Starting verification of imported records...');

    // 1. Initialize Supabase
    let env;
    try {
        env = readFileSync('.env', 'utf8');
    } catch (e) {
        console.error('[Fatal Error] Could not read .env file');
        process.exit(1);
    }
    const envUrl = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
    const serviceKey = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

    if (!envUrl || !serviceKey) {
        console.error('[Fatal Error] Missing Supabase URL or Service Role Key in .env');
        process.exit(1);
    }

    const client = createClient(envUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // 2. Parse master file
    const parsedRecords = parseMarkdown(MASTER_FILE);
    const parsedSlugs = new Set(parsedRecords.map(r => r.slug));

    // 3. Query all treatments from database
    const { data: dbRecords, error: fetchError } = await client
        .from('treatments')
        .select('*');

    if (fetchError) {
        console.error('[Fatal Error] Failed to fetch treatments:', fetchError);
        process.exit(1);
    }

    console.log(`[Verification] Database contains ${dbRecords.length} treatments total.`);

    // Filter database treatments specifically matching master slugs
    const masterDbRecords = dbRecords.filter(r => parsedSlugs.has(r.slug));
    console.log(`[Verification] Found ${masterDbRecords.length} treatments matching master slugs (Expected 94).`);

    let errorsFound = 0;

    // Assert exactly 94 matching records
    if (masterDbRecords.length !== 94) {
        console.error(`[Error] Count mismatch: Expected 94 records, found ${masterDbRecords.length}.`);
        errorsFound++;
    }

    // Inspect each record for requirements
    for (const r of masterDbRecords) {
        // Status must be 'draft'
        if (r.status !== 'draft') {
            console.error(`[Error] Record "${r.name}" (${r.slug}) has status "${r.status}" (Expected: "draft")`);
            errorsFound++;
        }

        // noindex must be true
        if (r.noindex !== true) {
            console.error(`[Error] Record "${r.name}" (${r.slug}) has noindex = ${r.noindex} (Expected: true)`);
            errorsFound++;
        }

        // allow_search_indexing must be false
        if (r.allow_search_indexing !== false) {
            console.error(`[Error] Record "${r.name}" (${r.slug}) has allow_search_indexing = ${r.allow_search_indexing} (Expected: false)`);
            errorsFound++;
        }

        // sitemap_status must be 'Excluded'
        if (r.sitemap_status !== 'Excluded') {
            console.error(`[Error] Record "${r.name}" (${r.slug}) has sitemap_status = "${r.sitemap_status}" (Expected: "Excluded")`);
            errorsFound++;
        }

        // Pricing columns check
        if (r.pricing_display_type !== 'consultation_required' || r.pricing_status !== 'consultation_required') {
            console.error(`[Error] Record "${r.name}" (${r.slug}) pricing displays are "${r.pricing_display_type}" / "${r.pricing_status}" (Expected: "consultation_required")`);
            errorsFound++;
        }

        if (r.price !== null || r.min_price !== null || r.max_price !== null) {
            console.error(`[Error] Record "${r.name}" (${r.slug}) has non-null pricing: price=${r.price}, min_price=${r.min_price}, max_price=${r.max_price} (Expected: null)`);
            errorsFound++;
        }

        // Related treatment checks
        const parsedRecord = parsedRecords.find(pr => pr.slug === r.slug);
        const expectedRelatedCount = parsedRecord.relatedTreatmentNames.length;
        const actualRelatedCount = r.related_treatment_ids ? r.related_treatment_ids.length : 0;

        // Note: Related count might be slightly less if a related name was not found or was a self-reference.
        // But it should be close. Let's output warning if they differ significantly.
        if (expectedRelatedCount > 0 && actualRelatedCount === 0) {
            console.log(`[Warning] Record "${r.name}" has ${expectedRelatedCount} expected related treatments, but 0 resolved.`);
        }
    }

    if (errorsFound === 0) {
        console.log('[Verification PASSED] All checks passed successfully. Clinical governance standards preserved.');
    } else {
        console.error(`[Verification FAILED] Encountered ${errorsFound} verification errors.`);
        process.exit(1);
    }
}

runVerification().catch(err => {
    console.error('[Fatal Error] Verification runner failed:', err);
    process.exit(1);
});
