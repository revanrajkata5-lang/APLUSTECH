// Creates (or resets the password of) an admin login.
// Reads ADMIN_EMAIL and ADMIN_PASSWORD from the environment (.env locally,
// or Render's Shell/env vars in production).
//
// Usage:
//   npm run create-admin
// or override inline:
//   ADMIN_EMAIL=you@aplustech.com ADMIN_PASSWORD=someStrongPass node scripts/create-admin.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/db');

async function run() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (in .env or the environment) first.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD should be at least 8 characters.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO admin_users (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [email.toLowerCase().trim(), hash]
  );

  console.log(`Admin user ready: ${email}`);
  await pool.end();
}

run().catch((err) => {
  console.error('Failed to create admin user:', err);
  process.exit(1);
});
