import pool from "../config/db.js";

async function migrateTags() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create tags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        tag_id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✔ Created 'tags' table");

    // 2. Create post_tags junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id VARCHAR(30) NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      );
    `);
    console.log("✔ Created 'post_tags' table");

    // 3. Create indexes for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
    `);
    console.log("✔ Created indexes");

    await client.query('COMMIT');
    console.log("\n✅ Tags migration completed successfully!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Migration failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateTags();
