/**
 * Campus Context - Runtime Tenant Isolation
 *
 * Provides campus identification from user session/email.
 * Replaces hardcoded CURRENT_CAMPUS_ID with dynamic resolution.
 */

import 'server-only';
import { validateApiAuth, type AuthContext } from './api-auth-middleware';
import { type SessionData } from './session';
import { NextRequest } from 'next/server';
import { logger } from './logger';

/**
 * Campus domain mapping
 * Add new campuses here as they're onboarded
 */
const CAMPUS_DOMAINS: Record<string, string> = {
  'buffalo.edu': 'ub-buffalo',
  'ub.edu': 'ub-buffalo',
  // Future campuses:
  // 'cornell.edu': 'cornell',
  // 'nyu.edu': 'nyu',
};

/**
 * Default campus for development/fallback
 */
const DEFAULT_CAMPUS_ID = 'ub-buffalo';

/**
 * Derive campus ID from email domain
 * @throws Error if domain is not recognized
 */
export function getCampusFromEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required for campus detection');
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    throw new Error('Invalid email format');
  }

  const domain = parts[1].toLowerCase();

  // Check for exact match first
  if (CAMPUS_DOMAINS[domain]) {
    return CAMPUS_DOMAINS[domain];
  }

  // Check for subdomain match (e.g., 'cs.buffalo.edu' -> 'buffalo.edu')
  const domainParts = domain.split('.');
  for (let i = 0; i < domainParts.length - 1; i++) {
    const parentDomain = domainParts.slice(i).join('.');
    if (CAMPUS_DOMAINS[parentDomain]) {
      return CAMPUS_DOMAINS[parentDomain];
    }
  }

  throw new Error(`Unsupported email domain: ${domain}`);
}

/**
 * Check if an email domain is supported
 */
export function isSupportedEmailDomain(email: string): boolean {
  try {
    getCampusFromEmail(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get campus ID from authenticated request
 * Uses session data which includes campusId
 */
export async function getCampusId(request: NextRequest): Promise<string> {
  try {
    const auth = await validateApiAuth(request);
    return getCampusIdFromAuth(auth);
  } catch {
    throw new Error('Authentication required for campus context');
  }
}

/**
 * Get campus ID from auth context
 * Use when you already have auth context from validateApiAuth
 */
export function getCampusIdFromAuth(auth: AuthContext): string {
  // Auth context should have campusId set during auth
  if (auth.campusId) {
    return auth.campusId;
  }

  // Fallback: derive from email if campusId not in auth context
  if (auth.email) {
    try {
      return getCampusFromEmail(auth.email);
    } catch {
      logger.warn('Could not determine campus from email, using default', { component: 'campus-context', email: auth.email });
      return DEFAULT_CAMPUS_ID;
    }
  }

  return DEFAULT_CAMPUS_ID;
}

/**
 * Get campus ID from session data directly
 * Use when you have session data from verifySession
 */
export function getCampusIdFromSession(session: SessionData | null): string {
  if (!session) {
    throw new Error('Session required for campus context');
  }

  if (session.campusId) {
    return session.campusId;
  }

  if (session.email) {
    try {
      return getCampusFromEmail(session.email);
    } catch {
      logger.warn('Could not determine campus from email, using default', { component: 'campus-context', email: session.email });
      return DEFAULT_CAMPUS_ID;
    }
  }

  return DEFAULT_CAMPUS_ID;
}

/**
 * Require campus ID - throws if not provided
 * Use for background jobs/cron where request context isn't available
 */
export function requireCampusId(campusId: string | undefined | null): string {
  if (!campusId) {
    throw new Error('Campus ID is required for this operation');
  }
  return campusId;
}

/**
 * Get default campus ID (for development/migration)
 * Only use when explicitly needed for backwards compatibility
 */
export function getDefaultCampusId(): string {
  return DEFAULT_CAMPUS_ID;
}

/**
 * Get all supported campus IDs
 */
export function getSupportedCampusIds(): string[] {
  return [...new Set(Object.values(CAMPUS_DOMAINS))];
}

/**
 * Validate that a campus ID is supported
 */
export function isValidCampusId(campusId: string): boolean {
  return getSupportedCampusIds().includes(campusId);
}
