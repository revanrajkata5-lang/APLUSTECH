const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is not set. Add it in your environment variables.');
  process.exit(1);
}

const sslEnabled = process.env.DB_SSL !== 'false';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render's managed Postgres uses a self-signed cert chain internally,
  // so we disable strict verification rather than fail every connection.
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

module.exports = pool;
