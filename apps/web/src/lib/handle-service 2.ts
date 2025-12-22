import 'server-only';
import { dbAdmin, isFirebaseConfigured } from './firebase-admin';
import { currentEnvironment } from './env';
import { logger } from './logger';
import type { Transaction } from 'firebase-admin/firestore';

/**
 * Centralized handle validation service
 * Fixes race condition between check-handle and complete-onboarding APIs
 */

// Check if we're in development mode
const isDevelopmentMode = currentEnvironment === 'development' || process.env.NODE_ENV === 'development';

export interface HandleValidationResult {
  isAvailable: boolean;
  error?: string;
  normalizedHandle?: string;
}

// Reserved handles that cannot be claimed
const RESERVED_HANDLES = new Set([
  'admin', 'administrator', 'root', 'system', 'api', 'www', 'mail', 'email',
  'support', 'help', 'info', 'contact', 'about', 'terms', 'privacy', 'legal',
  'security', 'safety', 'abuse', 'spam', 'test', 'testing', 'dev', 'development',
  'staging', 'prod', 'production', 'demo', 'example', 'sample', 'null', 'undefined',
  'true', 'false', 'none', 'empty', 'blank', 'default', 'config', 'settings',
  'profile', 'account', 'user', 'users', 'public', 'private', 'internal',
  'external', 'guest', 'anonymous', 'unknown', 'temp', 'temporary', 'delete',
  'remove', 'banned', 'blocked', 'suspended', 'hive', 'hivecampus', 'campus'
]);

/**
 * Validate handle format
 */
export function validateHandleFormat(handle: string): HandleValidationResult {
  if (!handle || typeof handle !== 'string') {
    return { isAvailable: false, error: 'Handle is required' };
  }

  const normalizedHandle = handle.toLowerCase().trim();

  // Length validation
  if (normalizedHandle.length < 3) {
    return { isAvailable: false, error: 'Handle must be at least 3 characters long' };
  }

  if (normalizedHandle.length > 20) {
    return { isAvailable: false, error: 'Handle must be at most 20 characters long' };
  }

  // Format validation - only letters, numbers, underscores, periods, hyphens
  const handleRegex = /^[a-zA-Z0-9._-]+$/;
  if (!handleRegex.test(normalizedHandle)) {
    return { 
      isAvailable: false, 
      error: 'Handle can only contain letters, numbers, periods, underscores, and hyphens' 
    };
  }

  // Additional format rules
  if (normalizedHandle.startsWith('_') || normalizedHandle.endsWith('_')) {
    return { isAvailable: false, error: 'Handle cannot start or end with underscore' };
  }

  if (normalizedHandle.startsWith('.') || normalizedHandle.endsWith('.')) {
    return { isAvailable: false, error: 'Handle cannot start or end with period' };
  }

  if (normalizedHandle.startsWith('-') || normalizedHandle.endsWith('-')) {
    return { isAvailable: false, error: 'Handle cannot start or end with hyphen' };
  }

  // Consecutive special characters
  if (/__+/.test(normalizedHandle) || /\.\.+/.test(normalizedHandle) || /--+/.test(normalizedHandle)) {
    return { isAvailable: false, error: 'Handle cannot contain consecutive special characters' };
  }

  // Reserved handles
  if (RESERVED_HANDLES.has(normalizedHandle)) {
    return { isAvailable: false, error: 'This handle is reserved and cannot be used' };
  }

  return { isAvailable: true, normalizedHandle };
}

/**
 * Check handle availability with atomic database validation
 * This function should be used within a Firestore transaction for consistency
 */
export async function checkHandleAvailabilityInTransaction(
  transaction: Transaction,
  handle: string
): Promise<HandleValidationResult> {
  // First validate format
  const formatResult = validateHandleFormat(handle);
  if (!formatResult.isAvailable) {
    return formatResult;
  }

  const normalizedHandle = formatResult.normalizedHandle!;

  try {
    // Check both collections atomically within the transaction
    const [userQuery, handleDoc] = await Promise.all([
      // Check if any user already has this handle
      transaction.get(
        dbAdmin.collection('users')
          .where('handle', '==', normalizedHandle)
          .limit(1)
      ),
      // Check if handle is reserved in handles collection
      transaction.get(dbAdmin.collection('handles').doc(normalizedHandle))
    ]);

    // Handle is taken if either check returns results
    if (!userQuery.empty || handleDoc.exists) {
      return { 
        isAvailable: false, 
        error: 'This handle is already taken',
        normalizedHandle 
      };
    }

    return { 
      isAvailable: true, 
      normalizedHandle 
    };
  } catch (error) {
    logger.error('Error checking handle availability', { component: 'handle-service' }, error instanceof Error ? error : undefined);
    return {
      isAvailable: false,
      error: 'Unable to verify handle availability. Please try again.'
    };
  }
}

