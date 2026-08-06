import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(envUrl, serviceKey);

const keepNames = [
    'Dr. E. Rajkumar',
    'Dr. K. Ashok Kumar',
    'Dr. Tiruvikrama Narayanan',
    'Dr. Sriram',
    'Dr. Shasidharan',
    'Dr. Sarvesh Ram',
    'Dr. Abirami',
    'Dr. Arulkumaran',
    'Dr. Premkumar',
    'Dr. Vasanth Kumar',
    'Dr. Catherine',
    'Dr. Fagath'
];

async function deleteOldDoctors() {
    console.log('Fetching all doctors...');
    const { data: doctors, error } = await supabase.from('doctors').select('id, name');

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    const toDelete = doctors.filter(d => !keepNames.includes(d.name));

    if (toDelete.length === 0) {
        console.log('No legacy doctors found to delete.');
        return;
    }

    console.log(`Found ${toDelete.length} legacy doctors. Deleting...`);

    const ids = toDelete.map(d => d.id);

    const { error: delError } = await supabase.from('doctors').delete().in('id', ids);

    if (delError) {
        console.error('Error deleting:', delError);
    } else {
        console.log(`Successfully deleted ${toDelete.length} legacy doctors from the database!`);
    }
}

deleteOldDoctors();
