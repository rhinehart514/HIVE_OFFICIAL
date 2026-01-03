#!/usr/bin/env ts-node

/**
 * P0 Migration: Surface Modes + Provenance Backfill
 *
 * This migration backfills:
 * - surfaceModes for existing deployments (default: widget only)
 * - primarySurface for existing deployments (default: widget)
 * - provenance for existing deployments and tools
 * - supportedSurfaces for existing tools (default: widget only)
 *
 * Run with: npx ts-node scripts/migrations/p0-surface-modes.ts
 *
 * @version P0 - App Surface Implementation
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  // Use service account from environment or file
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (serviceAccountPath) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Try default credentials
    admin.initializeApp();
  }
}

const db = admin.firestore();

// Campus ID - adjust as needed
const CAMPUS_ID = process.env.CAMPUS_ID || "ub-buffalo";

// Batch configuration
const BATCH_SIZE = 500;

// ============================================================================
// Migration Functions
// ============================================================================

interface MigrationStats {
  processed: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Migrate deployedTools collection to add P0 fields.
 */
async function migrateDeployments(): Promise<MigrationStats> {
  console.log("\n=== Migrating Deployments ===\n");

  const stats: MigrationStats = {
    processed: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const query = db
    .collection("deployedTools")
    .where("campusId", "==", CAMPUS_ID);

  const snapshot = await query.get();
  console.log(`Found ${snapshot.size} deployments to process`);

  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    stats.processed++;
    const data = doc.data();

    // Skip if already migrated
    if (data.surfaceModes && data.provenance) {
      stats.skipped++;
      continue;
    }

    try {
      const updateData: Record<string, unknown> = {};

      // Add surfaceModes if missing
      if (!data.surfaceModes) {
        updateData.surfaceModes = {
          widget: true,
          app: false,
        };
      }

      // Add primarySurface if missing
      if (!data.primarySurface) {
        updateData.primarySurface = "widget";
      }

      // Add provenance if missing
      if (!data.provenance) {
        updateData.provenance = {
          creatorId: data.deployedBy || data.creatorId || "unknown",
          createdAt: data.deployedAt || new Date().toISOString(),
          lineage: [],
          trustTier: "unverified",
        };
      }

      // Add toolVersion if missing
      if (!data.toolVersion) {
        updateData.toolVersion = data.metadata?.toolVersion || "1.0.0";
      }

      // Ensure capabilities include object fields
      if (data.capabilities && !("objects_read" in data.capabilities)) {
        updateData.capabilities = {
          ...data.capabilities,
          objects_read: false,
          objects_write: false,
          objects_delete: false,
        };
      }

      // Add migration metadata
      updateData._p0MigratedAt = new Date().toISOString();
      updateData._p0MigrationVersion = "v1";

      batch.update(doc.ref, updateData);
      batchCount++;
      stats.updated++;

      // Commit batch when full
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount} deployments`);
        batch = db.batch();
        batchCount = 0;
      }
    } catch (error) {
      console.error(`  Error processing deployment ${doc.id}:`, error);
      stats.errors++;
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    console.log(`  Committed final batch of ${batchCount} deployments`);
  }

  return stats;
}

/**
 * Migrate tools collection to add P0 fields.
 */
async function migrateTools(): Promise<MigrationStats> {
  console.log("\n=== Migrating Tools ===\n");

  const stats: MigrationStats = {
    processed: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const query = db.collection("tools").where("campusId", "==", CAMPUS_ID);

  const snapshot = await query.get();
  console.log(`Found ${snapshot.size} tools to process`);

  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    stats.processed++;
    const data = doc.data();

    // Skip if already migrated
    if (data.supportedSurfaces && data.provenance) {
      stats.skipped++;
      continue;
    }

    try {
      const updateData: Record<string, unknown> = {};

      // Add supportedSurfaces if missing
      if (!data.supportedSurfaces) {
        updateData.supportedSurfaces = {
          widget: true,
          app: false, // Tools must opt-in to app surface
        };
      }

      // Add recommendedSurface if missing
      if (!data.recommendedSurface) {
        updateData.recommendedSurface = "widget";
      }

      // Add provenance if missing
      if (!data.provenance) {
        updateData.provenance = {
          creatorId: data.ownerId || "unknown",
          createdAt: data.createdAt || new Date().toISOString(),
          lineage: [],
          forkCount: 0,
          deploymentCount: data.deploymentCount || 0,
        };
      }

      // Add requiredCapabilities if missing
      if (!data.requiredCapabilities) {
        updateData.requiredCapabilities = {
          read_own_state: true,
          write_own_state: true,
          write_shared_state: true,
        };
      }

      // Add migration metadata
      updateData._p0MigratedAt = new Date().toISOString();
      updateData._p0MigrationVersion = "v1";

      batch.update(doc.ref, updateData);
      batchCount++;
      stats.updated++;

      // Commit batch when full
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount} tools`);
        batch = db.batch();
        batchCount = 0;
      }
    } catch (error) {
      console.error(`  Error processing tool ${doc.id}:`, error);
      stats.errors++;
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    console.log(`  Committed final batch of ${batchCount} tools`);
  }

  return stats;
}