/**
 * Reserve a handle atomically within a transaction
 * This should only be called after checkHandleAvailabilityInTransaction confirms availability
 */
export function reserveHandleInTransaction(
  transaction: Transaction,
  handle: string,
  userId: string,
  userEmail: string
): void {
  const now = new Date();
  
  // Reserve in handles collection
  transaction.set(dbAdmin.collection('handles').doc(handle), {
    userId,
    userEmail,
    reservedAt: now,
    handle // Store the handle for easier queries
  });
}

/**
 * Non-transactional handle availability check for API endpoints
 * This provides a quick check but should not be relied upon for final validation
 */
export async function checkHandleAvailability(handle: string): Promise<HandleValidationResult> {
  // First validate format
  const formatResult = validateHandleFormat(handle);
  if (!formatResult.isAvailable) {
    return formatResult;
  }

  const normalizedHandle = formatResult.normalizedHandle!;

  // Development mode or Firebase not configured: Skip Firestore queries entirely
  if (isDevelopmentMode || !isFirebaseConfigured) {
    logger.debug('Development mode: Skipping Firestore handle check', { component: 'handle-service', handle: normalizedHandle });
    return {
      isAvailable: true,
      normalizedHandle
    };
  }

  try {
    // Check both collections (but not atomically)
    const [userQuery, handleDoc] = await Promise.all([
      dbAdmin.collection('users')
        .where('handle', '==', normalizedHandle)
        .limit(1)
        .get(),
      dbAdmin.collection('handles').doc(normalizedHandle).get()
    ]);

    if (!userQuery.empty || handleDoc.exists) {
      return {
        isAvailable: false,
        error: 'This handle is already taken',
        normalizedHandle
      };
    }

    return {
      isAvailable: true,
      normalizedHandle
    };
  } catch (error) {
    logger.error('Error checking handle availability', { component: 'handle-service' }, error instanceof Error ? error : undefined);

    // In development, allow handles when Firebase is unavailable
    if (isDevelopmentMode) {
      logger.debug('Development mode: Allowing handle due to Firebase unavailability', { component: 'handle-service' });
      return {
        isAvailable: true,
        normalizedHandle
      };
    }

    return {
      isAvailable: false,
      error: 'Unable to verify handle availability. Please try again.'
    };
  }
}

/**
 * Release a handle reservation (for cleanup or error recovery)
 */
export async function releaseHandleReservation(handle: string): Promise<void> {
  // Skip in development mode
  if (isDevelopmentMode || !isFirebaseConfigured) {
    return;
  }

  try {
    await dbAdmin.collection('handles').doc(handle).delete();
  } catch (error) {
    logger.error('Error releasing handle reservation', { component: 'handle-service', handle }, error instanceof Error ? error : undefined);
    // Don't throw - this is cleanup, should not break the main flow
  }
}

/**
 * Handle change rate limit configuration
 */
const HANDLE_CHANGE_COOLDOWN_MS = 6 * 30 * 24 * 60 * 60 * 1000; // 6 months in milliseconds

export interface HandleChangeResult {
  success: boolean;
  error?: string;
  nextChangeDate?: Date;
}

/**
 * Change a user's handle with rate limiting and proper cleanup
 * - First change after onboarding is FREE
 * - Subsequent changes require 6-month cooldown
 * - Old handle is released, new handle is reserved atomically
 * - Full handle history is tracked
 */
