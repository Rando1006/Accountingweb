
import { createPool } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const pool = createPool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  console.log('Starting migration...');
  
  const keywords = ['美甲', '頭髮', '美妝', '保養', '衣服'];
  // PostgreSQL iLike ANY pattern for arrays
  const keywordPatterns = keywords.map(k => `%${k}%`);
  
  try {
    const query = `
      UPDATE expenses 
      SET category = '治裝' 
      WHERE category IN ('購物', '其他', '生活') 
        AND (
          item ILIKE ANY($1)
        )
    `;
    
    const result = await pool.query(query, [keywordPatterns]);
    
    console.log(`Migration completed. Rows updated: ${result.rowCount}`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
