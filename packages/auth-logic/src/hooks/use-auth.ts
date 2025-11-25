"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Unified Auth Hook
 *
 * Single source of truth for authentication state.
 * Fetches from /api/auth/me which reads the httpOnly JWT cookie.
 *
 * Benefits:
 * - Works identically in dev and production
 * - No localStorage (secure)
 * - No Firebase client SDK dependency for auth state
 * - Stateless and scalable
 * - SSR compatible (cookie sent automatically)
 */

export interface AuthUser {
  uid: string;
  id: string;
  email: string | null;
  fullName: string | null;
  displayName?: string | null;
  handle: string | null;
  bio: string | null;
  major: string | null;
  graduationYear: number | null;
  avatarUrl: string | null;
  photoURL?: string | null;
  isBuilder: boolean;
  builderOptIn?: boolean;
  schoolId: string | null;
  campusId?: string;
  onboardingCompleted: boolean;
  isAdmin?: boolean;
  getIdToken: () => Promise<string>;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  // Compatibility methods for legacy code
  getAuthToken?: () => Promise<string>;
  canAccessFeature: (feature: string) => boolean;
  hasValidSession: () => boolean;
  session: { issuedAt: string } | null;
}

// Cache for session data to avoid unnecessary fetches
let sessionCache: { user: AuthUser | null; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Fetch session from /api/auth/me
   */
  const fetchSession = useCallback(async (skipCache = false): Promise<AuthUser | null> => {
    // Check cache first (client-side only)
    if (typeof window !== "undefined" && !skipCache && sessionCache && Date.now() - sessionCache.timestamp < CACHE_TTL) {
      return sessionCache.user;
    }

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // Important: sends cookies
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.authenticated && data.user) {
        const authUser: AuthUser = {
          uid: data.user.id,
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.fullName,
          displayName: data.user.fullName,
          handle: data.user.handle,
          bio: data.user.bio,
          major: data.user.major,
          graduationYear: data.user.graduationYear,
          avatarUrl: data.user.avatarUrl,
          photoURL: data.user.avatarUrl,
          isBuilder: data.user.isBuilder || false,
          builderOptIn: data.user.builderOptIn || false,
          schoolId: data.user.schoolId,
          campusId: data.user.campusId,
          onboardingCompleted: data.user.onboardingCompleted || false,
          isAdmin: data.user.isAdmin || false,
          getIdToken: async () => {
            // Return a placeholder - actual tokens come from the cookie
            return `session_${data.user.id}`;
          },
        };

        // Update cache
        if (typeof window !== "undefined") {
          sessionCache = { user: authUser, timestamp: Date.now() };
        }
        return authUser;
      }

      // Not authenticated
      if (typeof window !== "undefined") {
        sessionCache = { user: null, timestamp: Date.now() };
      }
      return null;

    } catch (err) {
      console.error("[useAuth] Failed to fetch session:", err);
      throw err;
    }
  }, []);

  /**
   * Refresh user data (force fetch, skip cache)
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const userData = await fetchSession(true);
      setUser(userData);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError({ code: "REFRESH_ERROR", message });
    } finally {
      setIsLoading(false);
    }
  }, [fetchSession]);

  /**
   * Logout - calls logout endpoint and clears state
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear local state and cache
      setUser(null);
      sessionCache = null;

      // Broadcast logout to other tabs
      if (typeof window !== "undefined") {
        localStorage.setItem("hive_auth_event", `logout_${Date.now()}`);
        window.location.href = "/auth/login";
      }
    } catch (err) {
      console.error("[useAuth] Logout failed:", err);
      // Still clear local state
      setUser(null);
      sessionCache = null;
    }
  }, []);

  /**
   * Initial session fetch on mount
   */
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const userData = await fetchSession();
        if (mounted) {
          setUser(userData);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : String(err);
          setError({ code: "INIT_ERROR", message });
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "hive_auth_event") {
        // Another tab logged in/out - refresh
        fetchSession(true).then(userData => {
          if (mounted) setUser(userData);
        }).catch(console.error);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
    }

    return () => {
      mounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
      }
    };
  }, [fetchSession]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    clearError,
    refreshUser,
    logout,
    // Compatibility methods for legacy code
    getAuthToken: user?.getIdToken,
    canAccessFeature: (_feature: string) => !!user, // User must be authenticated
    hasValidSession: () => !!user && !isLoading,
    session: user ? { issuedAt: new Date().toISOString() } : null,
  };
}
