const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function verify() {
    try {
        const { rows } = await sql`SELECT user_id, count(*) as count FROM expenses GROUP BY user_id ORDER BY count DESC`;
        console.log('--- Database Count Stats ---');
        console.table(rows);
        
        const { rows: sample } = await sql`SELECT * FROM expenses WHERE user_id = 'jolie' LIMIT 5`;
        console.log('--- Sample Data (jolie) ---');
        console.table(sample);
    } catch (err) {
        console.error('Error during verification:', err);
    }
    process.exit(0);
}

verify();
