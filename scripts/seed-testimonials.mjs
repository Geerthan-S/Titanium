import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

// Load env manually
let envUrl, envKey;
try {
    const env = readFileSync('.env', 'utf8');
    envUrl = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
    envKey = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
        || env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1]?.trim();
} catch {
    envUrl = process.env.VITE_SUPABASE_URL;
    envKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
}

if (!envUrl || !envKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const client = createClient(envUrl, envKey);

const testimonials = [
    {
        display_name: 'Rajesh Patel',
        treatment_label: 'Dental Implants',
        rating: 5,
        review: 'I was hesitant about getting dental implants, but Dr. Rajesh Kumar made the entire process so comfortable. The results are amazing and I can finally smile confidently again!',
        image_path: null,
        video_url: null,
        video_thumbnail_url: null,
        publication_permission: true,
        source: 'website',
        consent_status: 'confirmed',
        consent_at: new Date().toISOString(),
        moderation_status: 'approved',
        status: 'published',
        featured: true,
        sort_order: 1,
    },
    {
        display_name: 'Anita Sharma',
        treatment_label: 'Orthodontic Treatment',
        rating: 5,
        review: 'Dr. Priya Sharma transformed my smile with Invisalign. She was patient, explained everything clearly, and the results exceeded my expectations. Highly recommend!',
        image_path: null,
        video_url: null,
        video_thumbnail_url: null,
        publication_permission: true,
        source: 'website',
        consent_status: 'confirmed',
        consent_at: new Date().toISOString(),
        moderation_status: 'approved',
        status: 'published',
        featured: true,
        sort_order: 2,
    },
    {
        display_name: 'Vikram Reddy',
        treatment_label: 'Root Canal Treatment',
        rating: 5,
        review: 'I had severe tooth pain and Dr. Anil Mehta performed a painless root canal. His expertise and gentle approach made what I thought would be a terrible experience completely manageable.',
        image_path: null,
        video_url: null,
        video_thumbnail_url: null,
        publication_permission: true,
        source: 'website',
        consent_status: 'confirmed',
        consent_at: new Date().toISOString(),
        moderation_status: 'approved',
        status: 'published',
        featured: true,
        sort_order: 3,
    },
    {
        display_name: 'Priya Desai',
        treatment_label: 'Teeth Whitening',
        rating: 5,
        review: 'The teeth whitening treatment at Titanium Roots gave me the bright smile I always wanted. The staff was professional and the clinic environment is so welcoming!',
        image_path: null,
        video_url: null,
        video_thumbnail_url: null,
        publication_permission: true,
        source: 'website',
        consent_status: 'confirmed',
        consent_at: new Date().toISOString(),
        moderation_status: 'approved',
        status: 'published',
        featured: true,
        sort_order: 4,
    },
    {
        display_name: 'Suresh Kumar',
        treatment_label: 'Crown & Bridge',
        rating: 5,
        review: 'Excellent service! Dr. Rajesh Kumar fitted my dental crown perfectly. The attention to detail and quality of work is outstanding.',
        image_path: null,
        video_url: null,
        video_thumbnail_url: null,
        publication_permission: true,
        source: 'website',
        consent_status: 'confirmed',
        consent_at: new Date().toISOString(),
        moderation_status: 'approved',
        status: 'published',
        featured: false,
        sort_order: 5,
    },
    {
        display_name: 'Kavita Singh',
        treatment_label: 'Children\'s Dentistry',
        rating: 5,
        review: 'Dr. Sneha Patel is amazing with kids! My 6-year-old was nervous but she made him so comfortable. He actually looks forward to dental visits now!',
        image_path: null,
        video_url: null,
        video_thumbnail_url: null,
        publication_permission: true,
        source: 'website',
        consent_status: 'confirmed',
        consent_at: new Date().toISOString(),
        moderation_status: 'approved',
        status: 'published',
        featured: false,
        sort_order: 6,
    },
];

console.log('💬 SEEDING TESTIMONIALS\n');

const { data, error } = await client
    .from('testimonials')
    .insert(testimonials)
    .select('id, display_name, treatment_label, status, featured');

if (error) {
    console.error('❌ Insert failed:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    process.exit(1);
}

console.log('✅ Successfully inserted testimonials:\n');
data.forEach((t) => {
    const tag = t.featured ? '★ FEATURED' : '         ';
    console.log(`  [${tag}] ${t.status.toUpperCase()} — ${t.display_name} (${t.treatment_label})`);
});

console.log('\n✨ Done! Refresh the home page to see featured testimonials in the "Patient Testimonials" section.\n');
