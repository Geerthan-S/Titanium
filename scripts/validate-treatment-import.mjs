import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MASTER_FILE = 'Titanium_Roots_94_Treatment_CMS_Master_v2_Editorial_SEO_Clean.md';

const CLINIC_IMPORT_CONFIG = {
    clinicName: "Titanium Roots Dental Clinic",
    canonicalBaseUrl: "https://titanium-roots.com",
    city: "",
    area: "",
    nearbyAreas: [],
    address: "",
    phone: "",
    bookingUrl: "",
    contentAuthorName: "",
    clinicalReviewerName: "",
    reviewerCredentials: "",
    clinicalReviewerUserId: "",
    approvedTechnologies: [],
    approvedMaterials: [],
    confirmedTreatments: [],
    approvedPricing: {}
};

const PLACEHOLDERS = [
    '[CLINIC CITY]',
    '[CLINIC AREA]',
    '[CONTENT AUTHOR NAME — REQUIRED BEFORE PUBLICATION]',
    '[CLINICAL REVIEWER NAME — REQUIRED BEFORE PUBLICATION]',
    '[VERIFIED QUALIFICATIONS AND REGISTRATION DETAILS]',
    '[SELECT VERIFIED CMS USER]',
    'Leave blank.',
    'PENDING UUID',
    'Do not generate or select an image.'
];

export function parseMarkdown(filePath) {
    const content = readFileSync(filePath, 'utf8');

    // Split by treatment headings: "# Treatment {number}: {name}"
    const treatmentRegex = /^# Treatment (\d+):\s*(.+)$/gm;
    const sections = [];

    let match;
    const matches = [];
    while ((match = treatmentRegex.exec(content)) !== null) {
        matches.push({
            number: parseInt(match[1], 10),
            name: match[2].trim(),
            index: match.index,
            headerLength: match[0].length
        });
    }

    if (matches.length === 0) {
        throw new Error('No treatment records found.');
    }

    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];
        const startIndex = current.index + current.headerLength;
        const endIndex = next ? next.index : content.length;
        const body = content.substring(startIndex, endIndex);
        sections.push({
            number: current.number,
            name: current.name,
            body: body
        });
    }

    return sections.map(sec => parseTreatmentSection(sec));
}

