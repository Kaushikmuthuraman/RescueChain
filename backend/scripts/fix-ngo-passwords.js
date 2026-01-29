/**
 * One-off script: fix demo org password_hash (NGO, DDMA, SDMA) so login with "password123" works.
 * Uses backend .env for DB connection. Run: npm run fix-ngo-passwords (from backend/)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { pool } = require('../src/config/database');

const DEMO_HASH = '$2b$10$g4isM.QzmyACQNzuK7/sF.C8YUxavtvEv0zgn83wnQnjwzKazgYnK';
const DEMO_USERNAMES = ['sdma_admin', 'ddma_delhi', 'ddma_mumbai', 'redcross', 'savethechildren', 'oxfam', 'goonj', 'helpage'];

async function main() {
    const client = await pool.connect();
    try {
        const res = await client.query(
            `UPDATE credentials SET password_hash = $1 WHERE username = ANY($2::text[])`,
            [DEMO_HASH, DEMO_USERNAMES]
        );
        console.log(`Updated ${res.rowCount} demo credential(s). Demo accounts: username + password123`);
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
