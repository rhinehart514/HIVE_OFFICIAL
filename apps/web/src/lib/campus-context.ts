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
  if (auth.campusId) {
    return auth.campusId;
  }

  if (auth.email) {
    return getCampusFromEmail(auth.email);
  }

  throw new Error('Campus identification required: no campusId or recognized email domain');
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
    return getCampusFromEmail(session.email);
  }

  throw new Error('Campus identification required: no campusId or recognized email domain in session');
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
 * School status for multi-campus architecture
 */
export type SchoolStatus = 'active' | 'beta' | 'waitlist' | 'unsupported';

/**
 * Result from getSchoolFromEmailAsync
 */
export interface SchoolLookupResult {
  campusId: string;
  status: SchoolStatus;
  schoolName: string;
  domain: string;
}

/**
 * Cache for full school data (includes waitlist schools)
 */
let fullSchoolCache: Map<string, SchoolLookupResult> | null = null;
let fullSchoolCacheTime = 0;

/**
 * Load full school data including waitlist schools from Firestore
 */
async function loadFullSchoolData(): Promise<Map<string, SchoolLookupResult>> {
  const now = Date.now();

  // Return cached if valid
  if (fullSchoolCache && now - fullSchoolCacheTime < CACHE_TTL) {
    return fullSchoolCache;
  }

  // If Firebase not configured, use fallback
  if (!isFirebaseConfigured) {
    const fallbackMap = new Map<string, SchoolLookupResult>();
    fallbackMap.set('buffalo.edu', {
      campusId: 'ub-buffalo',
      status: 'active',
      schoolName: 'University at Buffalo',
      domain: 'buffalo.edu',
    });
    fallbackMap.set('ub.edu', {
      campusId: 'ub-buffalo',
      status: 'active',
      schoolName: 'University at Buffalo',
      domain: 'ub.edu',
    });
    fullSchoolCache = fallbackMap;
    fullSchoolCacheTime = now;
    return fallbackMap;
  }

  try {
    const mapping = new Map<string, SchoolLookupResult>();

    // Load ALL schools (active, beta, and waitlist)
    const schoolsSnapshot = await dbAdmin
      .collection('schools')
      .get();

    for (const doc of schoolsSnapshot.docs) {
      const school = doc.data();
      const campusId = school.campusId || doc.id;
      const schoolName = school.name || doc.id;

      // Determine status
      let status: SchoolStatus = 'waitlist';
      if (school.status === 'active' || school.active === true) {
        status = 'active';
      } else if (school.status === 'beta') {
        status = 'beta';
      } else if (school.status === 'waitlist' || school.active === false) {
        status = 'waitlist';
      }

      // Collect all email domains
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
          const normalizedDomain = domain.toLowerCase();
          mapping.set(normalizedDomain, {
            campusId,
            status,
            schoolName,
            domain: normalizedDomain,
          });
        }
      }
    }

    // Ensure UB is always available (fallback safety)
    if (!mapping.has('buffalo.edu')) {
      mapping.set('buffalo.edu', {
        campusId: 'ub-buffalo',
        status: 'active',
        schoolName: 'University at Buffalo',
        domain: 'buffalo.edu',
      });
      mapping.set('ub.edu', {
        campusId: 'ub-buffalo',
        status: 'active',
        schoolName: 'University at Buffalo',
        domain: 'ub.edu',
      });
    }

    fullSchoolCache = mapping;
    fullSchoolCacheTime = now;

    logger.debug('Refreshed full school cache', {
      component: 'campus-context',
      schoolCount: schoolsSnapshot.size,
      domainCount: mapping.size,
    });

    return mapping;
  } catch (error) {
    logger.error('Failed to load full school data from Firestore', {
      component: 'campus-context',
      error: error instanceof Error ? error.message : String(error),
    });

    // Fall back to UB only
    const fallbackMap = new Map<string, SchoolLookupResult>();
    fallbackMap.set('buffalo.edu', {
      campusId: 'ub-buffalo',
      status: 'active',
      schoolName: 'University at Buffalo',
      domain: 'buffalo.edu',
    });
    fullSchoolCache = fallbackMap;
    fullSchoolCacheTime = now;
    return fallbackMap;
  }
}

/**
 * Get school information from email domain
 * Returns status to allow handling of waitlisted schools
 * @throws Error with code 'UNSUPPORTED_DOMAIN' if domain is not recognized
 */
export async function getSchoolFromEmailAsync(email: string): Promise<SchoolLookupResult> {
  if (!email || typeof email !== 'string') {
    const error = new Error('Email is required for school lookup');
    (error as Error & { code?: string }).code = 'INVALID_INPUT';
    throw error;
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    const error = new Error('Invalid email format');
    (error as Error & { code?: string }).code = 'INVALID_INPUT';
    throw error;
  }

  const domain = parts[1].toLowerCase();
  const schoolMap = await loadFullSchoolData();

  // Check for exact match first
  if (schoolMap.has(domain)) {
    return schoolMap.get(domain)!;
  }

  // Check for subdomain match (e.g., 'cs.buffalo.edu' -> 'buffalo.edu')
  const domainParts = domain.split('.');
  for (let i = 0; i < domainParts.length - 1; i++) {
    const parentDomain = domainParts.slice(i).join('.');
    if (schoolMap.has(parentDomain)) {
      return schoolMap.get(parentDomain)!;
    }
  }

  // Domain not found - throw unsupported error
  const error = new Error(`Unsupported email domain: ${domain}`);
  (error as Error & { code?: string }).code = 'UNSUPPORTED_DOMAIN';
  throw error;
}

/**
 * Clear full school cache (for testing or manual refresh)
 */
export function clearFullSchoolCache(): void {
  fullSchoolCache = null;
  fullSchoolCacheTime = 0;
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