function parseTreatmentSection(section) {
    const { number, name, body } = section;
    const parsed = {
        sourceNumber: number,
        name: name,
        slug: '',
        category: '',
        alternativeNames: [],
        shortDescription: '',
        treatmentOverview: '',
        conditionsTreated: [],
        relatedTreatmentNames: [],
        verifiedRelatedTreatmentIds: [],
        pendingRelatedTreatmentNames: [],
        typicalAppointmentDuration: '',
        typicalNumberOfVisits: '',
        anaesthesiaOrSedation: '',
        benefits: [],
        expectedOutcome: '',
        expectedLongevity: '',
        suitableCandidates: [],
        unsuitableCandidates: [],
        alternativeTreatments: [],
        beforeTreatmentPreparation: [],
        procedureSteps: [],
        recoveryAndDowntime: '',
        risksAndLimitations: '',
        aftercare: [],
        whenToContactClinic: '',
        whenToBookConsultation: '',
        faqs: [],
        pricingDisplayType: '',
        pricingDisplayText: '',
        pricingNote: '',
        lastPriceVerificationDate: '',
        currency: '',
        imageAltText: '',
        writtenBy: '',
        clinicallyReviewedBy: '',
        reviewerCredentials: '',
        clinicalReviewerId: '',
        lastClinicallyReviewedOn: '',
        clinicalReferences: [],
        revisionNote: '',
        seoTitle: '',
        seoDescription: '',
        canonicalUrl: '',
        allowIndexing: false,
        socialTitle: '',
        socialDescription: '',
        socialImageUrl: '',
        primarySearchPhrase: '',
        secondarySearchPhrases: [],
        structuredDataType: '',
        publishStatus: 'draft',
        scheduledPublishTime: null,
        featured: false,
        sortOrder: 1,
        clinicVerificationRequired: false,
        clinicalReviewPriority: 'Medium'
    };

    // Find next heading
    const findNextHeading = (text, start) => {
        const headings = ['# ', '## ', '### ', '#### ', '---'];
        let minIdx = text.length;
        for (const h of headings) {
            const idx = text.indexOf(h, start);
            if (idx !== -1 && idx < minIdx) {
                minIdx = idx;
            }
        }
        return minIdx;
    };

    const parseHeadingRaw = (heading) => {
        const prefix = `### ${heading}`;
        const idx = body.indexOf(prefix);
        if (idx === -1) return '';
        const nextHeadingIdx = findNextHeading(body, idx + prefix.length);
        return body.substring(idx + prefix.length, nextHeadingIdx).trim();
    };

    const cleanBlockText = (text) => {
        if (!text) return '';
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => !line.toLowerCase().includes('character count'))
            .filter(line => !line.toLowerCase().includes('character limit'))
            .filter(line => !line.toLowerCase().includes('words:'))
            .filter(line => !line.toLowerCase().includes('readability:'))
            .filter(line => !line.toLowerCase().includes('fk grade:'))
            .filter(line => !line.toLowerCase().includes('syllables:'))
            .join('\n').trim();
    };

    const cleanValue = (text) => {
        if (!text) return '';
        let cleaned = cleanBlockText(text);

        // Strip prefixes
        const prefixes = [
            /^(Short description|Short Description):?/i,
            /^(Treatment overview|Treatment Overview):?/i,
            /^(SEO title|SEO Title):?/i,
            /^(SEO description|SEO Description):?/i,
            /^(Revision [Nn]ote|Revision note):?/i
        ];

        for (const p of prefixes) {
            if (p.test(cleaned)) {
                cleaned = cleaned.replace(p, '').trim();
            }
        }

        // Strip wrapping quotes
        cleaned = cleaned.replace(/^["'“](.*)["'”]$/su, '$1').trim();
        return cleaned;
    };

    const parseHeadingValue = (heading) => {
        return cleanValue(parseHeadingRaw(heading));
    };

    const parseList = (heading) => {
        const raw = parseHeadingRaw(heading);
        if (!raw) return [];
        return raw
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('*') || line.startsWith('-'))
            .map(line => line.replace(/^[\*\-]\s*/, '').trim())
            .filter(Boolean);
    };

    // Slug
    parsed.slug = parseHeadingValue('Slug');
    // Category
    parsed.category = parseHeadingValue('Category');
    // Alternative Names
    parsed.alternativeNames = parseList('Alternative Names');
    // Short Description
    parsed.shortDescription = parseHeadingValue('Short Description');

    // Treatment Overview
    parsed.treatmentOverview = parseHeadingValue('Treatment Overview');

    // Conditions Treated
    parsed.conditionsTreated = parseList('Conditions or Concerns Treated');

    // Related Treatments
    const relatedSection = parseHeadingRaw('Related Treatments');
    if (relatedSection) {
        const relatedNamesIdx = relatedSection.indexOf('#### Related Treatment Names');
        const verifiedUuidIdx = relatedSection.indexOf('#### Verified Related-Treatment UUIDs');
        const awaitingUuidIdx = relatedSection.indexOf('#### Awaiting UUID Assignment');

        const getBlockText = (start, end) => {
            if (start === -1) return '';
            const stop = end === -1 ? relatedSection.length : end;
            return relatedSection.substring(start, stop).trim();
        };

        const relatedNamesText = getBlockText(relatedNamesIdx, verifiedUuidIdx !== -1 ? verifiedUuidIdx : awaitingUuidIdx);
        const verifiedUuidText = getBlockText(verifiedUuidIdx, awaitingUuidIdx);
        const awaitingUuidText = getBlockText(awaitingUuidIdx, -1);

        parsed.relatedTreatmentNames = relatedNamesText.split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('*'))
            .map(line => line.substring(1).trim());

        if (verifiedUuidText) {
            parsed.verifiedRelatedTreatmentIds = verifiedUuidText.split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith('*'))
                .map(line => {
                    const match = line.match(/`([a-f0-9-]{36})`/i);
                    return match ? match[1] : null;
                }).filter(Boolean);
        }
    }

    // Typical Appointment Duration
    parsed.typicalAppointmentDuration = parseHeadingValue('Typical Appointment Duration');
    // Typical Number of Visits
    parsed.typicalNumberOfVisits = parseHeadingValue('Typical Number of Visits');
    // Anaesthesia or Sedation
    parsed.anaesthesiaOrSedation = parseHeadingValue('Anaesthesia or Sedation');

    // Benefits
    const benefitsText = parseHeadingRaw('Benefits');
    if (benefitsText) {
        const items = benefitsText.split(/\r?\n\s*\r?\n/);
        let bCount = 0;
        for (const item of items) {
            const lines = item.split('\n').map(l => l.trim()).filter(Boolean);
            let title = '', description = '', sortOrder = 0;
            for (const line of lines) {
                if (line.toLowerCase().startsWith('* title:')) {
                    title = line.replace(/^\*\s*Title:\s*/i, '').trim();
                } else if (line.toLowerCase().startsWith('* description:')) {
                    description = line.replace(/^\*\s*Description:\s*/i, '').trim();
                } else if (line.toLowerCase().startsWith('* sort order:')) {
                    sortOrder = parseInt(line.replace(/^\*\s*Sort order:\s*/i, '').trim(), 10);
                }
            }
            if (title && description) {
                bCount++;
                parsed.benefits.push({
                    title,
                    description,
                    sortOrder: sortOrder || bCount
                });
            }
        }
    }

    // Expected Outcome
    parsed.expectedOutcome = parseHeadingValue('Expected Outcome');
    // Expected Longevity
    parsed.expectedLongevity = parseHeadingValue('Expected Longevity');
    // Suitable Candidates
    parsed.suitableCandidates = parseList('Who Is This Treatment Suitable For\\?');
    // Unsuitable Candidates
    parsed.unsuitableCandidates = parseList('Unsuitable Candidates or Contraindications');

    // Alternative Treatments
    const altText = parseHeadingRaw('Alternative Treatments');
    if (altText) {
        const items = altText.split(/\r?\n\s*\r?\n/);
        for (const item of items) {
            const cleanItem = item.trim();
            if (cleanItem.startsWith('* **')) {
                const titleMatch = cleanItem.match(/^\*\s*\*\*(.*?)\*\*/);
                const title = titleMatch ? titleMatch[1].trim() : '';
                const desc = cleanItem.replace(/^\*\s*\*\*.*?\*\*/, '').trim();
                parsed.alternativeTreatments.push({ title, description: desc });
            }
        }
    }

    // Before-Treatment Preparation
    parsed.beforeTreatmentPreparation = parseList('Before-Treatment Preparation');

    // Procedure Steps
    const procedureStepsText = parseHeadingRaw('Procedure Steps');
    if (procedureStepsText) {
        const items = procedureStepsText.split(/\r?\n\s*\r?\n/);
        let stepCount = 0;
        for (const item of items) {
            const lines = item.split('\n').map(l => l.trim()).filter(Boolean);
            const textBlock = lines.join(' ');
            const stepMatch = textBlock.match(/^(\d+)\.\s*\*\*(.*?)\*\*\s*(.*)$/);
            if (stepMatch) {
                stepCount++;
                parsed.procedureSteps.push({
                    title: stepMatch[2].trim(),
                    description: stepMatch[3].trim(),
                    sortOrder: stepCount
                });
            }
        }
    }

    // Recovery and Downtime
    parsed.recoveryAndDowntime = parseHeadingValue('Recovery and Downtime');
    // Risks and Limitations
    parsed.risksAndLimitations = parseHeadingValue('Risks and Limitations');
    // Aftercare
    parsed.aftercare = parseList('Aftercare');
    // When to Contact the Clinic
    parsed.whenToContactClinic = parseHeadingValue('When to Contact the Clinic');
    // When to Book a Consultation
    parsed.whenToBookConsultation = parseHeadingValue('When to Book a Consultation');

    // FAQs
    const faqKeys = ['FAQ 1', 'FAQ 2', 'FAQ 3', 'FAQ 4', 'FAQ 5', 'FAQ 6', 'FAQ 7', 'FAQ 8'];
    for (const faqKey of faqKeys) {
        const faqText = parseHeadingRaw(faqKey);
        if (faqText) {
            const qMatch = faqText.match(/Question:\s*(.*)/i);
            const ansIdx = faqText.indexOf('Answer:');
            const question = qMatch ? qMatch[1].split('\n')[0].trim() : '';
            let answer = '';
            if (ansIdx !== -1) {
                answer = faqText.substring(ansIdx + 'Answer:'.length).trim();
            }
            if (question && answer) {
                parsed.faqs.push({
                    question: cleanValue(question),
                    answer: cleanValue(answer)
                });
            }
        }
    }

    // Pricing
    parsed.pricingDisplayType = parseHeadingValue('Pricing Display Type');
    parsed.pricingDisplayText = parseHeadingValue('Pricing Display');
    parsed.pricingNote = parseHeadingValue('Pricing Note');
    parsed.lastPriceVerificationDate = parseHeadingValue('Last Price Verification Date');
    parsed.currency = parseHeadingValue('Currency');

    // Media
    parsed.imageAltText = parseHeadingValue('Image Alt Text');

    // Clinical Governance
    parsed.writtenBy = parseHeadingValue('Written By');
    parsed.clinicallyReviewedBy = parseHeadingValue('Clinically Reviewed By');
    parsed.reviewerCredentials = parseHeadingValue('Reviewer Credentials');
    parsed.clinicalReviewerId = parseHeadingValue('Clinical Reviewer');
    parsed.lastClinicallyReviewedOn = parseHeadingValue('Last Clinically Reviewed On');
    parsed.revisionNote = parseHeadingValue('Revision Note');

    // References helper
    const parseReferenceField = (block, field) => {
        const regex = new RegExp(`\\*\\*${field}:\\*\\*\\s*(.*?)\\s*(\\r?\\n|$)`, 'i');
        const match = block.match(regex);
        if (match && match[1]) return match[1].trim();
        const fallbackRegex = new RegExp(`${field}:\\*?\\*?\\s*(.*?)\\s*(\\r?\\n|$)`, 'i');
        const fbMatch = block.match(fallbackRegex);
        return fbMatch && fbMatch[1] ? fbMatch[1].trim() : '';
    };

    // References
    const refText = parseHeadingRaw('Clinical References');
    if (refText) {
        const refItems = refText.split(/\r?\n\s*\r?\n/);
        for (const refItem of refItems) {
            const cleanRef = refItem.trim();
            if (/^\d+\.\s*\*\*Title:\*\*/i.test(cleanRef) || /^\d+\.\s*Title:/i.test(cleanRef)) {
                parsed.clinicalReferences.push({
                    title: parseReferenceField(cleanRef, 'Title'),
                    organisation: parseReferenceField(cleanRef, 'Publishing organisation'),
                    authorOrGuidelineGroup: parseReferenceField(cleanRef, 'Author or guideline group'),
                    publicationOrRevisionDate: parseReferenceField(cleanRef, 'Publication or revision date'),
                    url: parseReferenceField(cleanRef, 'Direct source URL'),
                    accessedDate: parseReferenceField(cleanRef, 'Date accessed'),
                    supports: parseReferenceField(cleanRef, 'Which statements the reference supports|supports')
                });
            }
        }
    }

    // SEO Meta Tags
    parsed.primarySearchPhrase = parseHeadingValue('Primary Search Phrase');
    parsed.secondarySearchPhrases = parseList('Secondary Search Phrases');
    parsed.seoTitle = parseHeadingValue('SEO Title');
    parsed.seoDescription = parseHeadingValue('SEO Description');
    parsed.canonicalUrl = parseHeadingValue('Canonical URL Override');
    const indexStr = parseHeadingValue('Allow Search Indexing');
    parsed.allowIndexing = indexStr.toLowerCase().startsWith('yes');
    parsed.socialTitle = parseHeadingValue('Social Title');
    parsed.socialDescription = parseHeadingValue('Social Description');
    parsed.socialImageUrl = parseHeadingValue('Social Image URL');
    parsed.structuredDataType = parseHeadingValue('Structured-Data Type');

    // Publishing
    parsed.publishStatus = parseHeadingValue('Publish Status') || 'draft';
    parsed.scheduledPublishTime = parseHeadingValue('Scheduled Publish Time');
    const featStr = parseHeadingValue('Featured Treatment');
    parsed.featured = featStr.toLowerCase().startsWith('yes');
    const sortStr = parseHeadingValue('Sort Order');
    parsed.sortOrder = parseInt(sortStr, 10) || 1;

    // Record Status Details
    const recordStatusText = parseHeadingRaw('Record Status');
    if (recordStatusText) {
        const verifMatch = recordStatusText.match(/\*\s*Clinic verification required:\s*(.*)/i);
        if (verifMatch) parsed.clinicVerificationRequired = verifMatch[1].trim().toLowerCase().startsWith('yes');
        const priorityMatch = recordStatusText.match(/\*\s*Clinical review priority:\s*(.*)/i);
        if (priorityMatch) parsed.clinicalReviewPriority = priorityMatch[1].trim();
    }

    // Perform placeholder cleanup transformations
    cleanPlaceholders(parsed);

    return parsed;
}

