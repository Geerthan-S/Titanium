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

const doctors = [
    {
        name: 'Dr. Rajesh Kumar',
        slug: 'dr-rajesh-kumar',
        designation: 'Chief Dental Surgeon',
        qualification: 'BDS, MDS (Prosthodontics)',
        additional_qualifications: 'Advanced Implantology Certificate, Aesthetic Dentistry Diploma',
        specialization: 'Prosthodontics & Dental Implants',
        specialties: ['Dental Implants', 'Full Mouth Rehabilitation', 'Crown & Bridge', 'Cosmetic Dentistry'],
        experience_years: 15,
        languages: ['English', 'Hindi', 'Tamil'],
        registration_number: 'DC-12345-2009',
        biography: 'Dr. Rajesh Kumar is a highly skilled prosthodontist with over 15 years of experience in advanced dental care. He specializes in dental implants and full mouth rehabilitation, helping patients restore their smiles with precision and care. His patient-centered approach ensures that every treatment is tailored to individual needs.',
        philosophy: 'I believe in combining advanced dental technology with compassionate care to deliver the best outcomes for my patients.',
        consultation: 'Available for consultations Monday through Saturday. Evening appointments available on request.',
        availability: 'Mon-Sat: 9:00 AM - 6:00 PM',
        portrait_path: null,
        image_alt: 'Portrait of Dr. Rajesh Kumar',
        featured: true,
        status: 'published',
        sort_order: 1,
    },
    {
        name: 'Dr. Priya Sharma',
        slug: 'dr-priya-sharma',
        designation: 'Orthodontist',
        qualification: 'BDS, MDS (Orthodontics)',
        additional_qualifications: 'Invisalign Certified Provider',
        specialization: 'Orthodontics & Dentofacial Orthopedics',
        specialties: ['Braces', 'Invisalign', 'Orthodontic Treatment', 'Smile Design'],
        experience_years: 10,
        languages: ['English', 'Hindi', 'Kannada'],
        registration_number: 'DC-23456-2014',
        biography: 'Dr. Priya Sharma is a dedicated orthodontist passionate about creating beautiful, healthy smiles. With expertise in both traditional braces and modern Invisalign treatment, she helps patients of all ages achieve optimal dental alignment.',
        philosophy: 'Every smile tells a story. My goal is to help you write yours with confidence.',
        consultation: 'Complimentary initial orthodontic consultations available.',
        availability: 'Mon-Fri: 10:00 AM - 7:00 PM, Sat: 9:00 AM - 2:00 PM',
        portrait_path: null,
        image_alt: 'Portrait of Dr. Priya Sharma',
        featured: true,
        status: 'published',
        sort_order: 2,
    },
    {
        name: 'Dr. Anil Mehta',
        slug: 'dr-anil-mehta',
        designation: 'Endodontist',
        qualification: 'BDS, MDS (Conservative Dentistry & Endodontics)',
        additional_qualifications: 'Microscopic Endodontics Certification',
        specialization: 'Root Canal Treatment & Endodontics',
        specialties: ['Root Canal Treatment', 'Microscopic Endodontics', 'Tooth Preservation', 'Dental Pain Management'],
        experience_years: 12,
        languages: ['English', 'Hindi', 'Gujarati'],
        registration_number: 'DC-34567-2012',
        biography: 'Dr. Anil Mehta specializes in saving teeth through advanced endodontic procedures. Using state-of-the-art microscopic technology, he performs painless root canal treatments with exceptional precision.',
        philosophy: 'Saving natural teeth is always the best option. I use the latest technology to ensure comfortable, successful treatments.',
        consultation: 'Emergency dental pain consultations available same-day.',
        availability: 'Mon-Sat: 9:00 AM - 5:00 PM',
        portrait_path: null,
        image_alt: 'Portrait of Dr. Anil Mehta',
        featured: true,
        status: 'published',
        sort_order: 3,
    },
    {
        name: 'Dr. Sneha Patel',
        slug: 'dr-sneha-patel',
        designation: 'Pediatric Dentist',
        qualification: 'BDS, MDS (Pedodontics)',
        additional_qualifications: 'Child Psychology in Dentistry Certificate',
        specialization: 'Pediatric Dentistry',
        specialties: ['Children\'s Dentistry', 'Preventive Care', 'Dental Education', 'Behavior Management'],
        experience_years: 8,
        languages: ['English', 'Hindi', 'Marathi'],
        registration_number: 'DC-45678-2016',
        biography: 'Dr. Sneha Patel has a special gift for making children comfortable during dental visits. Her gentle approach and fun, engaging manner help young patients develop positive associations with dental care from an early age.',
        philosophy: 'Building trust with children is the foundation of good dental health that lasts a lifetime.',
        consultation: 'Child-friendly consultation room with toys and games available.',
        availability: 'Mon-Fri: 10:00 AM - 6:00 PM, Sat: 9:00 AM - 1:00 PM',
        portrait_path: null,
        image_alt: 'Portrait of Dr. Sneha Patel',
        featured: false,
        status: 'published',
        sort_order: 4,
    },
];

console.log('🦷 SEEDING DOCTORS\n');

const { data, error } = await client
    .from('doctors')
    .upsert(doctors, { onConflict: 'slug' })
    .select('id, slug, name, status, featured');

if (error) {
    console.error('❌ Insert failed:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    process.exit(1);
}

console.log('✅ Successfully inserted/updated doctors:\n');
data.forEach((d) => {
    const tag = d.featured ? '★ FEATURED' : '         ';
    console.log(`  [${tag}] ${d.status.toUpperCase()} — ${d.name}`);
});

console.log('\n✨ Done! Refresh the home page to see featured doctors in the "Meet Our Specialists" section.\n');
