'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import type { AdminUser } from './admin-auth';

/**
 * Admin Panel Client-Side Authentication
 *
 * SECURITY: Uses Firebase Auth for authentication
 * Admin status verified via custom claims set by server
 */

/**
 * Get Firebase auth instance for admin app
 */
function getFirebaseAuth() {
  // Dynamic import to avoid SSR issues
  return getAuth();
}

/**
 * Get current admin user from Firebase Auth
 * SECURITY: Relies on Firebase custom claims for admin verification
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;

    if (!user) {
      return null;
    }

    // Get ID token result to access custom claims
    const tokenResult = await user.getIdTokenResult();
    const claims = tokenResult.claims;

    // Verify admin claim
    if (claims.admin !== true) {
      return null;
    }

    return {
      id: user.uid,
      email: user.email || '',
      role: (claims.adminRole as AdminUser['role']) || 'admin',
      permissions: (claims.permissions as string[]) || ['read'],
      lastLogin: new Date(),
    };
  } catch {
    return null;
  }
}

/**
 * Client-side admin authentication hook
 * SECURITY: Uses Firebase Auth state and custom claims
 */
export function useAdminAuth() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      setLoading(true);
      setError(null);

      if (!user) {
        setAdmin(null);
        setLoading(false);
        return;
      }

      try {
        // Get ID token result to access custom claims
        const tokenResult = await user.getIdTokenResult();
        const claims = tokenResult.claims;

        // Verify admin claim
        if (claims.admin !== true) {
          setAdmin(null);
          setError('Not authorized as admin');
          setLoading(false);
          return;
        }

        setAdmin({
          id: user.uid,
          email: user.email || '',
          role: (claims.adminRole as AdminUser['role']) || 'admin',
          permissions: (claims.permissions as string[]) || ['read'],
          lastLogin: new Date(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify admin status');
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    admin,
    loading,
    error,
    isAuthenticated: !!admin,
    hasPermission: (permission: string) => admin?.permissions.includes(permission) ?? false,
  };
}
