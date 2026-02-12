import fs from 'node:fs';
import path from 'node:path';
import { pool } from '../config/database';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../database/migrations');
const MIGRATION_LOCK_ID = 123456789;

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query('SELECT filename FROM schema_migrations ORDER BY id');
  return new Set(result.rows.map((r: { filename: string }) => r.filename));
}

function resolveMigrationsDir(): string | null {
  const candidates = [
    MIGRATIONS_DIR,
    path.resolve(process.cwd(), 'database/migrations'),
  ];

  return candidates.find(dir => fs.existsSync(dir)) ?? null;
}

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);

    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();

    const migrationsDir = resolveMigrationsDir();
    if (!migrationsDir) {
      console.log('No migrations directory found, skipping');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const migrationClient = await pool.connect();
      try {
        await migrationClient.query('BEGIN');
        await migrationClient.query(sql);
        await migrationClient.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await migrationClient.query('COMMIT');
        console.log(`  ✅ Applied: ${file}`);
        count++;
      } catch (err) {
        await migrationClient.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err}`);
      } finally {
        migrationClient.release();
      }
    }

    console.log(count === 0 ? '  No new migrations to apply' : `  Applied ${count} migration(s)`);
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]);
    client.release();
  }
}
