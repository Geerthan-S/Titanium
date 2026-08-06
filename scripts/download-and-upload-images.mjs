import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const env = readFileSync('.env', 'utf8');
const envUrl = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const client = createClient(envUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const jobs = [
    {
        type: 'doctor',
        id: '5032bbc2-a1e7-4d00-b5a9-a1869f8b8765',
        url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=500&auto=format&fit=crop&q=80',
        storagePath: 'doctors/5032bbc2-a1e7-4d00-b5a9-a1869f8b8765/avatar-alex-smith.jpg',
        table: 'doctors',
        updateField: 'portrait_path',
    },
    {
        type: 'doctor',
        id: '213435a3-c0ae-4b43-8816-69bba9be7c9c',
        url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&auto=format&fit=crop&q=80',
        storagePath: 'doctors/213435a3-c0ae-4b43-8816-69bba9be7c9c/avatar-jane-roe.jpg',
        table: 'doctors',
        updateField: 'portrait_path',
    },
    {
        type: 'testimonial',
        id: '7d07cc73-63fb-4e67-854f-1782527a2a9a',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        storagePath: 'testimonials/7d07cc73-63fb-4e67-854f-1782527a2a9a/john-doe.jpg',
        table: 'testimonials',
        updateField: 'image_path',
    },
    {
        type: 'testimonial',
        id: '9696b36b-5a5e-4197-b6f7-1c28bea83b35',
        url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        storagePath: 'testimonials/9696b36b-5a5e-4197-b6f7-1c28bea83b35/alice.jpg',
        table: 'testimonials',
        updateField: 'image_path',
    },
    {
        type: 'blog',
        id: '8506cf9d-6350-440c-9434-8447ea41a731',
        url: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800&auto=format&fit=crop&q=80',
        storagePath: 'blogs/8506cf9d-6350-440c-9434-8447ea41a731/flossing.jpg',
        table: 'blog_posts',
        updateField: 'image_path',
    },
    {
        type: 'blog',
        id: 'c4844126-f088-4f45-a253-35a357719a07',
        url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80',
        storagePath: 'blogs/c4844126-f088-4f45-a253-35a357719a07/checkup.jpg',
        table: 'blog_posts',
        updateField: 'image_path',
    },
    {
        type: 'blog',
        id: '8f9ceeb0-185c-4800-8624-723b8b880115',
        url: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80',
        storagePath: 'blogs/8f9ceeb0-185c-4800-8624-723b8b880115/sensitivity.jpg',
        table: 'blog_posts',
        updateField: 'image_path',
    }
];

// Ensure a temp dir for downloaded files
mkdirSync('temp_images', { recursive: true });

for (const job of jobs) {
    console.log(`Processing ${job.type} ID ${job.id}...`);
    try {
        // 1. Download
        console.log(`- Downloading from ${job.url}...`);
        const res = await fetch(job.url);
        if (!res.ok) throw new Error(`Download failed with status ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());

        // Save locally under cache dir for inspection/backup
        const filename = job.storagePath.split('/').pop();
        const localPath = join('temp_images', filename);
        writeFileSync(localPath, buffer);
        console.log(`- Saved local backup to ${localPath}`);

        // 2. Upload to Supabase Storage
        console.log(`- Uploading to Supabase Storage: cms-media/${job.storagePath}...`);
        const { data: uploadData, error: uploadErr } = await client.storage
            .from('cms-media')
            .upload(job.storagePath, buffer, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (uploadErr) {
            console.error(`- Upload failed: ${uploadErr.message}`);
            // Continue anyway because it might already exist or need override
        } else {
            console.log(`- Upload success: ${uploadData.path}`);
        }

        // 3. Update Database Record
        console.log(`- Updating database ${job.table} ID ${job.id}...`);
        const { error: dbErr } = await client
            .from(job.table)
            .update({ [job.updateField]: job.storagePath })
            .eq('id', job.id);

        if (dbErr) {
            console.error(`- DB update failed: ${dbErr.message}`);
        } else {
            console.log(`- DB update success`);
        }
    } catch (err) {
        console.error(`Status error on job: ${err.message}`);
    }
    console.log('---');
}

console.log('Done processing all images.');
