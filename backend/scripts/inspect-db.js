import pool from "../config/db.js";

async function inspectDatabase() {
  try {
    // 1. List all tables
    console.log("=== TABLES ===");
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    tables.rows.forEach(r => console.log(`  - ${r.table_name}`));

    // 2. For each table, list columns with types
    for (const row of tables.rows) {
      console.log(`\n=== COLUMNS IN "${row.table_name}" ===`);
      const cols = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [row.table_name]);
      cols.rows.forEach(c => {
        const nullable = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const def = c.column_default ? ` DEFAULT ${c.column_default}` : '';
        const maxLen = c.character_maximum_length ? `(${c.character_maximum_length})` : '';
        console.log(`  ${c.column_name} : ${c.data_type}${maxLen} ${nullable}${def}`);
      });
    }

    // 3. List all indexes
    console.log("\n=== INDEXES ===");
    const indexes = await pool.query(`
      SELECT indexname, tablename, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    indexes.rows.forEach(r => console.log(`  [${r.tablename}] ${r.indexname}: ${r.indexdef}`));

    // 4. List all foreign keys
    console.log("\n=== FOREIGN KEYS ===");
    const fks = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name
    `);
    fks.rows.forEach(r => console.log(`  ${r.source_table}.${r.source_column} -> ${r.target_table}.${r.target_column} (${r.constraint_name})`));

    // 5. Quick row counts
    console.log("\n=== ROW COUNTS ===");
    for (const row of tables.rows) {
      const count = await pool.query(`SELECT count(*) FROM "${row.table_name}"`);
      console.log(`  ${row.table_name}: ${count.rows[0].count} rows`);
    }

  } catch (err) {
    console.error("Error inspecting database:", err.message);
  } finally {
    await pool.end();
  }
}

inspectDatabase();
