const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testAuditFix() {
    const client = await pool.connect();
    
    try {
        console.log('🧪 Testing audit system column fix...');
        
        // Test data access log insertion with correct column names
        const testQuery = `
            INSERT INTO data_access_logs (
                user_id, table_name, record_id, access_type, query_type,
                result_count, purpose, ip_address, user_agent, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            ) RETURNING id
        `;
        
        const testValues = [
            'aaeb2db1-2ce5-437a-8263-a486827d8ad0', // user_id
            'audit_logs',                            // table_name (was accessed_table)
            null,                                    // record_id (was accessed_record_id)
            'READ',                                  // access_type
            'SELECT',                                // query_type
            1,                                       // result_count (was records_count)
            'Testing audit fix',                     // purpose
            '127.0.0.1',                            // ip_address
            'Test User Agent',                       // user_agent
            new Date()                               // created_at (was accessed_at)
        ];
        
        const result = await client.query(testQuery, testValues);
        
        console.log('✅ Data access log inserted successfully!');
        console.log(`   📝 Log ID: ${result.rows[0].id}`);
        
        // Verify the insertion
        const verifyQuery = `
            SELECT * FROM data_access_logs 
            WHERE id = $1
        `;
        
        const verifyResult = await client.query(verifyQuery, [result.rows[0].id]);
        
        if (verifyResult.rows.length > 0) {
            console.log('✅ Data access log verified successfully!');
            console.log('   📊 Log details:');
            console.log(`      - Table: ${verifyResult.rows[0].table_name}`);
            console.log(`      - Access Type: ${verifyResult.rows[0].access_type}`);
            console.log(`      - User ID: ${verifyResult.rows[0].user_id}`);
            console.log(`      - Created: ${verifyResult.rows[0].created_at}`);
        }
        
        // Clean up test data
        await client.query('DELETE FROM data_access_logs WHERE id = $1', [result.rows[0].id]);
        console.log('🧹 Test data cleaned up');
        
        console.log('\n🎉 Audit system column fix test completed successfully!');
        console.log('   The "accessed_table" column error should now be resolved.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Run the test
testAuditFix()
    .then(() => {
        console.log('\n✅ Test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    });