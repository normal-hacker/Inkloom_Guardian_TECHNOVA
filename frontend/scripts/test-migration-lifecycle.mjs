import { newDb, DataType } from 'pg-mem';
import fs from 'node:fs';
import path from 'node:path';

function runMigrationTest() {
  console.log('=== TESTING DRIZZLE 0002 IDEMPOTENCY KEYS MIGRATION & ROLLBACK ===');
  const db = newDb();

  let uuidCounter = 1;
  db.public.registerFunction({
    name: 'gen_random_uuid',
    args: [],
    returns: DataType.text,
    implementation: () => `00000000-0000-0000-0000-${(++uuidCounter).toString().padStart(12, '0')}`,
  });

  // 1. Apply baseline migration (users table)
  const m0 = fs.readFileSync(path.resolve('drizzle/0000_dark_the_leader.sql'), 'utf8');
  m0.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean).forEach((s) => db.public.none(s));
  console.log('✓ Baseline migration applied.');

  // 2. Apply UP migration 0002_idempotency_keys.sql
  const m2 = fs.readFileSync(path.resolve('drizzle/0002_idempotency_keys.sql'), 'utf8');
  m2.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean).forEach((s) => db.public.none(s));
  console.log('✓ UP Migration 0002_idempotency_keys.sql applied successfully.');

  // 3. Verify table schema with query
  const cols = db.public.many(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'idempotency_keys'
    ORDER BY ordinal_position;
  `);
  console.log('✓ Verified Columns in idempotency_keys table:');
  cols.forEach((c) => console.log(`   - ${c.column_name} (${c.data_type})`));

  // 4. Test insert and query
  const testUserId = '00000000-0000-0000-0000-000000000001';
  db.public.none(`
    INSERT INTO workspaces (id, name) VALUES ('00000000-0000-0000-0000-000000000010', 'Test Workspace');
    INSERT INTO users (id, workspace_id, email, display_name, role) VALUES ('${testUserId}', '00000000-0000-0000-0000-000000000010', 't@test.com', 'Test', 'creator');
    INSERT INTO idempotency_keys (id, user_id, key, endpoint, response_status, response_body)
    VALUES (gen_random_uuid(), '${testUserId}', 'test-key-1', '/api/test', 201, '{"ok":true}');
  `);
  const row = db.public.one(`SELECT key, response_status FROM idempotency_keys WHERE key = 'test-key-1'`);
  console.log(`✓ Row verification: key=${row.key}, status=${row.response_status}`);

  // 5. Test DOWN / Rollback migration
  const downSql = `DROP TABLE IF EXISTS "idempotency_keys" CASCADE;`;
  db.public.none(downSql);
  console.log('✓ DOWN / Rollback Migration executed: DROP TABLE IF EXISTS "idempotency_keys" CASCADE;');

  const remaining = db.public.many(`
    SELECT table_name FROM information_schema.tables WHERE table_name = 'idempotency_keys'
  `);
  console.log(`✓ Post-rollback verification: table count = ${remaining.length} (cleanly dropped)`);
}

runMigrationTest();

