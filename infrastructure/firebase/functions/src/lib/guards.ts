import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Asserts that a user has the 'builder' role in a specific space.
 * Throws an HttpsError if the user is not authenticated or not a builder.
 * @param {string | undefined} uid The user's ID from context.auth.
 * @param {string} spaceId The ID of the space to check against.
 * @throwss {functions.https.HttpsError}
 */
export const assertIsBuilder = async (uid: string | undefined, spaceId: string): Promise<void> => {
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to perform this action.');
  }

  // Prefer flat membership with elevated roles
  const flatSnapshot = await db
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', uid)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (!flatSnapshot.empty) {
    const role = flatSnapshot.docs[0].data().role as string | undefined;
    if (role && (role === 'owner' || role === 'admin' || role === 'builder')) {
      return;
    }
    // User is a member but not a builder
    throw new functions.https.HttpsError('permission-denied', 'You must be a builder to perform this action.');
  }

  // User is not a member of this space
  throw new functions.https.HttpsError('permission-denied', 'You are not a member of this space.');
};

/**
 * Asserts that a user is a member of a specific space.
 * Throws an HttpsError if the user is not authenticated or not a member.
 * @param {string | undefined} uid The user's ID from context.auth.
 * @param {string} spaceId The ID of the space to check against.
 * @throwss {functions.https.HttpsError}
 */
export const assertIsMember = async (uid: string | undefined, spaceId: string): Promise<void> => {
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to perform this action.');
  }

  // Use flat /spaceMembers collection
  const flatSnapshot = await db
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', uid)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (flatSnapshot.empty) {
    throw new functions.https.HttpsError('permission-denied', 'You must be a member of this space to perform this action.');
  }
};
