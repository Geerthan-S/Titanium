import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(envUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
    // get a valid admin
    const { data: admin } = await supabase.from('cms_admins').select('user_id').limit(1).single();
    const adminId = admin ? admin.user_id : null;

    // 1. Get Root "Website Images" folder or create it
    let res = await supabase.from('media_folders').select('*').eq('name', 'Website Images').is('parent_id', null).single();
    let websiteImagesId = res.data?.id;

    if (!websiteImagesId && adminId) {
        const { data, error } = await supabase.from('media_folders').insert({
            name: 'Website Images',
            parent_id: null,
            created_by: adminId
        }).select().single();
        websiteImagesId = data?.id;
    }

    // 2. Get "Treatments" folder under "Website Images"
    if (websiteImagesId) {
        res = await supabase.from('media_folders').select('*').eq('name', 'Treatments').eq('parent_id', websiteImagesId).single();
        let treatmentsId = res.data?.id;

        if (!treatmentsId && adminId) {
            const { data, error } = await supabase.from('media_folders').insert({
                name: 'Treatments',
                parent_id: websiteImagesId,
                created_by: adminId
            }).select().single();
            treatmentsId = data?.id;
        }
        console.log('Treatments folder ID:', treatmentsId);
        writeFileSync('folder_id.txt', treatmentsId);
    }
}

main();
