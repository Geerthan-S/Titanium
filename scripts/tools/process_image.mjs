import { readFileSync, statSync } from 'node:fs';
import { resolve, parse } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
if (args.length < 3) {
    console.error('Usage: node process_image.mjs <treatment_slug> <local_image_path> "<image_alt>"');
    process.exit(1);
}
const [slug, localImagePath, altText] = args;

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(envUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
    // 1. Get folder ID for 'Treatments'
    let folderRes = await supabase.from('media_folders').select('id, parent_id').eq('name', 'Treatments').maybeSingle();
    let folderId = folderRes.data?.id;
    if (!folderId) {
        console.error('Treatments folder not found!');
        process.exit(1);
    }

    // 2. Load the treatment
    const { data: treatment, error: tErr } = await supabase.from('treatments').select('*').eq('slug', slug).single();
    if (tErr || !treatment) {
        console.error('Treatment not found:', slug);
        process.exit(1);
    }

    // 3. Process the image using Sharp -> WebP
    const imgBuffer = readFileSync(localImagePath);
    let image = sharp(imgBuffer);
    const metadata = await image.metadata();

    image = image.rotate().keepMetadata();
    // resize logic similar to gallery API
    if (metadata.width > 2048 || metadata.height > 2048) {
        image = image.resize({
            width: metadata.width > metadata.height ? 2048 : undefined,
            height: metadata.height >= metadata.width ? 2048 : undefined,
            fit: 'inside',
            withoutEnlargement: true,
        });
    }
    image = image.webp({ quality: 85 });
    const processedBuffer = await image.toBuffer();
    const finalMeta = await sharp(processedBuffer).metadata();

    // 4. Upload to storage
    const fileUuid = crypto.randomUUID();
    const filenameToStore = `gallery/${folderId}/${slug}.webp`;

    const { error: sErr } = await supabase.storage
        .from('cms-media')
        .upload(filenameToStore, processedBuffer, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: true,
        });

    if (sErr) {
        console.error('Upload error:', sErr.message);
        process.exit(1);
    }

    const { data: publicUrlData } = supabase.storage.from('cms-media').getPublicUrl(filenameToStore);
    const publicUrl = publicUrlData.publicUrl;

    // 5. Upsert media_assets
    const title = parse(localImagePath).name;
    const { data: asset, error: aErr } = await supabase.from('media_assets').upsert({
        title: treatment.name,
        cloudinary_public_id: filenameToStore,
        secure_url: publicUrl,
        resource_type: 'image',
        format: 'webp',
        folder_id: folderId,
        bytes: processedBuffer.length,
        width: finalMeta.width,
        height: finalMeta.height,
        alt_text: altText
    }, { onConflict: 'cloudinary_public_id' }).select().single();

    if (aErr) console.error('Asset upsert error:', aErr.message);

    // 6. Link to Treatment
    const localGalleryPath = `/cms-media/${filenameToStore}`; // Typical local path formatting in gallery

    const { error: uErr } = await supabase.from('treatments').update({
        image_path: publicUrl, // or localGalleryPath depending on schema expectations!
        image_alt: altText
    }).eq('id', treatment.id);

    if (uErr) {
        console.error('Treatment update error:', uErr.message);
        process.exit(1);
    }

    console.log(`SUCCESS: Linked ${slug} -> ${publicUrl}`);
}
main();
