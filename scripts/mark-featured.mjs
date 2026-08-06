import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Read environment variables
const env = readFileSync('.env', 'utf8');
const envUrl = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!envUrl || !serviceKey) {
    console.error('ERROR: Missing Supabase credentials in .env file');
    console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const client = createClient(envUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

console.log('🚀 Starting featured items marker...\n');

async function markDoctorsFeatured() {
    console.log('👨‍⚕️  DOCTORS');
    console.log('━'.repeat(50));

    // Fetch all published doctors
    const { data: doctors, error: fetchError } = await client
        .from('doctors')
        .select('id, name, specialization, featured, status')
        .eq('status', 'published')
        .order('sort_order');

    if (fetchError) {
        console.error('❌ Error fetching doctors:', fetchError.message);
        return;
    }

    if (!doctors || doctors.length === 0) {
        console.log('⚠️  No published doctors found');
        return;
    }

    console.log(`Found ${doctors.length} published doctor(s)\n`);

    // Mark first 3 doctors as featured
    const toFeature = doctors.slice(0, 3);

    for (const doctor of toFeature) {
        if (doctor.featured) {
            console.log(`✓ ${doctor.name} - Already featured`);
            continue;
        }

        const { error: updateError } = await client
            .from('doctors')
            .update({ featured: true })
            .eq('id', doctor.id);

        if (updateError) {
            console.error(`❌ Failed to feature ${doctor.name}:`, updateError.message);
        } else {
            console.log(`✅ Marked as featured: ${doctor.name} (${doctor.specialization})`);
        }
    }

    console.log('');
}

async function markTestimonialsFeatured() {
    console.log('💬 TESTIMONIALS');
    console.log('━'.repeat(50));

    // Fetch all approved testimonials
    const { data: testimonials, error: fetchError } = await client
        .from('testimonials')
        .select('id, display_name, treatment_label, featured, status, moderation_status, consent_status')
        .eq('status', 'published')
        .eq('moderation_status', 'approved')
        .eq('consent_status', 'confirmed')
        .order('sort_order');

    if (fetchError) {
        console.error('❌ Error fetching testimonials:', fetchError.message);
        return;
    }

    if (!testimonials || testimonials.length === 0) {
        console.log('⚠️  No approved testimonials found');
        return;
    }

    console.log(`Found ${testimonials.length} approved testimonial(s)\n`);

    // Mark first 4 testimonials as featured
    const toFeature = testimonials.slice(0, 4);

    for (const testimonial of toFeature) {
        if (testimonial.featured) {
            console.log(`✓ ${testimonial.display_name} - Already featured`);
            continue;
        }

        const { error: updateError } = await client
            .from('testimonials')
            .update({ featured: true })
            .eq('id', testimonial.id);

        if (updateError) {
            console.error(`❌ Failed to feature ${testimonial.display_name}:`, updateError.message);
        } else {
            console.log(`✅ Marked as featured: ${testimonial.display_name} (${testimonial.treatment_label})`);
        }
    }

    console.log('');
}

async function showFeaturedSummary() {
    console.log('📊 FEATURED ITEMS SUMMARY');
    console.log('━'.repeat(50));

    // Count featured doctors
    const { count: doctorCount, error: doctorError } = await client
        .from('doctors')
        .select('*', { count: 'exact', head: true })
        .eq('featured', true)
        .eq('status', 'published');

    if (!doctorError) {
        console.log(`👨‍⚕️  Featured Doctors: ${doctorCount}`);
    }

    // Count featured testimonials
    const { count: testimonialCount, error: testimonialError } = await client
        .from('testimonials')
        .select('*', { count: 'exact', head: true })
        .eq('featured', true)
        .eq('status', 'published')
        .eq('moderation_status', 'approved')
        .eq('consent_status', 'confirmed');

    if (!testimonialError) {
        console.log(`💬 Featured Testimonials: ${testimonialCount}`);
    }

    console.log('');
}

// Run the script
try {
    await markDoctorsFeatured();
    await markTestimonialsFeatured();
    await showFeaturedSummary();

    console.log('✨ Done! Featured items have been updated.');
    console.log('💡 Tip: Visit the home page to see the featured items displayed.');
} catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
}
