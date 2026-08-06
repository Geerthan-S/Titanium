import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PassThrough } from 'node:stream';
import Busboy from 'busboy';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

// Load Supabase options
const envPath = resolve(process.cwd(), '.env');
let envUrl = process.env.VITE_SUPABASE_URL;
let serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!envUrl || !serviceKey) {
    try {
        const envContent = readFileSync(envPath, 'utf8');
        envUrl = envUrl || envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
        serviceKey = serviceKey || envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
    } catch (e) {
        // Ignore, let envVars fallback
    }
}

const supabase = envUrl && serviceKey ? createClient(envUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
}) : null;

// Configurable constants
const CONFIG = {
    MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
    WEBP_QUALITY: 85,
    MAX_DIMENSIONS: 2048,
    ALLOWED_MIME_TYPES: new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
};

// Helper: send JSON response
function sendJson(res, statusCode, body) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
}

// Helper: verify admin using token
async function verifyAdmin(req) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) return null;
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    // Verify admin profiles
    const { data: admin } = await supabase
        .from('cms_admins')
        .select('is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

    return admin?.is_active ? user : null;
}

// Parse request body for standard JSON
function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(err);
            }
        });
    });
}

// Magic bytes validation for MIME types
function estimateMimeType(buffer) {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
    if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
    if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
    const str = buffer.toString('utf8', 0, Math.min(buffer.length, 100)).trim();
    if (str.startsWith('<svg') || str.includes('<svg') || str.startsWith('<?xml')) return 'image/svg+xml';
    return null;
}

