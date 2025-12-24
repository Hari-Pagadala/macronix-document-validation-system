const pool = require('../config/database');

async function createShortLinksTable() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create short_links table
        await client.query(`
            CREATE TABLE IF NOT EXISTS short_links (
                id SERIAL PRIMARY KEY,
                short_code VARCHAR(10) UNIQUE NOT NULL,
                full_url TEXT NOT NULL,
                record_id INTEGER REFERENCES records(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_used BOOLEAN DEFAULT false,
                used_at TIMESTAMP,
                ip_address VARCHAR(50),
                user_agent TEXT
            )
        `);

        // Create index on short_code for fast lookup
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_short_links_code 
            ON short_links(short_code)
        `);

        // Create index on expires_at for cleanup queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_short_links_expires 
            ON short_links(expires_at)
        `);

        await client.query('COMMIT');
        console.log('✅ short_links table created successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating short_links table:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run if called directly
if (require.main === module) {
    createShortLinksTable()
        .then(() => {
            console.log('Migration completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = createShortLinksTable;
