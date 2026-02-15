/**
 * App Config Reader
 *
 * Reads app configuration from Firestore `app_config` collection
 * with a 5-minute in-memory cache (TTL per key).
 */

import { dbAdmin } from '@/lib/firebase-admin';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

/**
 * Get a config value by key, with caching.
 */
export async function getAppConfig(key: string): Promise<unknown> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const doc = await dbAdmin.collection('app_config').doc(key).get();
  const value = doc.exists ? doc.data()?.value : undefined;

  cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
  return value;
}

/**
 * Get a boolean config value with a default.
 */
export async function getAppConfigBool(key: string, defaultValue: boolean): Promise<boolean> {
  const value = await getAppConfig(key);
  return typeof value === 'boolean' ? value : defaultValue;
}

/**
 * Get a string config value with a default.
 */
export async function getAppConfigString(key: string, defaultValue: string): Promise<string> {
  const value = await getAppConfig(key);
  return typeof value === 'string' ? value : defaultValue;
}

/**
 * Invalidate a cached config key (useful after updates).
 */
export function invalidateAppConfig(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate all cached configs.
 */
export function invalidateAllAppConfig(): void {
  cache.clear();
}