// Handle all gallery endpoints
export default async function handler(req, res) {
    try {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname.replace(/^\/api\/gallery/, '');
        const method = req.method;

        // 1. Unauthorized checks for mutating actions
        const isMutating = method !== 'GET';
        const user = isMutating ? await verifyAdmin(req) : null;
        if (isMutating && !user) {
            return sendJson(res, 401, { error: 'Unauthorized: Admin privileges required' });
        }

        // --- GET /api/gallery?folderId=... ---
        if (pathname === '' && method === 'GET') {
            const folderParam = url.searchParams.get('folderId');
            const folderId = folderParam === 'null' || !folderParam ? null : folderParam;

            if (!supabase) return sendJson(res, 500, { error: 'Database config missing' });

            // Get folders in current directory
            let folderQuery = supabase.from('media_folders').select('*');
            if (!folderId) {
                folderQuery = folderQuery.is('parent_id', null);
            } else {
                folderQuery = folderQuery.eq('parent_id', folderId);
            }
            const { data: folders, error: fErr } = await folderQuery;
            if (fErr) {
                console.error('[gallery] media_folders query error:', fErr);
                return sendJson(res, 500, { error: fErr.message });
            }

            // Get images in current directory
            let assetsQuery = supabase.from('media_assets').select('*');
            if (!folderId) {
                assetsQuery = assetsQuery.is('folder_id', null);
            } else {
                assetsQuery = assetsQuery.eq('folder_id', folderId);
            }
            const { data: assets, error: aErr } = await assetsQuery;
            if (aErr) {
                console.error('[gallery] media_assets query error:', aErr);
                return sendJson(res, 500, { error: aErr.message });
            }

            return sendJson(res, 200, { folders, assets });
        }

        // --- GET /api/gallery/search?q=... ---
        if (pathname === '/search' && method === 'GET') {
            const query = url.searchParams.get('q') || '';
            if (!supabase) return sendJson(res, 500, { error: 'Database config missing' });

            const { data: folders, error: fErr } = await supabase
                .from('media_folders')
                .select('*')
                .ilike('name', `%${query}%`);
            if (fErr) return sendJson(res, 500, { error: fErr.message });

            const { data: assets, error: aErr } = await supabase
                .from('media_assets')
                .select('*')
                .ilike('title', `%${query}%`);
            if (aErr) return sendJson(res, 500, { error: aErr.message });

            return sendJson(res, 200, { folders, assets });
        }

        // --- POST /api/gallery/folders ---
        if (pathname === '/folders' && method === 'POST') {
            const body = await parseJsonBody(req);
            const name = body.name?.trim();
            const parentId = body.parentId || null;
            if (!name) return sendJson(res, 400, { error: 'Folder name is required' });

            // Path traversal/unsafe validation
            if (name.includes('/') || name.includes('\\') || name.startsWith('.')) {
                return sendJson(res, 400, { error: 'Invalid folder name' });
            }

            const { data: newFolder, error: err } = await supabase
                .from('media_folders')
                .insert({ name, parent_id: parentId, created_by: user.id })
                .select()
                .single();
            if (err) {
                console.error('[gallery] create folder error:', err);
                return sendJson(res, 500, { error: err.message });
            }
            return sendJson(res, 201, newFolder);
        }

        // --- PUT /api/gallery/folders/:id ---
        if (pathname.startsWith('/folders/') && method === 'PUT') {
            const folderId = pathname.split('/')[2];
            if (!folderId) return sendJson(res, 400, { error: 'Folder ID is required' });
            const body = await parseJsonBody(req);
            const name = body.name?.trim();
            if (!name) return sendJson(res, 400, { error: 'Folder name is required' });

            if (name.includes('/') || name.includes('\\') || name.startsWith('.')) {
                return sendJson(res, 400, { error: 'Invalid folder name' });
            }

            const { data: updated, error: err } = await supabase
                .from('media_folders')
                .update({ name, updated_at: new Date().toISOString() })
                .eq('id', folderId)
                .select()
                .single();
            if (err) return sendJson(res, 500, { error: err.message });
            return sendJson(res, 200, updated);
        }

        // --- DELETE /api/gallery/folders/:id?recursive=true ---
        if (pathname.startsWith('/folders/') && method === 'DELETE') {
            const folderId = pathname.split('/')[2];
            if (!folderId) return sendJson(res, 400, { error: 'Folder ID is required' });
            const recursive = url.searchParams.get('recursive') === 'true';

            const deleteHelper = async (fid) => {
                // Find subfolders
                const { data: subs } = await supabase.from('media_folders').select('id').eq('parent_id', fid);
                for (const sub of subs || []) {
                    await deleteHelper(sub.id);
                }

                // Find media assets
                const { data: files } = await supabase.from('media_assets').select('id, secure_url').eq('folder_id', fid);
                for (const file of files || []) {
                    // Remove from Storage
                    const storagePath = file.secure_url.split('/cms-media/')[1] || file.secure_url;
                    const { error: sErr } = await supabase.storage.from('cms-media').remove([storagePath]);
                    if (sErr) throw new Error(`Failed to remove file from storage: ${storagePath}`);

                    // Remove from database
                    const { error: dErr } = await supabase.from('media_assets').delete().eq('id', file.id);
                    if (dErr) throw new Error(dErr.message);
                }

                // Delete the folder itself
                const { error: fErr } = await supabase.from('media_folders').delete().eq('id', fid);
                if (fErr) throw new Error(fErr.message);
            };

            // Check if folder is empty if not recursive
            if (!recursive) {
                const { data: foldersCount } = await supabase.from('media_folders').select('id', { count: 'exact' }).eq('parent_id', folderId);
                const { data: assetsCount } = await supabase.from('media_assets').select('id', { count: 'exact' }).eq('folder_id', folderId);
                if ((foldersCount?.length || 0) > 0 || (assetsCount?.length || 0) > 0) {
                    return sendJson(res, 400, { error: 'Folder is not empty. Confirmation required for recursive deletion.' });
                }
            }

            await deleteHelper(folderId);
            return sendJson(res, 200, { success: true });
        }

        // --- PUT /api/gallery/files/:id ---
        if (pathname.startsWith('/files/') && method === 'PUT') {
            const fileId = pathname.split('/')[2];
            if (!fileId) return sendJson(res, 400, { error: 'File ID is required' });
            const body = await parseJsonBody(req);
            const title = body.title?.trim();
            if (!title) return sendJson(res, 400, { error: 'Title is required' });

            const { data: updated, error: err } = await supabase
                .from('media_assets')
                .update({ title, updated_at: new Date().toISOString() })
                .eq('id', fileId)
                .select()
                .single();
            if (err) return sendJson(res, 500, { error: err.message });
            return sendJson(res, 200, updated);
        }

        // --- DELETE /api/gallery/files/:id ---
        if (pathname.startsWith('/files/') && method === 'DELETE') {
            const fileId = pathname.split('/')[2];
            if (!fileId) return sendJson(res, 400, { error: 'File ID is required' });

            const { data: file, error: fetchErr } = await supabase
                .from('media_assets')
                .select('id, secure_url')
                .eq('id', fileId)
                .single();
            if (fetchErr || !file) return sendJson(res, 404, { error: 'File not found' });

            const storagePath = file.secure_url.split('/cms-media/')[1] || file.secure_url;
            const { error: sErr } = await supabase.storage.from('cms-media').remove([storagePath]);
            if (sErr) return sendJson(res, 500, { error: `Failed to remove file from storage: ${sErr.message}` });

            const { error: dbErr } = await supabase.from('media_assets').delete().eq('id', fileId);
            if (dbErr) return sendJson(res, 500, { error: dbErr.message });

            return sendJson(res, 200, { success: true });
        }

        // --- POST /api/gallery/upload ---
        if (pathname === '/upload' && method === 'POST') {
            const busboy = Busboy({ headers: req.headers, limits: { fileSize: CONFIG.MAX_UPLOAD_SIZE } });
            let uploadedFileBuffer = null;
            let originalFilename = '';
            let parentFolderId = null;

            busboy.on('field', (name, val) => {
                if (name === 'folderId' && val && val !== 'null') {
                    parentFolderId = val;
                }
            });

            busboy.on('file', (name, fileStream, info) => {
                const { filename, mimeType } = info;
                originalFilename = filename;
                const chunks = [];

                fileStream.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                fileStream.on('end', () => {
                    uploadedFileBuffer = Buffer.concat(chunks);
                });
            });

            busboy.on('finish', async () => {
                if (!uploadedFileBuffer) {
                    return sendJson(res, 400, { error: 'No file uploaded' });
                }

                // Validate actual MIME type
                const realMime = estimateMimeType(uploadedFileBuffer);
                if (!realMime || !CONFIG.ALLOWED_MIME_TYPES.has(realMime)) {
                    return sendJson(res, 400, { error: 'Invalid file format. Upload JPG, JPEG, PNG, WebP or SVG only.' });
                }

                try {
                    let processedBuffer = uploadedFileBuffer;
                    let filenameToStore = '';
                    let mimeToStore = realMime;
                    let width = null;
                    let height = null;

                    const fileUuid = crypto.randomUUID();

                    if (realMime === 'image/svg+xml') {
                        filenameToStore = `gallery/${parentFolderId || 'root'}/${fileUuid}.svg`;
                        // Unsafe script filters (prevent basic malicious tags)
                        const contentString = processedBuffer.toString('utf8');
                        if (contentString.includes('<script') || contentString.toLowerCase().includes('javascript:')) {
                            return sendJson(res, 400, { error: 'Blocked: SVG contains executable script code.' });
                        }
                    } else {
                        // Process Image (sharp)
                        let image = sharp(processedBuffer);
                        const metadata = await image.metadata();

                        // Auto EXIF orientation correction, strip metadata
                        image = image.rotate().keepMetadata();

                        // Preserving quality Visually Lossless
                        if (realMime === 'image/webp') {
                            // Optimise WebP only
                            image = image.webp({ quality: CONFIG.WEBP_QUALITY });
                            processedBuffer = await image.toBuffer();
                            const finalMeta = await sharp(processedBuffer).metadata();
                            width = finalMeta.width;
                            height = finalMeta.height;
                        } else {
                            // JPG, PNG -> WebP
                            if (metadata.width > CONFIG.MAX_DIMENSIONS || metadata.height > CONFIG.MAX_DIMENSIONS) {
                                image = image.resize({
                                    width: metadata.width > metadata.height ? CONFIG.MAX_DIMENSIONS : undefined,
                                    height: metadata.height >= metadata.width ? CONFIG.MAX_DIMENSIONS : undefined,
                                    fit: 'inside',
                                    withoutEnlargement: true,
                                });
                            }
                            image = image.webp({ quality: CONFIG.WEBP_QUALITY });
                            processedBuffer = await image.toBuffer();

                            const finalMeta = await sharp(processedBuffer).metadata();
                            width = finalMeta.width;
                            height = finalMeta.height;
                        }

                        filenameToStore = `gallery/${parentFolderId || 'root'}/${fileUuid}.webp`;
                        mimeToStore = 'image/webp';
                    }

                    // Upload to Supabase Storage
                    const { data: sData, error: sErr } = await supabase.storage
                        .from('cms-media')
                        .upload(filenameToStore, processedBuffer, {
                            contentType: mimeToStore,
                            cacheControl: '3600',
                            upsert: false,
                        });

                    if (sErr) throw new Error(sErr.message);

                    // Get Public URL
                    const { data: { publicUrl } } = supabase.storage.from('cms-media').getPublicUrl(filenameToStore);

                    // Insert into SQL Database
                    const originalTitle = originalFilename.replace(/\.[^/.]+$/, '');
                    const { data: record, error: dbErr } = await supabase
                        .from('media_assets')
                        .insert({
                            title: originalTitle,
                            cloudinary_public_id: filenameToStore,
                            secure_url: publicUrl,
                            resource_type: 'image',
                            format: mimeToStore.split('/')[1],
                            folder_id: parentFolderId,
                            bytes: processedBuffer.length,
                            width,
                            height,
                            alt_text: originalTitle,
                        })
                        .select()
                        .single();

                    if (dbErr) {
                        // Rollback Storage
                        await supabase.storage.from('cms-media').remove([filenameToStore]);
                        throw new Error(dbErr.message);
                    }

                    return sendJson(res, 200, record);

                } catch (err) {
                    return sendJson(res, 500, { error: err.message });
                }
            });

            // Buffer the raw body first — Vite's connect middleware may have
            // partially consumed the IncomingMessage stream, so we must collect
            // all chunks before handing them to busboy.
            const rawChunks = [];
            await new Promise((resolve, reject) => {
                req.on('data', (chunk) => rawChunks.push(chunk));
                req.on('end', resolve);
                req.on('error', reject);
            });
            const rawBody = Buffer.concat(rawChunks);

            const passthrough = new PassThrough();
            passthrough.end(rawBody);
            passthrough.pipe(busboy);
            return;
        }

        sendJson(res, 404, { error: 'Not Found' });

    } catch (err) {
        sendJson(res, 500, { error: err.message });
    }
}
