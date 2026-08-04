import "dotenv/config";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

async function applyMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log("Connected to PostgreSQL database.");
    const migrationDir = path.join(process.cwd(), "prisma/migrations/20260802000000_phase4_admin_operations");
    const migrationSql = fs.readFileSync(path.join(migrationDir, "migration.sql"), "utf-8");

    // Compute checksum
    const checksum = crypto.createHash("sha256").update(migrationSql).digest("hex");
    const migrationName = "20260802000000_phase4_admin_operations";

    // Check if already applied
    const res = await client.query('SELECT id, migration_name, finished_at FROM "_prisma_migrations" WHERE migration_name = $1', [migrationName]);
    if (res.rows.length > 0 && res.rows[0].finished_at) {
      console.log(`Migration ${migrationName} is already applied.`);
      return;
    }

    console.log(`Applying migration ${migrationName}...`);
    const migrationId = crypto.randomUUID();

    await client.query("BEGIN");
    // Execute DDL
    await client.query(migrationSql);

    // Record migration in _prisma_migrations
    await client.query(
      `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       VALUES ($1, $2, NOW(), $3, NULL, NULL, NOW(), 1)`,
      [migrationId, checksum, migrationName]
    );

    await client.query("COMMIT");
    console.log(`Migration ${migrationName} successfully applied and recorded.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration().catch((err) => {
  console.error(err);
  process.exit(1);
});
