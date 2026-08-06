import { requireSupabase } from '../assets/js/data/supabase-client.js';

async function checkSchema() {
    console.log("Checking treatments table schema...");

    // Try inserting an archived status directly to see if it throws a constraint error
    const { error } = await requireSupabase().from('treatments').update({ status: 'archived' }).eq('id', 'non-existent-id');
    if (error) {
        console.error("Error updating status to archived:", error);
    } else {
        console.log("No error on update check (or constraint is deferred/missing id means no check applied).");
    }

    // Also query status column type
    const { data, error: colError } = await requireSupabase()
        .rpc('get_column_info', { table_name: 'treatments' })
        .catch(() => ({ error: 'no rpc' }));

    if (data) {
        console.log("Column info:", data);
    }

    process.exit(0);
}

checkSchema();
