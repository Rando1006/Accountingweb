const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function check() {
    try {
        const { rows } = await sql`SELECT user_id, count(*) as count FROM expenses GROUP BY user_id ORDER BY count DESC`;
        console.log('FINAL_STATS_START');
        console.log(JSON.stringify(rows));
        console.log('FINAL_STATS_END');
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();
