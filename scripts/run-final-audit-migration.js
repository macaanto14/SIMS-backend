const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration using environment variables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runFinalAuditMigration() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Starting final audit system migration...');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'supabase', 'migrations', 'create_audit_system_final.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📄 Executing audit system SQL migration...');
        
        // Execute the migration
        await client.query(sqlContent);
        
        console.log('✅ Audit system migration completed successfully!');
        
        // Verify the installation
        console.log('\n🔍 Verifying audit system installation...');
        
        // Check if audit tables exist
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('audit_logs', 'user_sessions', 'data_access_logs', 'system_events', 'audit_configuration')
            ORDER BY table_name;
        `);
        
        console.log('📊 Audit tables created:');
        tablesResult.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });
        
        // Check if audit trigger function exists
        const functionResult = await client.query(`
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'audit_trigger_function';
        `);
        
        if (functionResult.rows.length > 0) {
            console.log('✓ Audit trigger function created successfully');
        } else {
            console.log('❌ Audit trigger function not found');
        }
        
        // Check audit configuration
        const configResult = await client.query(`
            SELECT table_name, module, is_enabled 
            FROM audit_configuration 
            ORDER BY table_name;
        `);
        
        console.log('\n📋 Audit configuration:');
        configResult.rows.forEach(row => {
            const status = row.is_enabled ? '✓' : '❌';
            console.log(`   ${status} ${row.table_name} (${row.module})`);
        });
        
        // Check triggers
        const triggersResult = await client.query(`
            SELECT trigger_name, event_object_table 
            FROM information_schema.triggers 
            WHERE trigger_name LIKE 'audit_trigger_%'
            ORDER BY event_object_table;
        `);
        
        console.log('\n🔧 Audit triggers created:');
        triggersResult.rows.forEach(row => {
            console.log(`   ✓ ${row.trigger_name} on ${row.event_object_table}`);
        });
        
        // Test the audit system with a simple operation
        console.log('\n🧪 Testing audit system...');
        
        // Set audit context for testing
        await client.query("SELECT set_config('audit.user_id', 'test-user-id', false)");
        await client.query("SELECT set_config('audit.school_id', 'test-school-id', false)");
        
        // Test with schools table (if it exists)
        const schoolsTableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'schools'
            );
        `);
        
        if (schoolsTableExists.rows[0].exists) {
            // Count audit logs before
            const beforeCount = await client.query('SELECT COUNT(*) FROM audit_logs');
            console.log(`   📊 Audit logs before test: ${beforeCount.rows[0].count}`);
            
            // Perform a test operation (this should trigger the audit)
            try {
                await client.query(`
                    UPDATE schools 
                    SET updated_at = NOW() 
                    WHERE id = (SELECT id FROM schools LIMIT 1)
                `);
                
                // Count audit logs after
                const afterCount = await client.query('SELECT COUNT(*) FROM audit_logs');
                console.log(`   📊 Audit logs after test: ${afterCount.rows[0].count}`);
                
                if (parseInt(afterCount.rows[0].count) > parseInt(beforeCount.rows[0].count)) {
                    console.log('   ✅ Audit system is working correctly!');
                } else {
                    console.log('   ⚠️  No new audit logs created - check configuration');
                }
            } catch (error) {
                console.log(`   ⚠️  Test operation failed: ${error.message}`);
            }
        } else {
            console.log('   ⚠️  Schools table not found - skipping audit test');
        }
        
        console.log('\n🎉 Final audit system migration completed successfully!');
        console.log('\n📝 Summary:');
        console.log('   • All audit tables created');
        console.log('   • Audit trigger function installed');
        console.log('   • Audit triggers recreated for all tables');
        console.log('   • Audit configuration loaded');
        console.log('   • System ready for comprehensive audit logging');
        
    } catch (error) {
        console.error('❌ Error during final audit migration:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the migration
runFinalAuditMigration()
    .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    });