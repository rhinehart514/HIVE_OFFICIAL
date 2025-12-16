"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Unified Auth Hook
 *
 * Single source of truth for authentication state.
 * Fetches from /api/auth/me which reads the httpOnly JWT cookie.
 *
 * Security Features:
 * - Short-lived access tokens (15 min) with automatic refresh
 * - Refresh tokens (7 days) stored in httpOnly cookies
 * - Cross-tab synchronization via localStorage events
 * - Automatic token refresh before expiration
 *
 * Benefits:
 * - Works identically in dev and production
 * - No localStorage for tokens (secure against XSS)
 * - No Firebase client SDK dependency for auth state
 * - Stateless and scalable
 * - SSR compatible (cookie sent automatically)
 */

// Token refresh configuration
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // Check every 10 minutes
const TOKEN_REFRESH_BUFFER = 2 * 60 * 1000; // Refresh 2 minutes before expiry

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
  refreshToken: () => Promise<boolean>;
  logout: () => Promise<void>;
  // Compatibility methods for legacy code
  getAuthToken?: () => Promise<string>;
  canAccessFeature: (feature: string) => boolean;
  hasValidSession: () => boolean;
  session: { issuedAt: string } | null;
  // Token status
  isRefreshing: boolean;
}

// Cache for session data to avoid unnecessary fetches
let sessionCache: { user: AuthUser | null; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track refresh timer
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

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
      // Re-throw to allow caller to handle
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
   * Refresh the access token using the refresh token
   * Returns true if successful, false otherwise
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) {
      return false;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Refresh failed - user needs to re-authenticate
        if (response.status === 401) {
          setUser(null);
          sessionCache = null;
          // Broadcast logout to other tabs
          if (typeof window !== "undefined") {
            localStorage.setItem("hive_auth_event", `session_expired_${Date.now()}`);
          }
        }
        return false;
      }

      const data = await response.json();

      if (data.success && data.user) {
        // Refresh the user data after token refresh
        await fetchSession(true);
        return true;
      }

      return false;
    } catch (err) {
      // Network error or other issue
      return false;
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [fetchSession]);

  /**
   * Setup automatic token refresh
   */
  const setupTokenRefresh = useCallback(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // Set up periodic refresh check
    refreshTimerRef.current = setInterval(async () => {
      // Only refresh if user is authenticated
      if (user && !isRefreshingRef.current) {
        await refreshToken();
      }
    }, TOKEN_REFRESH_INTERVAL);
  }, [user, refreshToken]);

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
    } catch (_err) {
      // Still clear local state on logout failure
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
        // Check if it's a 401 error - try to refresh the token
        if (err instanceof Error && err.message.includes('401')) {
          const refreshed = await refreshToken();
          if (refreshed && mounted) {
            const userData = await fetchSession(true);
            setUser(userData);
            setError(null);
            return;
          }
        }

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
        const value = e.newValue || '';
        // Handle session expiration from other tabs
        if (value.startsWith('session_expired_') || value.startsWith('logout_')) {
          if (mounted) {
            setUser(null);
            sessionCache = null;
          }
          return;
        }
        // Another tab logged in - refresh
        fetchSession(true).then(userData => {
          if (mounted) setUser(userData);
        }).catch(() => {
          // Silently handle cross-tab sync errors
        });
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
  }, [fetchSession, refreshToken]);

  /**
   * Setup token refresh when user is authenticated
   */
  useEffect(() => {
    if (user) {
      setupTokenRefresh();
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [user, setupTokenRefresh]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    clearError,
    refreshUser,
    refreshToken,
    logout,
    // Compatibility methods for legacy code
    getAuthToken: user?.getIdToken,
    canAccessFeature: (_feature: string) => !!user, // User must be authenticated
    hasValidSession: () => !!user && !isLoading,
    session: user ? { issuedAt: new Date().toISOString() } : null,
    // Token status
    isRefreshing,
  };
}
