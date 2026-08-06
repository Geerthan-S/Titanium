import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = readFileSync('.env', 'utf8');
const envUrl = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!envUrl || !serviceKey) {
    console.error('ERROR: Missing Supabase credentials');
    process.exit(1);
}

const client = createClient(envUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

console.log('📋 DATABASE CONTENT STATUS REPORT\n');

// Check doctors
console.log('👨‍⚕️  DOCTORS');
console.log('━'.repeat(60));
const { data: doctors, error: doctorsError } = await client
    .from('doctors')
    .select('id, name, status, featured')
    .order('created_at');

if (doctorsError) {
    console.error('❌ Error:', doctorsError.message);
} else if (!doctors || doctors.length === 0) {
    console.log('⚠️  No doctors found in database');
} else {
    console.log(`Total doctors: ${doctors.length}\n`);
    const statusGroups = doctors.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
    }, {});

    Object.entries(statusGroups).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
    });

    console.log('\nDoctors list:');
    doctors.forEach((d, i) => {
        console.log(`  ${i + 1}. ${d.name} - Status: ${d.status}, Featured: ${d.featured || false}`);
    });
}

console.log('\n');

// Check testimonials
console.log('💬 TESTIMONIALS');
console.log('━'.repeat(60));
const { data: testimonials, error: testimonialsError } = await client
    .from('testimonials')
    .select('id, display_name, status, moderation_status, consent_status, featured')
    .order('created_at');

if (testimonialsError) {
    console.error('❌ Error:', testimonialsError.message);
} else if (!testimonials || testimonials.length === 0) {
    console.log('⚠️  No testimonials found in database');
} else {
    console.log(`Total testimonials: ${testimonials.length}\n`);

    console.log('Status breakdown:');
    const statusGroups = testimonials.reduce((acc, t) => {
        const key = `${t.status}/${t.moderation_status}/${t.consent_status}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    Object.entries(statusGroups).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
    });

    console.log('\nTestimonials list:');
    testimonials.slice(0, 10).forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.display_name} - Status: ${t.status}, Moderation: ${t.moderation_status}, Consent: ${t.consent_status}, Featured: ${t.featured || false}`);
    });

    if (testimonials.length > 10) {
        console.log(`  ... and ${testimonials.length - 10} more`);
    }
}

console.log('\n' + '━'.repeat(60));
console.log('💡 NEXT STEPS:');
console.log('  1. Use the admin panel to publish doctors and approve testimonials');
console.log('  2. Or run a script to batch update their statuses');
console.log('  3. Then run mark-featured.mjs to mark them as featured');
