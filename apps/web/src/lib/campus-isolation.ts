/**
 * Campus Isolation Security Layer
 * Enforces data isolation between different university campuses
 * CRITICAL: Every Firebase query must use these validators
 */

import { type Query, query, where, type QueryConstraint } from 'firebase/firestore';
import { logger } from './structured-logger';

/**
 * Get the default campus ID (for background jobs or when no user context)
 * @deprecated Use getCampusIdFromAuth() in user-facing code
 */
export function getDefaultCampusId(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_CAMPUS_ID || 'ub-buffalo';
}

/**
 * @deprecated Use getDefaultCampusId() or get campusId from user session
 */
export function getCurrentCampusId(): string {
  // Kept for backwards compatibility - prefer getting from user session
  return process.env.NEXT_PUBLIC_DEFAULT_CAMPUS_ID || 'ub-buffalo';
}

/**
 * Validate that a campus ID matches the current environment
 */
export function validateCampusAccess(requestedCampusId: string | undefined): boolean {
  const currentCampusId = getCurrentCampusId();

  if (!requestedCampusId) {
    logger.error('SECURITY: Missing campus ID in request');
    return false;
  }

  if (requestedCampusId !== currentCampusId) {
    logger.error('SECURITY: Campus isolation violation', {
      requested: requestedCampusId,
      current: currentCampusId
    });
    return false;
  }

  return true;
}

/**
 * Add campus isolation constraint to a Firestore query
 * MUST be used on every collection query
 */
export function withCampusIsolation<T extends Query<unknown>>(baseQuery: T): T {
  const campusId = getCurrentCampusId();
  return query(baseQuery, where('campusId', '==', campusId)) as T;
}

/**
 * Create campus isolation constraints for a query
 */
export function getCampusConstraints(): QueryConstraint[] {
  const campusId = getCurrentCampusId();
  return [where('campusId', '==', campusId)];
}

/**
 * Validate that a document belongs to the current campus
 */
export function validateDocumentCampus(doc: Record<string, unknown>): boolean {
  const campusId = getCurrentCampusId();

  if (!doc?.campusId) {
    logger.error('SECURITY: Document missing campus ID', { docId: doc?.id });
    return false;
  }

  if (doc.campusId !== campusId) {
    logger.error('SECURITY: Cross-campus data access attempted', {
      docCampus: doc.campusId,
      currentCampus: campusId,
      docId: doc.id
    });
    return false;
  }

  return true;
}

/**
 * Sanitize user data to ensure campus isolation
 */
export function sanitizeUserData(userData: Record<string, unknown>): Record<string, unknown> {
  const campusId = getCurrentCampusId();

  return {
    ...userData,
    campusId, // Always override with current campus
    schoolId: campusId,
    // Remove any sensitive cross-campus references
    crossCampusPermissions: undefined,
    globalAdmin: undefined
  };
}

/**
 * Check if a user's email belongs to a specific campus
 * Email domain validation now happens via Firestore school config
 */
export function validateEmailCampus(email: string, expectedCampusId?: string): boolean {
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!emailDomain) return false;

  // Domain validation is now handled by the school configuration in Firestore
  // This function is deprecated - use getCampusFromEmail() in campus-context.ts instead
  if (expectedCampusId === 'ub-buffalo' || !expectedCampusId) {
    return emailDomain === 'buffalo.edu' || emailDomain.endsWith('.buffalo.edu');
  }

  // For other campuses, validation happens at the school config level
  return true; // Let the caller validate against school config
}

/**
 * Security audit function for campus violations
 */
export function auditCampusViolation(
  operation: string,
  details: Record<string, unknown>
): void {
  logger.error('CAMPUS_ISOLATION_VIOLATION', {
    operation,
    timestamp: new Date().toISOString(),
    currentCampus: getCurrentCampusId(),
    ...details
  });

  // In production, this should trigger alerts
  if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
    // Send to monitoring service
    // notifySecurityTeam({ type: 'campus_violation', operation, details });
  }
}