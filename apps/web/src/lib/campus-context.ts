/**
 * Campus Context - Runtime Tenant Isolation
 *
 * Provides campus identification from user session/email.
 * Dynamically loads domain mappings from Firestore schools collection.
 */

import 'server-only';
import { validateApiAuth, type AuthContext } from './api-auth-middleware';
import { type SessionData } from './session';
import { NextRequest } from 'next/server';
import { logger } from './logger';
import { dbAdmin, isFirebaseConfigured } from './firebase-admin';

/**
 * Fallback campus domain mapping (used when Firestore unavailable)
 */
const FALLBACK_CAMPUS_DOMAINS: Record<string, string> = {
  'buffalo.edu': 'ub-buffalo',
  'ub.edu': 'ub-buffalo',
};

/**
 * Default campus for development/fallback
 */
const DEFAULT_CAMPUS_ID = 'ub-buffalo';

/**
 * Domain cache for performance (refreshes every 5 minutes)
 */
let domainCache: Map<string, string> | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load domain -> campusId mappings from Firestore schools collection
 */
async function loadDomainMappings(): Promise<Map<string, string>> {
  const now = Date.now();

  // Return cached if valid
  if (domainCache && now - cacheTime < CACHE_TTL) {
    return domainCache;
  }

  // If Firebase not configured, use fallback
  if (!isFirebaseConfigured) {
    const fallbackMap = new Map(Object.entries(FALLBACK_CAMPUS_DOMAINS));
    domainCache = fallbackMap;
    cacheTime = now;
    return fallbackMap;
  }

  try {
    const mapping = new Map<string, string>();

    // Load all active schools
    const schoolsSnapshot = await dbAdmin
      .collection('schools')
      .where('status', 'in', ['beta', 'active'])
      .get();

    for (const doc of schoolsSnapshot.docs) {
      const school = doc.data();
      const campusId = school.campusId || doc.id;

      // Add all email domains to mapping
      const emailDomains = school.emailDomains || {};
      const allDomains = [
        ...(emailDomains.student || []),
        ...(emailDomains.faculty || []),
        ...(emailDomains.staff || []),
        ...(emailDomains.alumni || []),
      ];

      // Also add the legacy single domain field
      if (school.domain) {
        allDomains.push(school.domain);
      }

      for (const domain of allDomains) {
        if (domain && typeof domain === 'string') {
          mapping.set(domain.toLowerCase(), campusId);
        }
      }
    }

    // Ensure UB is always available (fallback safety)
    if (!mapping.has('buffalo.edu')) {
      mapping.set('buffalo.edu', 'ub-buffalo');
      mapping.set('ub.edu', 'ub-buffalo');
    }

    domainCache = mapping;
    cacheTime = now;

    logger.debug('Refreshed campus domain cache', {
      component: 'campus-context',
      schoolCount: schoolsSnapshot.size,
      domainCount: mapping.size,
    });

    return mapping;
  } catch (error) {
    logger.error('Failed to load domain mappings from Firestore', {
      component: 'campus-context',
      error: error instanceof Error ? error.message : String(error),
    });

    // Fall back to hardcoded mappings
    const fallbackMap = new Map(Object.entries(FALLBACK_CAMPUS_DOMAINS));
    domainCache = fallbackMap;
    cacheTime = now;
    return fallbackMap;
  }
}

/**
 * Get domain mappings (sync wrapper for backwards compatibility)
 * Prefers cached data, falls back to hardcoded if cache empty
 */
function getDomainMappingsSync(): Map<string, string> {
  if (domainCache) {
    return domainCache;
  }
  return new Map(Object.entries(FALLBACK_CAMPUS_DOMAINS));
}

/**
 * Derive campus ID from email domain (async version - preferred)
 * @throws Error if domain is not recognized
 */
export async function getCampusFromEmailAsync(email: string): Promise<string> {
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required for campus detection');
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    throw new Error('Invalid email format');
  }

  const domain = parts[1].toLowerCase();
  const domainMap = await loadDomainMappings();

  // Check for exact match first
  if (domainMap.has(domain)) {
    return domainMap.get(domain)!;
  }

  // Check for subdomain match (e.g., 'cs.buffalo.edu' -> 'buffalo.edu')
  const domainParts = domain.split('.');
  for (let i = 0; i < domainParts.length - 1; i++) {
    const parentDomain = domainParts.slice(i).join('.');
    if (domainMap.has(parentDomain)) {
      return domainMap.get(parentDomain)!;
    }
  }

  throw new Error(`Unsupported email domain: ${domain}`);
}

/**
 * Derive campus ID from email domain (sync version for backwards compatibility)
 * Uses cached data if available, otherwise falls back to hardcoded mappings
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
  const domainMap = getDomainMappingsSync();

  // Check for exact match first
  if (domainMap.has(domain)) {
    return domainMap.get(domain)!;
  }

  // Check for subdomain match (e.g., 'cs.buffalo.edu' -> 'buffalo.edu')
  const domainParts = domain.split('.');
  for (let i = 0; i < domainParts.length - 1; i++) {
    const parentDomain = domainParts.slice(i).join('.');
    if (domainMap.has(parentDomain)) {
      return domainMap.get(parentDomain)!;
    }
  }

  throw new Error(`Unsupported email domain: ${domain}`);
}

/**
 * Check if an email domain is supported (async - preferred)
 */
export async function isSupportedEmailDomainAsync(email: string): Promise<boolean> {
  try {
    await getCampusFromEmailAsync(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an email domain is supported (sync for backwards compatibility)
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
 * Get all supported campus IDs (async - preferred)
 */
export async function getSupportedCampusIdsAsync(): Promise<string[]> {
  const domainMap = await loadDomainMappings();
  return [...new Set(domainMap.values())];
}

/**
 * Get all supported campus IDs (sync for backwards compatibility)
 */
export function getSupportedCampusIds(): string[] {
  const domainMap = getDomainMappingsSync();
  return [...new Set(domainMap.values())];
}

/**
 * Validate that a campus ID is supported (async - preferred)
 */
export async function isValidCampusIdAsync(campusId: string): Promise<boolean> {
  const campusIds = await getSupportedCampusIdsAsync();
  return campusIds.includes(campusId);
}

/**
 * Validate that a campus ID is supported (sync for backwards compatibility)
 */
export function isValidCampusId(campusId: string): boolean {
  return getSupportedCampusIds().includes(campusId);
}

/**
 * Preload domain cache (call during server startup)
 */
export async function preloadDomainCache(): Promise<void> {
  await loadDomainMappings();
}

/**
 * Clear domain cache (for testing or manual refresh)
 */
export function clearDomainCache(): void {
  domainCache = null;
  cacheTime = 0;
}
