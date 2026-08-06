import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { parseMarkdown } from './validate-treatment-import.mjs';

const MASTER_FILE = 'Titanium_Roots_94_Treatment_CMS_Master_v2_Editorial_SEO_Clean.md';

const PLACEHOLDERS = [
    '[CLINIC CITY]',
    '[CLINIC AREA]',
    'leave blank',
    'pending uuid',
    'do not generate'
];

const toNullableDate = (val) => {
    if (!val || typeof val !== 'string') return null;
    const clean = val.trim();
    if (!clean) return null;
    if (PLACEHOLDERS.some(p => clean.toLowerCase().includes(p))) return null;
    const parsed = Date.parse(clean);
    if (!isNaN(parsed)) {
        return new Date(parsed).toISOString().split('T')[0];
    }
    return null;
};

const toNullableTimestamp = (val) => {
    if (!val || typeof val !== 'string') return null;
    const clean = val.trim();
    if (!clean) return null;
    if (PLACEHOLDERS.some(p => clean.toLowerCase().includes(p))) return null;
    const parsed = Date.parse(clean);
    return !isNaN(parsed) ? new Date(parsed).toISOString() : null;
};

async function runImport() {
    console.log('[Import] Starting import process...');

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
    console.log('[Import] Parsing master file...');
    const parsedRecords = parseMarkdown(MASTER_FILE);
    console.log(`[Import] Parsed ${parsedRecords.length} records from ${MASTER_FILE}`);

    // 3. Query existing records
    console.log('[Import] Querying database for existing treatments...');
    const { data: existingRecords, error: fetchError } = await client
        .from('treatments')
        .select('*');

    if (fetchError) {
        console.error('[Fatal Error] Failed to fetch existing treatments:', fetchError);
        process.exit(1);
    }
    console.log(`[Import] Found ${existingRecords.length} existing treatments in database.`);

    // 4. Create backup
    const backupFile = `scripts/backup-treatments-${Date.now()}.json`;
    console.log(`[Import] backing up database state to ${backupFile}...`);
    try {
        writeFileSync(backupFile, JSON.stringify(existingRecords, null, 2), 'utf8');
        console.log('[Import] Backup complete.');
    } catch (e) {
        console.error('[Warning] Failed to write backup file:', e.message);
        // Continue but warn
    }

    // Map existing records by slug
    const existingMap = new Map();
    for (const r of existingRecords) {
        existingMap.set(r.slug, r);
    }

    // 5. First Pass: Insert/Update Records
    console.log('[Import] Pass 1: Inserting/updating records...');
    const slugToUuid = new Map();
    const nameToSlug = new Map();

    let createdCount = 0;
    let updatedCount = 0;

    for (const record of parsedRecords) {
        const existingRecord = existingMap.get(record.slug);

        // Map lists/objects to schema formats
        const payload = {
            name: record.name,
            slug: record.slug,
            category: record.category,
            card_copy: record.shortDescription,
            short_description: record.shortDescription,
            full_description: record.treatmentOverview,
            concern_triggers: record.whenToBookConsultation ? [record.whenToBookConsultation] : [],
            ideal_for: record.conditionsTreated || [],
            not_ideal_for: record.unsuitableCandidates || [],
            materials_used: existingRecord ? existingRecord.materials_used : [],
            risks_limitations: record.risksAndLimitations || '',
            limitations: record.risksAndLimitations || '',
            aftercare: record.aftercare ? record.aftercare.join('\n') : '',
            assessment: '',
            process: record.procedureSteps ? JSON.stringify(record.procedureSteps) : '[]',
            gallery_asset_ids: existingRecord ? existingRecord.gallery_asset_ids : [],
            focal_x: existingRecord ? existingRecord.focal_x : 0.5,
            focal_y: existingRecord ? existingRecord.focal_y : 0.5,
            doctor_ids: existingRecord ? existingRecord.doctor_ids : [],
            article_ids: existingRecord ? existingRecord.article_ids : [],
            concern_tags: existingRecord ? existingRecord.concern_tags : [],
            duration: record.typicalAppointmentDuration || '',
            visits: record.typicalNumberOfVisits || '',
            price: null,
            pricing_status: 'consultation_required',
            benefits: record.benefits || [],
            suitability: record.suitableCandidates ? record.suitableCandidates.join('\n') : '',
            procedure_steps: record.procedureSteps || [],
            recovery: record.recoveryAndDowntime || '',
            image_path: existingRecord ? existingRecord.image_path : null,
            image_alt: record.imageAltText || '',
            featured: record.featured,
            status: 'draft',
            seo_title: record.seoTitle || '',
            seo_description: record.seoDescription || '',
            canonical_url: record.canonicalUrlOverride || null,
            canonical_url_override: record.canonicalUrlOverride || '',
            og_image_path: record.socialImageUrl || null,
            schema_json: null,
            noindex: true,
            allow_search_indexing: false,
            reviewer_doctor_id: null,
            reviewed_at: null,
            scheduled_for: toNullableTimestamp(record.scheduledPublishTime),
            revision_note: record.revisionNote || '',
            reviewed_by_doctor_id: null,
            last_reviewed_at: null,
            sort_order: record.sortOrder || 1,

            // New fields
            alternative_names: record.alternativeNames || [],
            conditions_treated: record.conditionsTreated || [],
            anaesthesia_sedation: record.anaesthesiaOrSedation || '',
            expected_outcome: record.expectedOutcome || '',
            expected_longevity: record.expectedLongevity || '',
            unsuitable_candidates: record.unsuitableCandidates ? record.unsuitableCandidates.join('\n') : '',
            alternative_treatments: record.alternativeTreatments ? record.alternativeTreatments.map(alt => `* **${alt.title}**: ${alt.description}`).join('\n\n') : '',
            before_preparation: record.beforeTreatmentPreparation ? record.beforeTreatmentPreparation.join('\n') : '',
            when_contact_clinic: record.whenToContactClinic || '',
            when_book_consultation: record.whenToBookConsultation || '',
            faq_json: record.faqs || [],
            pricing_display_type: 'consultation_required',
            min_price: null,
            max_price: null,
            currency: 'INR',
            pricing_note: record.pricingNote || '',
            price_verified_date: toNullableDate(record.lastPriceVerificationDate),
            additional_gallery: existingRecord ? existingRecord.additional_gallery : [],
            before_after_gallery: existingRecord ? existingRecord.before_after_gallery : [],
            before_after_consent: existingRecord ? existingRecord.before_after_consent : false,
            written_by: record.writtenBy || '',
            clinically_reviewed_by: record.clinicallyReviewedBy || '',
            reviewer_credentials: record.reviewerCredentials || '',
            reviewer_profile_id: null,
            clinical_references: record.clinicalReferences || [],
            social_title: record.socialTitle || '',
            social_description: record.socialDescription || '',
            social_image: record.socialImageUrl || '',
            primary_search_phrase: record.primarySearchPhrase || '',
            secondary_search_phrases: record.secondarySearchPhrases || [],
            structured_data_type: record.structuredDataType || 'MedicalProcedure',
            structured_data_status: 'Pending',
            sitemap_status: 'Excluded'
        };

        if (existingRecord) {
            const { error: updateError } = await client
                .from('treatments')
                .update(payload)
                .eq('id', existingRecord.id);

            if (updateError) {
                console.error(`[Error] Failed to update "${record.name}":`, updateError);
            } else {
                updatedCount++;
                slugToUuid.set(record.slug, existingRecord.id);
                nameToSlug.set(record.name.toLowerCase().trim(), record.slug);
            }
        } else {
            const { data: newRow, error: insertError } = await client
                .from('treatments')
                .insert(payload)
                .select('id')
                .single();

            if (insertError) {
                console.error(`[Error] Failed to insert "${record.name}":`, insertError);
            } else {
                createdCount++;
                slugToUuid.set(record.slug, newRow.id);
                nameToSlug.set(record.name.toLowerCase().trim(), record.slug);
            }
        }
    }

    console.log(`[Import] Pass 1 complete: ${createdCount} created, ${updatedCount} updated.`);

    // 6. Refresh database map to get all UUIDs
    console.log('[Import] Refreshing database records list...');
    const { data: freshRecords, error: freshError } = await client
        .from('treatments')
        .select('id, slug, name');

    if (freshError) {
        console.error('[Fatal Error] Failed to refresh database list:', freshError);
        process.exit(1);
    }

    for (const r of freshRecords) {
        slugToUuid.set(r.slug, r.id);
        nameToSlug.set(r.name.toLowerCase().trim(), r.slug);
    }

    // 7. Pass 2: Related Treatment ID Resolution
    console.log('[Import] Pass 2: Resolving related treatment references...');
    let relationshipUpdates = 0;

    for (const record of parsedRecords) {
        const uuid = slugToUuid.get(record.slug);
        if (!uuid) continue;

        // Resolve names to slugs, and slugs to UUIDs
        const resolvedIds = [];
        for (const nameOfRelated of record.relatedTreatmentNames) {
            const cleanName = nameOfRelated.toLowerCase().trim();
            const relSlug = nameToSlug.get(cleanName);
            if (relSlug) {
                const relUuid = slugToUuid.get(relSlug);
                if (relUuid && relUuid !== uuid) {
                    resolvedIds.push(relUuid);
                }
            } else {
                // Fallback: check if the name is close to a slug
                const directSlug = nameOfRelated.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                const relUuid = slugToUuid.get(directSlug);
                if (relUuid && relUuid !== uuid) {
                    resolvedIds.push(relUuid);
                } else {
                    console.log(`[Warning] Could not resolve related treatment: "${nameOfRelated}" for "${record.name}"`);
                }
            }
        }

        // Deduplicate
        const uniqueIds = [...new Set(resolvedIds)];

        const { error: relError } = await client
            .from('treatments')
            .update({ related_treatment_ids: uniqueIds })
            .eq('id', uuid);

        if (relError) {
            console.error(`[Error] Failed relationship resolution for "${record.name}":`, relError);
        } else {
            relationshipUpdates++;
        }
    }

    console.log(`[Import] Pass 2 complete. Resolved relationships for ${relationshipUpdates} records.`);
    console.log('[Import SUCCESS] Database import fully completed.');
}

runImport().catch(err => {
    console.error('[Fatal Error] Import runner encountered uncaught failure:', err);
    process.exit(1);
});
