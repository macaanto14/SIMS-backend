const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function checkAllTimestampColumns() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Checking all tables for timestamp columns...');
    
    // Get all tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`\n📋 Found ${tables.rows.length} tables`);
    
    for (const table of tables.rows) {
      const tableName = table.table_name;
      
      // Get timestamp columns for this table
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        AND (column_name LIKE '%created%' OR column_name LIKE '%updated%' OR column_name LIKE '%At')
        ORDER BY ordinal_position;
      `, [tableName]);
      
      if (columns.rows.length > 0) {
        console.log(`\n🗂️  Table: ${tableName}`);
        columns.rows.forEach(col => {
          console.log(`   ${col.column_name} (${col.data_type})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking timestamp columns:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkAllTimestampColumns();