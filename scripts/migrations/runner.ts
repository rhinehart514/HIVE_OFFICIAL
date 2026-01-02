/**
 * Database Migration Runner
 *
 * Manages Firestore schema migrations with version tracking and rollback support.
 *
 * Usage:
 *   pnpm migration:run           # Run pending migrations
 *   pnpm migration:status        # Show migration status
 *   pnpm migration:rollback      # Rollback last migration
 *   pnpm migration:create <name> # Create new migration file
 */

import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin
import '@hive/firebase/admin';

const MIGRATIONS_COLLECTION = '_migrations';
const MIGRATIONS_DIR = path.join(__dirname, 'versions');

export interface Migration {
  name: string;
  version: string;
  description: string;
  up: (db: FirebaseFirestore.Firestore) => Promise<void>;
  down: (db: FirebaseFirestore.Firestore) => Promise<void>;
}

interface MigrationRecord {
  version: string;
  name: string;
  appliedAt: Timestamp;
  executionTimeMs: number;
  status: 'applied' | 'rolled_back' | 'failed';
  error?: string;
}

/**
 * Get all migration files sorted by version
 */
function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return [];
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
    .sort();
}

/**
 * Load a migration module
 */
async function loadMigration(filename: string): Promise<Migration> {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const module = await import(filepath);
  return module.default || module;
}

/**
 * Get applied migrations from Firestore
 */
async function getAppliedMigrations(
  db: FirebaseFirestore.Firestore
): Promise<Map<string, MigrationRecord>> {
  const snapshot = await db
    .collection(MIGRATIONS_COLLECTION)
    .where('status', '==', 'applied')
    .get();

  const applied = new Map<string, MigrationRecord>();
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as MigrationRecord;
    applied.set(data.version, data);
  });

  return applied;
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  const db = getFirestore();
  const files = getMigrationFiles();
  const applied = await getAppliedMigrations(db);

  console.log('\n📦 HIVE Database Migrations\n');
  console.log(`Found ${files.length} migration file(s)`);
  console.log(`Applied: ${applied.size}\n`);

  let ranCount = 0;

  for (const filename of files) {
    const migration = await loadMigration(filename);
    const version = migration.version;

    if (applied.has(version)) {
      console.log(`  ✓ ${version} - ${migration.name} (already applied)`);
      continue;
    }

    console.log(`  ▶ ${version} - ${migration.name}...`);

    const startTime = Date.now();
    const migrationRef = db.collection(MIGRATIONS_COLLECTION).doc(version);

    try {
      // Run migration
      await migration.up(db);

      // Record success
      await migrationRef.set({
        version,
        name: migration.name,
        description: migration.description,
        appliedAt: FieldValue.serverTimestamp(),
        executionTimeMs: Date.now() - startTime,
        status: 'applied',
      });

      console.log(`    ✅ Applied in ${Date.now() - startTime}ms`);
      ranCount++;
    } catch (error) {
      // Record failure
      const errorMessage = error instanceof Error ? error.message : String(error);

      await migrationRef.set({
        version,
        name: migration.name,
        description: migration.description,
        appliedAt: FieldValue.serverTimestamp(),
        executionTimeMs: Date.now() - startTime,
        status: 'failed',
        error: errorMessage,
      });

      console.error(`    ❌ Failed: ${errorMessage}`);
      throw error;
    }
  }

  console.log(`\n✨ Completed. ${ranCount} migration(s) applied.\n`);
}

/**
 * Rollback the last applied migration
 */
export async function rollbackMigration(): Promise<void> {
  const db = getFirestore();

  // Get last applied migration
  const snapshot = await db
    .collection(MIGRATIONS_COLLECTION)
    .where('status', '==', 'applied')
    .orderBy('appliedAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.log('\n⚠️  No migrations to rollback.\n');
    return;
  }

  const record = snapshot.docs[0].data() as MigrationRecord;
  const files = getMigrationFiles();
  const migrationFile = files.find((f) => f.includes(record.version));

  if (!migrationFile) {
    console.error(`\n❌ Migration file for ${record.version} not found.\n`);
    return;
  }

  console.log(`\n🔄 Rolling back: ${record.version} - ${record.name}\n`);

  const migration = await loadMigration(migrationFile);
  const startTime = Date.now();

  try {
    await migration.down(db);

    // Update record
    await snapshot.docs[0].ref.update({
      status: 'rolled_back',
      rolledBackAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Rolled back in ${Date.now() - startTime}ms\n`);
  } catch (error) {
    console.error(`❌ Rollback failed: ${error}\n`);
    throw error;
  }
}

/**
 * Show migration status
 */
export async function showStatus(): Promise<void> {
  const db = getFirestore();
  const files = getMigrationFiles();
  const applied = await getAppliedMigrations(db);

  console.log('\n📊 Migration Status\n');
  console.log('─'.repeat(60));

  if (files.length === 0) {
    console.log('No migrations found.');
    console.log(`Create one with: pnpm migration:create <name>\n`);
    return;
  }

  for (const filename of files) {
    const migration = await loadMigration(filename);
    const version = migration.version;
    const record = applied.get(version);

    if (record) {
      const date = record.appliedAt.toDate().toISOString().split('T')[0];
      console.log(`  ✓ ${version} - ${migration.name}`);
      console.log(`    Applied: ${date} (${record.executionTimeMs}ms)`);
    } else {
      console.log(`  ○ ${version} - ${migration.name} (pending)`);
    }
  }

  console.log('─'.repeat(60));
  console.log(`Total: ${files.length} | Applied: ${applied.size} | Pending: ${files.length - applied.size}`);
  console.log('');
}

/**
 * Create a new migration file
 */
export function createMigration(name: string): void {
  if (!name) {
    console.error('❌ Migration name required');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const safeName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const version = `${timestamp}_${safeName}`;
  const filename = `${version}.ts`;
  const filepath = path.join(MIGRATIONS_DIR, filename);

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  const template = `/**
 * Migration: ${name}
 * Created: ${new Date().toISOString()}
 */

import type { Firestore } from 'firebase-admin/firestore';

export default {
  name: '${name}',
  version: '${version}',
  description: 'TODO: Add description',

  async up(db: Firestore): Promise<void> {
    // TODO: Implement forward migration
    // Example: Add a new field to all documents
    // const batch = db.batch();
    // const snapshot = await db.collection('users').get();
    // snapshot.docs.forEach(doc => {
    //   batch.update(doc.ref, { newField: 'defaultValue' });
    // });
    // await batch.commit();
  },

  async down(db: Firestore): Promise<void> {
    // TODO: Implement rollback
    // Example: Remove the field
    // const batch = db.batch();
    // const snapshot = await db.collection('users').get();
    // snapshot.docs.forEach(doc => {
    //   batch.update(doc.ref, { newField: FieldValue.delete() });
    // });
    // await batch.commit();
  },
};
`;

  fs.writeFileSync(filepath, template);
  console.log(`\n✨ Created migration: ${filepath}\n`);
}

// CLI handler
const command = process.argv[2];

async function main() {
  switch (command) {
    case 'run':
      await runMigrations();
      break;
    case 'rollback':
      await rollbackMigration();
      break;
    case 'status':
      await showStatus();
      break;
    case 'create':
      createMigration(process.argv[3]);
      break;
    default:
      console.log(`
Usage:
  npx tsx scripts/migrations/runner.ts run           # Run pending migrations
  npx tsx scripts/migrations/runner.ts status        # Show migration status
  npx tsx scripts/migrations/runner.ts rollback      # Rollback last migration
  npx tsx scripts/migrations/runner.ts create <name> # Create new migration
      `);
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
