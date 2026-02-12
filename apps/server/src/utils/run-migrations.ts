import { connectDatabase } from '../config/database';
import { runMigrations } from './migrations';

async function main() {
  console.log('🔄 Running migrations...');
  await connectDatabase();
  await runMigrations();
  console.log('✅ Migrations complete');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
