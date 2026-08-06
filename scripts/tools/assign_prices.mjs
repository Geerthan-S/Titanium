import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(envUrl, serviceKey);

// Realistic high-end Indian dental pricing rules
const pricingRules = [
    { match: /implant|all-on-4/i, min: 35000, max: 250000, type: 'starting_from' },
    { match: /braces|invisalign|orthodontic/i, min: 40000, max: 150000, type: 'price_range' },
    { match: /aligner/i, min: 60000, max: 250000, type: 'starting_from' },
    { match: /root canal|endodontic/i, min: 5000, max: 12000, type: 'price_range' },
    { match: /crown|bridge/i, min: 8000, max: 25000, type: 'price_range' },
    { match: /veneer|smile makeover|lumineers/i, min: 12000, max: 80000, type: 'starting_from' },
    { match: /whitening|bleaching/i, min: 10000, max: 20000, type: 'price_range' },
    { match: /cleaning|scaling/i, min: 2000, max: 5000, type: 'price_range' },
    { match: /extraction|wisdom/i, min: 3000, max: 15000, type: 'price_range' },
    { match: /filling|restoration/i, min: 2000, max: 6000, type: 'price_range' },
    { match: /pediatric|child/i, min: 1500, max: 5000, type: 'starting_from' },
    { match: /denturist|denture/i, min: 15000, max: 50000, type: 'price_range' },
    { match: /gum|periodontal/i, min: 5000, max: 25000, type: 'price_range' },
    { match: /consultation|exam/i, min: 1000, max: 2000, type: 'exact_price' },
    { match: /guard|splint/i, min: 3000, max: 8000, type: 'price_range' },
];

function determinePricing(name) {
    for (const rule of pricingRules) {
        if (rule.match.test(name)) return { min: rule.min, max: rule.max, type: rule.type };
    }
    // Default general dental procedure ranges
    return { min: 2000, max: 15000, type: 'price_range' };
}

async function updatePrices() {
    console.log("Fetching all treatments...");
    const { data, error } = await supabase.from('treatments').select('id, name').order('name');

    if (error) {
        console.error("Error:", error);
        return;
    }

    let markdown = `# Titanium Roots Treatment Pricing (Estimated High-End INR)\n\n`;
    markdown += `| Treatment | Status | Pricing Display Type | Min (₹) | Max (₹) |\n`;
    markdown += `|---|---|---|---|---|\n`;

    for (const treatment of data) {
        const { min, max, type } = determinePricing(treatment.name);

        // Update the database
        await supabase.from('treatments').update({
            pricing_display_type: type,
            min_price: min,
            max_price: max,
            currency: 'INR',
            pricing_status: 'published'
        }).eq('id', treatment.id);

        markdown += `| ${treatment.name} | Updated | \`${type}\` | ₹${min.toLocaleString('en-IN')} | ₹${max ? max.toLocaleString('en-IN') : '-'} |\n`;
    }

    writeFileSync(resolve(process.cwd(), 'treat.md'), markdown, 'utf8');
    console.log(`Successfully mapped and updated pricing for ${data.length} treatments.`);
}

updatePrices();
