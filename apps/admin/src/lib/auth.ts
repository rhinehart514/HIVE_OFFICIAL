'use client';

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@hive/firebase';
import type { AdminUser } from './types';

/**
 * Admin Panel Client-Side Authentication
 *
 * SECURITY: Uses Firebase Auth + JWT session cookies for authentication
 * Session verified server-side via /api/auth/session
 */

/**
 * Get Firebase auth instance for admin app
 * Uses the initialized auth from @hive/firebase
 */
function getFirebaseAuth() {
  return auth;
}

/**
 * Get current admin user from session API
 * SECURITY: Verifies JWT session cookie server-side
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.authenticated || !data.admin) {
      return null;
    }

    return {
      id: data.admin.id,
      email: data.admin.email,
      role: data.admin.role,
      permissions: data.admin.permissions || ['read'],
      lastLogin: new Date(),
      campusId: data.admin.campusId,
    };
  } catch {
    return null;
  }
}

/**
 * Logout from admin panel
 * Clears both Firebase auth and JWT session cookie
 */
export async function logout(): Promise<void> {
  try {
    // Clear server-side JWT session
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Continue with client-side signout even if server call fails
  }

  // Clear Firebase client-side auth
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

/**
 * Client-side admin authentication hook
 * SECURITY: Uses JWT session verification via /api/auth/session
 */
export function useAdminAuth() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verify session on mount and when Firebase auth state changes
  const verifySession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const adminUser = await getCurrentAdmin();

      if (!adminUser) {
        setAdmin(null);
        // Don't set error for unauthenticated state - it's normal on login page
        setLoading(false);
        return;
      }

      setAdmin(adminUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify admin status');
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial session check
    verifySession();

    // Also listen for Firebase auth state changes as a trigger to re-verify
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (!user) {
        // Firebase signed out, clear admin state
        setAdmin(null);
        setLoading(false);
        return;
      }

      // Re-verify session when Firebase auth state changes
      await verifySession();
    });

    return () => unsubscribe();
  }, [verifySession]);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    await logout();
    setAdmin(null);
    setLoading(false);
  }, []);

  return {
    admin,
    loading,
    error,
    isAuthenticated: !!admin,
    hasPermission: (permission: string) => admin?.permissions.includes(permission) ?? false,
    logout: handleLogout,
    refreshSession: verifySession,
  };
}
