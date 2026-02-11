/**
 * Space membership helpers
 * 
 * Canonical source: top-level `spaceMembers` collection
 * Doc ID format: `{spaceId}_{userId}`
 * 
 * Replaces the old `spaces/{spaceId}/members/{userId}` subcollection pattern.
 */

import { dbAdmin } from '@/lib/firebase-admin';

export interface SpaceMember {
  spaceId: string;
  userId: string;
  role: string;
  isActive: boolean;
  permissions?: string[];
  joinMethod?: string;
  joinedAt?: FirebaseFirestore.Timestamp;
  campusId?: string;
  [key: string]: any;
}

/**
 * Get a single membership doc (or null)
 */
export async function getSpaceMember(spaceId: string, userId: string): Promise<SpaceMember | null> {
  // Try composite key first (new format)
  const compositeDoc = await dbAdmin.collection('spaceMembers').doc(`${spaceId}_${userId}`).get();
  if (compositeDoc.exists) return compositeDoc.data() as SpaceMember;

  // Fallback: query by fields (handles non-composite doc IDs)
  const query = await dbAdmin.collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .limit(1)
    .get();
  
  if (!query.empty) return query.docs[0].data() as SpaceMember;
  return null;
}

/**
 * Check if user is a member of a space
 */
export async function isSpaceMember(spaceId: string, userId: string): Promise<boolean> {
  const member = await getSpaceMember(spaceId, userId);
  return member !== null && member.isActive !== false;
}

/**
 * Get all members of a space
 */
export async function getSpaceMembers(spaceId: string, filters?: { role?: string | string[]; isActive?: boolean }): Promise<SpaceMember[]> {
  let query: FirebaseFirestore.Query = dbAdmin.collection('spaceMembers').where('spaceId', '==', spaceId);
  
  if (filters?.isActive !== undefined) {
    query = query.where('isActive', '==', filters.isActive);
  }
  if (filters?.role) {
    if (Array.isArray(filters.role)) {
      query = query.where('role', 'in', filters.role);
    } else {
      query = query.where('role', '==', filters.role);
    }
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => doc.data() as SpaceMember);
}

/**
 * Get member IDs for a space
 */
export async function getSpaceMemberIds(spaceId: string, filters?: { role?: string | string[]; isActive?: boolean }): Promise<string[]> {
  const members = await getSpaceMembers(spaceId, filters);
  return members.map(m => m.userId);
}

/**
 * Add or update a space membership
 */
export async function setSpaceMember(spaceId: string, userId: string, data: Partial<SpaceMember>): Promise<void> {
  const docId = `${spaceId}_${userId}`;
  await dbAdmin.collection('spaceMembers').doc(docId).set(
    { spaceId, userId, ...data },
    { merge: true }
  );
}

/**
 * Remove all members of a space (for space deletion)
 */
export async function deleteSpaceMembers(spaceId: string): Promise<number> {
  const snapshot = await dbAdmin.collection('spaceMembers').where('spaceId', '==', spaceId).get();
  if (snapshot.empty) return 0;
  
  const batch = dbAdmin.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  return snapshot.size;
}
