const { Client } = require('pg');
require('dotenv').config();

async function addPasswordColumn() {
  // Use a single client instead of pool for migration
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    statement_timeout: 30000,
    query_timeout: 30000,
    connectionTimeoutMillis: 10000,
  });
  
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');
    
    console.log('🔄 Checking if password_hash column exists...');
    
    // Check if column already exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public' 
      AND column_name = 'password_hash'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ password_hash column already exists');
      return;
    }
    
    console.log('🔄 Adding password_hash column...');
    // Add the column
    await client.query('ALTER TABLE public.users ADD COLUMN password_hash text');
    console.log('✅ password_hash column added successfully');
    
    console.log('🔄 Creating indexes...');
    // Add indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_password_hash ON public.users(password_hash)');
    console.log('✅ Indexes created successfully');
    
    // Verify
    console.log('🔄 Verifying table structure...');
    const verification = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Users table structure:');
    verification.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    try {
      await client.end();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing connection:', error.message);
    }
  }
}

// Run the migration
addPasswordColumn().then(() => {
  console.log('Migration script finished');
  process.exit(0);
}).catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});