function cleanPlaceholders(parsed) {
    if (!CLINIC_IMPORT_CONFIG.city) {
        parsed.secondarySearchPhrases = parsed.secondarySearchPhrases.filter(
            phrase => !phrase.includes('[CLINIC CITY]')
        );
        if (parsed.socialTitle.includes('[CLINIC CITY]')) parsed.socialTitle = '';
        if (parsed.socialDescription.includes('[CLINIC CITY]')) parsed.socialDescription = '';
    }

    if (!CLINIC_IMPORT_CONFIG.area) {
        parsed.secondarySearchPhrases = parsed.secondarySearchPhrases.filter(
            phrase => !phrase.includes('[CLINIC AREA]')
        );
        if (parsed.socialTitle.includes('[CLINIC AREA]')) parsed.socialTitle = '';
        if (parsed.socialDescription.includes('[CLINIC AREA]')) parsed.socialDescription = '';
    }

    if (!CLINIC_IMPORT_CONFIG.contentAuthorName) {
        parsed.writtenBy = null;
    }
    if (!CLINIC_IMPORT_CONFIG.clinicalReviewerName) {
        parsed.clinicallyReviewedBy = null;
    }
    if (!CLINIC_IMPORT_CONFIG.reviewerCredentials) {
        parsed.reviewerCredentials = null;
    }
    if (!CLINIC_IMPORT_CONFIG.clinicalReviewerUserId) {
        parsed.clinicalReviewerId = null;
    }

    const placeholderFields = ['writtenBy', 'clinicallyReviewedBy', 'reviewerCredentials', 'clinicalReviewerId'];
    for (const f of placeholderFields) {
        if (PLACEHOLDERS.some(p => parsed[f] && parsed[f].includes(p))) {
            parsed[f] = null;
        }
    }

    if (PLACEHOLDERS.some(p => parsed.lastClinicallyReviewedOn && parsed.lastClinicallyReviewedOn.includes(p))) {
        parsed.lastClinicallyReviewedOn = null;
    }
    if (PLACEHOLDERS.some(p => parsed.lastPriceVerificationDate && parsed.lastPriceVerificationDate.includes(p))) {
        parsed.lastPriceVerificationDate = null;
    }
    if (PLACEHOLDERS.some(p => parsed.socialImageUrl && parsed.socialImageUrl.includes(p))) {
        parsed.socialImageUrl = null;
    }

    for (const p of PLACEHOLDERS) {
        if (parsed.shortDescription && parsed.shortDescription.includes(p)) {
            parsed.shortDescription = '';
        }
        if (parsed.treatmentOverview && parsed.treatmentOverview.includes(p)) {
            parsed.treatmentOverview = '';
        }
    }
}

