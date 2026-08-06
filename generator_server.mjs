import express from 'express';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import crypto from 'node:crypto';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(process.cwd()));

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(envUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

app.post('/api/save-image', async (req, res) => {
    try {
        const { slug, dataUrl, altText, id } = req.body;
        console.log(`Processing ${slug}...`);

        // Check if already processed
        // We will process all unconditionally unless handled earlier
        const { data: treatment, error: tErr } = await supabase.from('treatments').select('*').eq('id', id).single();
        if (tErr || !treatment) {
            console.error('Treatment not found:', slug);
            return res.status(404).json({ error: 'Not found' });
        }

        if (treatment.image_path) {
            console.log(`Skipping ${slug}, already has an image.`);
            return res.json({ success: true, skipped: true });
        }

        // Get folder ID
        let folderRes = await supabase.from('media_folders').select('id').eq('name', 'Treatments').maybeSingle();
        let folderId = folderRes.data?.id;

        // Process image from dataUrl
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        const imgBuffer = Buffer.from(base64Data, 'base64');

        let image = sharp(imgBuffer);
        const metadata = await image.metadata();
        image = image.rotate().keepMetadata();
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

        const fileUuid = crypto.randomUUID();
        const filenameToStore = `gallery/${folderId || 'root'}/${slug}.webp`;

        const { error: sErr } = await supabase.storage
            .from('cms-media')
            .upload(filenameToStore, processedBuffer, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: true,
            });

        if (sErr) throw new Error(sErr.message);

        const { data: publicUrlData } = supabase.storage.from('cms-media').getPublicUrl(filenameToStore);
        const publicUrl = publicUrlData.publicUrl;

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
        if (aErr) console.error('Asset err:', aErr.message);

        const { error: uErr } = await supabase.from('treatments').update({
            image_path: publicUrl,
            image_alt: altText
        }).eq('id', treatment.id);

        if (uErr) throw new Error(uErr.message);

        console.log(`Success: ${slug}`);
        res.json({ success: true, url: publicUrl });

    } catch (err) {
        console.error('Save error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(4321, () => {
    console.log('Server listening on http://localhost:4321');
});
