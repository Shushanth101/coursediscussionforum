import pool from "../config/db.js";

async function migrateCleanup() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Drop likes column from comments
    await client.query(`ALTER TABLE comments DROP COLUMN IF EXISTS likes;`);
    console.log("✔ Dropped 'likes' column from comments");

    // 2. Drop profile_pic column from users
    await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS profile_pic;`);
    console.log("✔ Dropped 'profile_pic' column from users");

    await client.query('COMMIT');
    console.log("\n✅ Cleanup migration completed successfully!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Migration failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateCleanup();