export function validateImportData(records) {
    const errors = [];
    const warnings = [];

    console.log(`[Validation] Running dry-run validation on ${records.length} records...`);

    if (records.length !== 94) {
        errors.push(`Expected 94 treatment records, found ${records.length}`);
    }

    const numbers = records.map(r => r.sourceNumber).sort((a, b) => a - b);
    for (let i = 1; i <= 94; i++) {
        if (numbers[i - 1] !== i) {
            errors.push(`Gap in treatment numbers: missing treatment number ${i}`);
        }
    }

    const names = new Set();
    const slugs = new Set();
    const primaryPhrases = new Set();
    const seoTitles = new Set();
    const seoDescriptions = new Set();

    let totalFaqs = 0;
    let totalRefs = 0;

    for (const r of records) {
        if (names.has(r.name)) errors.push(`Duplicate canonical name found: "${r.name}"`);
        names.add(r.name);

        if (slugs.has(r.slug)) errors.push(`Duplicate slug found: "${r.slug}"`);
        slugs.add(r.slug);

        if (primaryPhrases.has(r.primarySearchPhrase)) {
            errors.push(`Duplicate primary search phrase found: "${r.primarySearchPhrase}"`);
        }
        primaryPhrases.add(r.primarySearchPhrase);

        if (seoTitles.has(r.seoTitle)) {
            errors.push(`Duplicate SEO title found: "${r.seoTitle}"`);
        }
        seoTitles.add(r.seoTitle);

        if (seoDescriptions.has(r.seoDescription)) {
            errors.push(`Duplicate SEO description found: "${r.seoDescription}"`);
        }
        seoDescriptions.add(r.seoDescription);

        totalFaqs += r.faqs.length;
        if (r.faqs.length !== 8) {
            errors.push(`Treatment ${r.sourceNumber} has ${r.faqs.length} FAQs, expected 8`);
        }

        totalRefs += r.clinicalReferences.length;
        if (r.clinicalReferences.length !== 4) {
            errors.push(`Treatment ${r.sourceNumber} has ${r.clinicalReferences.length} clinical references, expected 4`);
        }

        if (r.shortDescription.length > 220) {
            errors.push(`Treatment ${r.sourceNumber} short description exceeds 220 chars (${r.shortDescription.length}): "${r.shortDescription}"`);
        }
        if (r.treatmentOverview.length > 2400) {
            errors.push(`Treatment ${r.sourceNumber} overview exceeds 2400 chars (${r.treatmentOverview.length})`);
        }
        if (r.seoTitle.length > 60) {
            errors.push(`Treatment ${r.sourceNumber} SEO title exceeds 60 chars (${r.seoTitle.length}): "${r.seoTitle}"`);
        }
        if (r.seoDescription.length > 160) {
            errors.push(`Treatment ${r.sourceNumber} SEO description exceeds 160 chars (${r.seoDescription.length}): "${r.seoDescription}"`);
        }

        for (const p of PLACEHOLDERS) {
            const checkString = (fVal, fName) => {
                if (fVal && String(fVal).includes(p)) {
                    errors.push(`Treatment ${r.sourceNumber} contains placeholder "${p}" in field "${fName}"`);
                }
            };
            checkString(r.name, 'name');
            checkString(r.slug, 'slug');
            checkString(r.shortDescription, 'shortDescription');
            checkString(r.treatmentOverview, 'treatmentOverview');
            checkString(r.seoTitle, 'seoTitle');
            checkString(r.seoDescription, 'seoDescription');
            checkString(r.socialTitle, 'socialTitle');
            checkString(r.socialDescription, 'socialDescription');
            checkString(r.writtenBy, 'writtenBy');
            checkString(r.clinicallyReviewedBy, 'clinicallyReviewedBy');
            checkString(r.reviewerCredentials, 'reviewerCredentials');
            checkString(r.clinicalReviewerId, 'clinicalReviewerId');
        }

        if (r.publishStatus !== 'draft') {
            errors.push(`Treatment ${r.sourceNumber} status is "${r.publishStatus}", expected "draft"`);
        }
        if (r.allowIndexing) {
            errors.push(`Treatment ${r.sourceNumber} has indexing enabled, expected disabled`);
        }
    }

    if (totalFaqs !== 752) errors.push(`Total FAQs is ${totalFaqs}, expected 752`);
    if (totalRefs !== 376) errors.push(`Total clinical references is ${totalRefs}, expected 376`);

    console.log(`[Validation Complete] Errors: ${errors.length}, Warnings: ${warnings.length}`);
    return { errors, warnings };
}

const isMain = process.argv[1] && (process.argv[1].endsWith('validate-treatment-import.mjs') || process.argv[1].endsWith('validate-treatment-import.js'));
if (isMain) {
    try {
        const records = parseMarkdown(MASTER_FILE);
        const { errors, warnings } = validateImportData(records);
        if (errors.length > 0) {
            console.error('[Validation FAILED] Errors found:');
            errors.forEach(e => console.error(` - ${e}`));
            process.exit(1);
        } else {
            console.log('[Validation PASSED] No validation errors found! Clean to import.');
            process.exit(0);
        }
    } catch (err) {
        console.error('[Fatal Error] Validation script failed:', err);
        process.exit(1);
    }
}
