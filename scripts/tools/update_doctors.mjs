import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(envUrl, serviceKey);

const newDoctors = [
    { name: 'Dr. E. Rajkumar', specialization: 'Prosthodontics' },
    { name: 'Dr. K. Ashok Kumar', specialization: 'Prosthodontics' },
    { name: 'Dr. Tiruvikrama Narayanan', specialization: 'Oral and Maxillofacial Surgery' },
    { name: 'Dr. Sriram', specialization: 'Oral and Maxillofacial Surgery' },
    { name: 'Dr. Shasidharan', specialization: 'Conservative Dentistry and Endodontics' },
    { name: 'Dr. Sarvesh Ram', specialization: 'Conservative Dentistry and Endodontics' },
    { name: 'Dr. Abirami', specialization: 'Orthodontics' },
    { name: 'Dr. Arulkumaran', specialization: 'Orthodontics' },
    { name: 'Dr. Premkumar', specialization: 'Periodontics' },
    { name: 'Dr. Vasanth Kumar', specialization: 'Periodontics' },
    { name: 'Dr. Catherine', specialization: 'Pedodontics' },
    { name: 'Dr. Fagath', specialization: 'Pedodontics' }
];

async function updateDoctors() {
    console.log('Archiving existing doctors...');
    await supabase
        .from('doctors')
        .update({ status: 'archived' })
        .neq('status', 'archived');

    console.log('Preparing new doctors for insertion...');
    const records = newDoctors.map((doc, i) => {
        // Generate an SEO-friendly slug
        const slug = doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        return {
            name: doc.name,
            slug: slug,
            designation: 'Consulting Specialist',
            specialization: doc.specialization,
            specialties: [doc.specialization],
            biography: `Consultant specializing in ${doc.specialization}.`,
            status: 'published',
            sort_order: i + 1
        };
    });

    const { data, error } = await supabase.from('doctors').insert(records);
    if (error) {
        console.error('Error inserting doctors:', error);
    } else {
        console.log(`Successfully inserted ${records.length} doctors!`);
    }
}

updateDoctors();