export async function changeHandle(
  userId: string,
  newHandle: string
): Promise<HandleChangeResult> {
  // Validate format first
  const formatResult = validateHandleFormat(newHandle);
  if (!formatResult.isAvailable) {
    return { success: false, error: formatResult.error };
  }

  const normalizedHandle = formatResult.normalizedHandle!;

  // Skip full validation in development mode
  if (isDevelopmentMode || !isFirebaseConfigured) {
    logger.debug('Development mode: Skipping handle change transaction', { component: 'handle-service' });
    return { success: true };
  }

  try {
    const result = await dbAdmin.runTransaction(async (transaction) => {
      // 1. Get current user data
      const userRef = dbAdmin.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        return { success: false, error: 'User not found' };
      }

      const userData = userDoc.data()!;
      const currentHandle = userData.handle;

      // If handle is the same, no change needed
      if (currentHandle === normalizedHandle) {
        return { success: true };
      }

      // 2. Check rate limit - FIRST CHANGE IS FREE
      const handleChangeCount = userData.handleChangeCount || 0;
      const lastHandleChange = userData.lastHandleChange;

      if (handleChangeCount > 0 && lastHandleChange) {
        const lastChangeMs = lastHandleChange.toMillis ? lastHandleChange.toMillis() : new Date(lastHandleChange).getTime();
        const nextChangeAllowedMs = lastChangeMs + HANDLE_CHANGE_COOLDOWN_MS;

        if (Date.now() < nextChangeAllowedMs) {
          const nextChangeDate = new Date(nextChangeAllowedMs);
          return {
            success: false,
            error: `Handle can only be changed once every 6 months. Next change available on ${nextChangeDate.toLocaleDateString()}`,
            nextChangeDate
          };
        }
      }

      // 3. Check if new handle is available (atomically in transaction)
      const availabilityResult = await checkHandleAvailabilityInTransaction(transaction, normalizedHandle);
      if (!availabilityResult.isAvailable) {
        return { success: false, error: availabilityResult.error || 'Handle is not available' };
      }

      // 4. Release old handle reservation (if exists)
      if (currentHandle) {
        const oldHandleRef = dbAdmin.collection('handles').doc(currentHandle);
        transaction.delete(oldHandleRef);
      }

      // 5. Reserve new handle
      const newHandleRef = dbAdmin.collection('handles').doc(normalizedHandle);
      transaction.set(newHandleRef, {
        userId,
        userEmail: userData.email,
        reservedAt: new Date(),
        handle: normalizedHandle
      });

      // 6. Update user document with new handle and tracking fields
      const updateData: Record<string, unknown> = {
        handle: normalizedHandle,
        lastHandleChange: new Date(),
        handleChangeCount: (handleChangeCount || 0) + 1,
        updatedAt: new Date()
      };

      // Add to handle history if there was a previous handle
      if (currentHandle) {
        // Use array union pattern for history
        const currentHistory = userData.handleHistory || [];
        updateData.handleHistory = [
          ...currentHistory,
          {
            handle: currentHandle,
            changedAt: new Date()
          }
        ];
      }

      transaction.update(userRef, updateData);

      return { success: true };
    });

    return result;
  } catch (error) {
    logger.error('Error changing handle', { component: 'handle-service' }, error instanceof Error ? error : undefined);
    return {
      success: false,
      error: 'Unable to change handle. Please try again.'
    };
  }
}

/**
 * Get handle change status for a user
 * Returns whether they can change their handle and when
 */
export async function getHandleChangeStatus(userId: string): Promise<{
  canChange: boolean;
  nextChangeDate?: Date;
  changeCount: number;
  isFirstChangeFree: boolean;
}> {
  if (isDevelopmentMode || !isFirebaseConfigured) {
    return { canChange: true, changeCount: 0, isFirstChangeFree: true };
  }

  try {
    const userDoc = await dbAdmin.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return { canChange: false, changeCount: 0, isFirstChangeFree: true };
    }

    const userData = userDoc.data()!;
    const handleChangeCount = userData.handleChangeCount || 0;
    const lastHandleChange = userData.lastHandleChange;

    // First change is always free
    if (handleChangeCount === 0) {
      return { canChange: true, changeCount: 0, isFirstChangeFree: true };
    }

    // Check cooldown for subsequent changes
    if (lastHandleChange) {
      const lastChangeMs = lastHandleChange.toMillis ? lastHandleChange.toMillis() : new Date(lastHandleChange).getTime();
      const nextChangeAllowedMs = lastChangeMs + HANDLE_CHANGE_COOLDOWN_MS;

      if (Date.now() < nextChangeAllowedMs) {
        return {
          canChange: false,
          nextChangeDate: new Date(nextChangeAllowedMs),
          changeCount: handleChangeCount,
          isFirstChangeFree: false
        };
      }
    }

    return { canChange: true, changeCount: handleChangeCount, isFirstChangeFree: false };
  } catch (error) {
    logger.error('Error getting handle change status', { component: 'handle-service', userId }, error instanceof Error ? error : undefined);
    return { canChange: false, changeCount: 0, isFirstChangeFree: true };
  }
}
