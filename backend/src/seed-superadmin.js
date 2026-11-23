import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import argon2 from 'argon2';
import pg from 'pg';

dotenv.config({
  path: fileURLToPath(new URL('../.env', import.meta.url)),
});

const { Pool } = pg;
const email = process.env.SUPERADMIN_EMAIL?.trim();
const password = process.env.SUPERADMIN_PASSWORD;
const fullName = process.env.SUPERADMIN_NAME?.trim() || 'Mohit Kumar';

if (!email || !password) {
  throw new Error(
    'SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD environment variables are required',
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

const seedSuperadmin = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email],
    );

    if (existingUser.rowCount > 0) {
      throw new Error(`A user with ${email} already exists; no changes were made`);
    }

    const roleResult = await client.query(
      `SELECT id FROM roles
       WHERE role_key = 'superadmin' AND scope = 'platform'`,
    );

    if (roleResult.rowCount === 0) {
      throw new Error('The superadmin role does not exist. Run npm run migrate first');
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const userResult = await client.query(
      `INSERT INTO users (
        tenant_id,
        role_id,
        full_name,
        email,
        password_hash
      )
      VALUES (NULL, $1, $2, $3, $4)
      RETURNING id, email`,
      [roleResult.rows[0].id, fullName, email, passwordHash],
    );

    await client.query('COMMIT');
    console.log(`Superadmin created: ${userResult.rows[0].email}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seedSuperadmin().catch((error) => {
  console.error('Superadmin seed failed:', error.message);
  process.exitCode = 1;
});
