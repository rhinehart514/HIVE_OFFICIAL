/**
 * Firebase Client Re-export
 *
 * This file re-exports Firebase client SDK from @hive/firebase
 * for use in the web app. All Firebase configuration and initialization
 * is handled in the @hive/firebase package.
 */

export {
  app,
  auth,
  db,
  storage,
  validateCampusAccess,
  checkRateLimit,
  // Firebase AI (Gemini)
  ai,
  getGenerativeModel,
  Schema,
  GoogleAIBackend
} from '@hive/firebase';
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, Analytics } from '@hive/firebase';
