import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

try {
    const env = readFileSync('.env', 'utf8');
    const envUrl = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
    const serviceKey = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

    const client = createClient(envUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log('=== LIST COLUMNS ===');
    const checkTables = ['media_assets', 'media_folders', 'gallery_items', 'gallery_collections'];
    for (const t of checkTables) {
        try {
            const { data: rows, error: err } = await client.from(t).select('*').limit(1);
            if (err) {
                console.log(`Table ${t}: Error (${err.message})`);
            } else {
                console.log(`Table ${t}: OK`);
                const keys = Object.keys(rows[0] || {});
                for (const k of keys) {
                    console.log(`  - ${k}`);
                }
            }
        } catch (inner) {
            console.log(`Table ${t}: Exception (${inner.message})`);
        }
    }
    console.log('=== END ===');
} catch (outer) {
    console.error('Outer script failure:', outer);
}
