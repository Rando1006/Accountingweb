const postgres = require('postgres');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function runMigration() {
  console.log('Starting migration...');
  
  const keywords = ['美甲', '頭髮', '美妝', '保養', '衣服'];
  const keywordPattern = keywords.map(k => `%${k}%`);
  
  try {
    const result = await sql`
      UPDATE expenses 
      SET category = '治裝' 
      WHERE category IN ('購物', '其他') 
        AND (
          item LIKE ANY (${keywordPattern})
        )
    `;
    
    console.log(`Migration completed. Rows updated: ${result.count}`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
