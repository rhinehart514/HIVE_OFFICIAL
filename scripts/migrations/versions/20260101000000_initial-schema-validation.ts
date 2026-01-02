/**
 * Migration: Initial Schema Validation
 * Created: 2026-01-01T00:00:00.000Z
 *
 * This migration validates the initial schema state and sets up
 * any missing required fields with default values.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

export default {
  name: 'Initial Schema Validation',
  version: '20260101000000_initial-schema-validation',
  description: 'Validates initial schema and adds missing required fields',

  async up(db: Firestore): Promise<void> {
    console.log('    Validating spaces collection...');

    // Ensure all spaces have required fields
    const spacesSnapshot = await db.collection('spaces').get();
    const batch = db.batch();
    let updateCount = 0;

    for (const doc of spacesSnapshot.docs) {
      const data = doc.data();
      const updates: Record<string, unknown> = {};

      // Ensure memberCount exists
      if (typeof data.memberCount !== 'number') {
        updates.memberCount = 0;
      }

      // Ensure isActive exists
      if (typeof data.isActive !== 'boolean') {
        updates.isActive = true;
      }

      // Ensure visibility exists
      if (!data.visibility) {
        updates.visibility = 'public';
      }

      // Ensure campusId exists
      if (!data.campusId) {
        updates.campusId = 'ub-buffalo';
      }

      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        updateCount++;
      }
    }

    if (updateCount > 0) {
      await batch.commit();
      console.log(`    Updated ${updateCount} spaces with missing fields`);
    } else {
      console.log('    All spaces have required fields');
    }

    console.log('    Validating profiles collection...');

    // Ensure all profiles have required fields
    const profilesSnapshot = await db.collection('profiles').get();
    const profileBatch = db.batch();
    let profileUpdateCount = 0;

    for (const doc of profilesSnapshot.docs) {
      const data = doc.data();
      const updates: Record<string, unknown> = {};

      // Ensure campusId exists
      if (!data.campusId) {
        updates.campusId = 'ub-buffalo';
      }

      // Ensure isOnboarded exists
      if (typeof data.isOnboarded !== 'boolean') {
        updates.isOnboarded = !!data.displayName;
      }

      // Ensure privacySettings exists
      if (!data.privacySettings) {
        updates.privacySettings = {
          profileVisibility: 'campus',
          showSpaces: true,
          showActivity: true,
          allowMessages: true,
        };
      }

      if (Object.keys(updates).length > 0) {
        profileBatch.update(doc.ref, updates);
        profileUpdateCount++;
      }
    }

    if (profileUpdateCount > 0) {
      await profileBatch.commit();
      console.log(`    Updated ${profileUpdateCount} profiles with missing fields`);
    } else {
      console.log('    All profiles have required fields');
    }

    console.log('    Initial schema validation complete');
  },

  async down(db: Firestore): Promise<void> {
    // This migration only adds defaults, no need to rollback
    // Rolling back would remove data integrity guarantees
    console.log('    Note: Initial schema validation cannot be rolled back');
    console.log('    (would remove required field defaults)');
  },
};