/**
 * Verify migration was successful by sampling documents.
 */
async function verifyMigration(): Promise<boolean> {
  console.log("\n=== Verifying Migration ===\n");

  // Sample a few deployments
  const deploymentSample = await db
    .collection("deployedTools")
    .where("campusId", "==", CAMPUS_ID)
    .limit(5)
    .get();

  let deploymentsValid = true;
  for (const doc of deploymentSample.docs) {
    const data = doc.data();
    if (!data.surfaceModes || !data.provenance) {
      console.error(`  Deployment ${doc.id} missing P0 fields`);
      deploymentsValid = false;
    }
  }

  // Sample a few tools
  const toolSample = await db
    .collection("tools")
    .where("campusId", "==", CAMPUS_ID)
    .limit(5)
    .get();

  let toolsValid = true;
  for (const doc of toolSample.docs) {
    const data = doc.data();
    if (!data.supportedSurfaces || !data.provenance) {
      console.error(`  Tool ${doc.id} missing P0 fields`);
      toolsValid = false;
    }
  }

  if (deploymentsValid && toolsValid) {
    console.log("  Verification passed!");
    return true;
  } else {
    console.error("  Verification failed - some documents missing P0 fields");
    return false;
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("========================================");
  console.log("P0 Migration: Surface Modes + Provenance");
  console.log("========================================");
  console.log(`Campus: ${CAMPUS_ID}`);
  console.log(`Started: ${new Date().toISOString()}`);

  try {
    // Run migrations
    const deploymentStats = await migrateDeployments();
    const toolStats = await migrateTools();

    // Print summary
    console.log("\n========================================");
    console.log("Migration Summary");
    console.log("========================================");

    console.log("\nDeployments:");
    console.log(`  Processed: ${deploymentStats.processed}`);
    console.log(`  Updated:   ${deploymentStats.updated}`);
    console.log(`  Skipped:   ${deploymentStats.skipped}`);
    console.log(`  Errors:    ${deploymentStats.errors}`);

    console.log("\nTools:");
    console.log(`  Processed: ${toolStats.processed}`);
    console.log(`  Updated:   ${toolStats.updated}`);
    console.log(`  Skipped:   ${toolStats.skipped}`);
    console.log(`  Errors:    ${toolStats.errors}`);

    // Verify
    const verified = await verifyMigration();

    console.log("\n========================================");
    console.log(`Completed: ${new Date().toISOString()}`);
    console.log(`Status: ${verified ? "SUCCESS" : "NEEDS ATTENTION"}`);
    console.log("========================================\n");

    process.exit(verified ? 0 : 1);
  } catch (error) {
    console.error("\nMigration failed with error:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { migrateDeployments, migrateTools, verifyMigration };
