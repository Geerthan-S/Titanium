import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(envUrl, serviceKey);

const treatmentPrices = [
    { matcher: /aligner|invisalign/i, price: 60000 },
    { matcher: /braces/i, price: 30000 },
    { matcher: /implant/i, price: 30000 },
    { matcher: /denture/i, price: 15000 },
    { matcher: /zirconia/i, price: 10000 },
    { matcher: /crown|bridge/i, price: 5000 },
    { matcher: /root canal|rct|pulpectomy/i, price: 4500 },
    { matcher: /extraction|wisdom/i, price: 1000 },
    { matcher: /filling|restoration|composite/i, price: 1500 },
    { matcher: /cleaning|polishing|scaling/i, price: 1500 },
    { matcher: /whitening/i, price: 8000 },
    { matcher: /consultation|check-up/i, price: 500 },
    { matcher: /x-ray/i, price: 300 },
    { matcher: /pediatric|child/i, price: 1000 },
    { matcher: /surgery|grafting|sinus|flap|apicoectomy/i, price: 15000 },
    { matcher: /space|habit|retainer/i, price: 3000 },
    { matcher: /gum/i, price: 2000 }
];

function getPrice(name) {
    for (const rule of treatmentPrices) {
        if (rule.matcher.test(name)) return rule.price;
    }
    return 2500;
}

async function run() {
    const { data: treatments, error: fetchErr } = await supabase
        .from('treatments')
        .select('*')
        .order('sort_order', { ascending: true });

    if (fetchErr) {
        console.error("Error fetching treatments:", fetchErr);
        return;
    }

    if (!treatments || treatments.length === 0) {
        console.log("No treatments found.");
        return;
    }

    let i = 0;
    for (const t of treatments) {
        const payload = {
            pricing_display_type: 'starting_from',
            min_price: getPrice(t.name)
        };

        // Add image for all except first
        if (i !== 0) {
            payload.image_path = '/assets/images/home/clinic-reception.webp';
        }

        console.log(`Updating [${i}] ${t.name}: Price -> ${payload.min_price}`);

        const { error: updateErr } = await supabase.from('treatments').update(payload).eq('id', t.id);
        if (updateErr) {
            console.error(`Error updating ${t.name}:`, updateErr.message);
        }
        i++;
    }

    console.log(`Successfully updated ${i} treatments with pricing and images.`);
}

run();
