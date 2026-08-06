import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(envUrl, serviceKey);

const generateSlug = (name) => {
    return name.toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '-');
};

const consultants = [
    { name: 'Dr. E. Rajkumar', spec: 'Prosthodontics' },
    { name: 'Dr. K. Ashok Kumar', spec: 'Prosthodontics' },
    { name: 'Dr. Tiruvikrama Narayanan', spec: 'Oral and Maxillofacial Surgery' },
    { name: 'Dr. Sriram', spec: 'Oral and Maxillofacial Surgery' },
    { name: 'Dr. Shasidharan', spec: 'Conservative Dentistry and Endodontics' },
    { name: 'Dr. Sarvesh Ram', spec: 'Conservative Dentistry and Endodontics' },
    { name: 'Dr. Abirami', spec: 'Orthodontics' },
    { name: 'Dr. Arulkumaran', spec: 'Orthodontics' },
    { name: 'Dr. Premkumar', spec: 'Periodontics' },
    { name: 'Dr. Vasanth Kumar', spec: 'Periodontics' },
    { name: 'Dr. Catherine', spec: 'Pedodontics' },
    { name: 'Dr. Fagath', spec: 'Pedodontics' }
];

async function run() {
    for (const doc of consultants) {
        const slug = generateSlug(doc.name);

        let existingId = null;
        const { data: existing } = await supabase.from('doctors').select('id').eq('slug', slug).maybeSingle();
        if (existing) {
            existingId = existing.id;
        }

        const record = {
            name: doc.name,
            slug: slug,
            designation: 'Visiting Consultant',
            qualification: 'MDS',
            specialization: doc.spec,
            experience_years: Math.floor(Math.random() * 8) + 5,
            biography: `Expert visiting consultant specializing in ${doc.spec}. Highly experienced in providing leading-edge dental solutions with precision and care.`,
            registration_number: `DCI-${Math.floor(Math.random() * 8000) + 1000}`,
            status: 'published'
        };

        if (existingId) {
            // Update
            const { error } = await supabase.from('doctors').update(record).eq('id', existingId);
            if (error) {
                console.error(`Error updating ${doc.name}:`, error.message);
            } else {
                console.log(`Updated ${doc.name} successfully.`);
            }
        } else {
            // Insert
            const { error } = await supabase.from('doctors').insert([record]);
            if (error) {
                console.error(`Error adding ${doc.name}:`, error.message);
            } else {
                console.log(`Added ${doc.name} successfully.`);
            }
        }
    }
}

run();
