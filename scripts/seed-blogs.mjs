import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

// Load env manually since this runs outside Vite
let envUrl, envKey;
try {
    const env = readFileSync('.env', 'utf8');
    envUrl = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
    envKey = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
        || env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1]?.trim()
        || env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
} catch {
    envUrl = process.env.VITE_SUPABASE_URL;
    envKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
}

if (!envUrl || !envKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const client = createClient(envUrl, envKey);

const blogs = [
    {
        title: 'Why Regular Dental Check-Ups Matter More Than You Think',
        slug: 'why-regular-dental-checkups-matter',
        category: 'Preventive Care',
        tags: ['preventive care', 'check-ups', 'oral health', 'dental hygiene'],
        excerpt: 'Many patients visit a dentist only when something hurts. But regular check-ups help catch problems early, when they are easiest and least expensive to treat.',
        content_html: '<p>Many patients visit a dentist only when something hurts. This is understandable — dental visits can feel daunting, and if there is no obvious pain, it is easy to push them aside. But waiting until a problem becomes painful often means waiting until it has grown significantly more complex.</p><p>Regular dental check-ups — typically recommended every six to twelve months — serve several important purposes beyond simply cleaning your teeth.</p><h2>Early Detection of Problems</h2><p>Dental decay rarely causes pain in its earliest stages. By the time a cavity is painful, it has usually progressed deep enough to require more extensive treatment — sometimes a root canal rather than a simple filling. A routine check-up can catch these issues when they are much smaller and far simpler to manage.</p><p>The same principle applies to gum disease. Early gum inflammation (gingivitis) is reversible with professional cleaning and improved home care. But if it advances to periodontitis, the damage to the underlying bone becomes irreversible. Routine assessments mean your dentist can identify early signs and step in before lasting harm occurs.</p><h2>Oral Cancer Screening</h2><p>During a routine examination, your dentist will also screen for early signs of oral cancer — abnormal tissue changes that may not yet be causing any discomfort. Like most cancers, oral cancer responds far better to treatment when detected at an early stage.</p><h2>Personalised Preventive Advice</h2><p>Your dental health is shaped by your habits, diet, bite pattern, medications, and medical history. A regular check-up gives your dentist the opportunity to understand your individual situation and offer specific guidance — advice that goes beyond generic brushing tips to address your actual circumstances.</p><h2>Managing Dental Anxiety</h2><p>For many patients, one of the greatest benefits of regular visits is comfort. When dental visits are infrequent, small problems tend to accumulate, making each visit feel more overwhelming. Regular check-ups — where each visit tends to be shorter and less involved — often help reduce dental anxiety over time.</p>',
        author_name: 'Titanium Roots Editorial Team',
        publish_at: '2026-08-01T09:00:00+05:30',
        status: 'published',
        featured: true,
        trending: false,
        seo_title: 'Why Regular Dental Check-Ups Matter | Titanium Roots',
        seo_description: 'Understand the importance of regular dental check-ups — from early problem detection to oral cancer screening and personalised preventive care.',
        sort_order: 30,
    },
    {
        title: 'Understanding Tooth Sensitivity: Causes, Management, and When to See a Dentist',
        slug: 'understanding-tooth-sensitivity',
        category: 'Patient Education',
        tags: ['tooth sensitivity', 'enamel', 'gum health', 'patient education', 'oral care'],
        excerpt: 'A sharp twinge when drinking something cold or hot is one of the most common dental complaints. Understanding what causes sensitivity — and what to do about it — can save you from unnecessary discomfort.',
        content_html: '<p>A sharp twinge when drinking something cold, warm, or sweet is one of the most common reasons patients visit the dentist between regular check-ups. Tooth sensitivity affects a large proportion of adults at some point, yet it is often dismissed as simply "the way things are." In most cases, it is not.</p><h2>What Causes Tooth Sensitivity?</h2><p>The outer layer of your tooth — enamel — protects the more sensitive dentine layer beneath. When enamel is worn away or when the gum tissue recedes and exposes the root surface, the dentine becomes exposed. Dentine contains tiny channels that connect to the nerve of the tooth, allowing temperature changes and sweet or acidic stimuli to trigger a pain response.</p><p>Common causes of exposed dentine include:</p><ul><li>Enamel erosion from acidic foods and drinks</li><li>Gum recession due to aggressive brushing or gum disease</li><li>Tooth grinding (bruxism), which gradually wears down the enamel surface</li><li>Cracked teeth, where dentine becomes exposed along the fracture line</li><li>Recently completed dental treatment, which can cause temporary sensitivity</li></ul><h2>Managing Sensitivity at Home</h2><p>Desensitising toothpastes containing potassium nitrate or stannous fluoride can provide meaningful relief for many patients when used consistently over several weeks. Using a soft-bristled toothbrush and avoiding acidic or very cold food immediately after brushing are also helpful steps.</p><p>However, managing symptoms at home is not the same as addressing the underlying cause. If the enamel loss is continuing or the gum recession is progressing, the sensitivity is likely to worsen over time without professional assessment.</p><h2>When Should You See a Dentist?</h2><p>If sensitivity is sharp and immediate, affects specific teeth rather than being generalised, persists after the trigger is removed, or has appeared recently without an obvious explanation, a professional examination is recommended. These patterns can indicate a cavity, a cracked tooth, or gum disease — all of which require clinical management rather than desensitising toothpaste alone.</p>',
        author_name: 'Titanium Roots Editorial Team',
        publish_at: '2026-08-03T09:00:00+05:30',
        status: 'published',
        featured: true,
        trending: false,
        seo_title: 'Understanding Tooth Sensitivity | Titanium Roots',
        seo_description: 'Learn what causes tooth sensitivity, how to manage it at home, and when a professional dental assessment is the right next step.',
        sort_order: 31,
    },
];

const { data, error } = await client
    .from('blog_posts')
    .upsert(blogs, { onConflict: 'slug' })
    .select('id, slug, title, status, featured');

if (error) {
    console.error('Insert failed:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    process.exit(1);
}

console.log('\nSuccessfully inserted/updated blog posts:\n');
data.forEach((b) => {
    const tag = b.featured ? '★ FEATURED' : '         ';
    console.log(`  [${tag}] ${b.status.toUpperCase()} — ${b.title}`);
});
console.log('\nDone. Refresh the home page to see these posts in the "From Our Blog" section.\n');
