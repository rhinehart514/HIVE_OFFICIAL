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
 * - Proactive token refresh before expiration (2 min buffer)
 * - Visibility-aware refresh (refreshes when tab becomes visible)
 *
 * Benefits:
 * - Works identically in dev and production
 * - No localStorage for tokens (secure against XSS)
 * - No Firebase client SDK dependency for auth state
 * - Stateless and scalable
 * - SSR compatible (cookie sent automatically)
 */

// Token refresh configuration
const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000; // Refresh 2 minutes before expiry
const MIN_REFRESH_INTERVAL_MS = 30 * 1000; // Minimum 30 seconds between refresh attempts
const FALLBACK_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // Fallback: check every 10 minutes if no expiration info

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

export interface SessionInfo {
  issuedAt: string;
  expiresAt?: number;
  expiresIn?: number;
  canRefresh?: boolean;
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
  session: SessionInfo | null;
  // Token status
  isRefreshing: boolean;
}

// Cache for session data to avoid unnecessary fetches
let sessionCache: { user: AuthUser | null; sessionInfo: SessionInfo | null; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track refresh timer and last refresh attempt
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const lastRefreshAttemptRef = useRef<number>(0);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Fetch session from /api/auth/me
   * Returns both user data and session info (including expiration)
   */
  const fetchSession = useCallback(async (skipCache = false): Promise<{ user: AuthUser | null; sessionInfo: SessionInfo | null }> => {
    // Check cache first (client-side only)
    if (typeof window !== "undefined" && !skipCache && sessionCache && Date.now() - sessionCache.timestamp < CACHE_TTL) {
      return { user: sessionCache.user, sessionInfo: sessionCache.sessionInfo };
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

        // Extract session info with expiration data
        const sessionData: SessionInfo = {
          issuedAt: data.session?.verifiedAt || new Date().toISOString(),
          expiresAt: data.session?.expiresAt,
          expiresIn: data.session?.expiresIn,
          canRefresh: data.session?.canRefresh,
        };

        // Update cache
        if (typeof window !== "undefined") {
          sessionCache = { user: authUser, sessionInfo: sessionData, timestamp: Date.now() };
        }
        return { user: authUser, sessionInfo: sessionData };
      }

      // Not authenticated
      if (typeof window !== "undefined") {
        sessionCache = { user: null, sessionInfo: null, timestamp: Date.now() };
      }
      return { user: null, sessionInfo: null };

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
      const { user: userData, sessionInfo: sessInfo } = await fetchSession(true);
      setUser(userData);
      setSessionInfo(sessInfo);
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
   *
   * Security: Prevents rapid refresh attempts (min 30s between attempts)
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) {
      return false;
    }

    // Prevent rapid refresh attempts
    const now = Date.now();
    if (now - lastRefreshAttemptRef.current < MIN_REFRESH_INTERVAL_MS) {
      return false;
    }

    isRefreshingRef.current = true;
    lastRefreshAttemptRef.current = now;
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
          setSessionInfo(null);
          sessionCache = null;
          // Broadcast session expiration to other tabs
          if (typeof window !== "undefined") {
            localStorage.setItem("hive_auth_event", `session_expired_${Date.now()}`);
            // Redirect to login after a brief delay to allow state cleanup
            setTimeout(() => {
              window.location.href = "/enter?reason=session_expired";
            }, 100);
          }
        }
        return false;
      }

      const data = await response.json();

      if (data.success) {
        // Refresh the user data and session info after token refresh
        const { user: userData, sessionInfo: sessInfo } = await fetchSession(true);
        setUser(userData);
        setSessionInfo(sessInfo);
        return true;
      }

      return false;
    } catch {
      // Network error or other issue - don't clear session, let retry happen
      return false;
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [fetchSession]);

  /**
   * Setup automatic token refresh based on expiration time
   * Uses proactive refresh (2 minutes before expiry) when expiration info is available
   * Falls back to periodic refresh if no expiration info
   */
  const setupTokenRefresh = useCallback(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Only set up refresh if user is authenticated and refresh is possible
    if (!user || !sessionInfo?.canRefresh) {
      return;
    }

    // Calculate when to refresh
    let refreshDelay: number;

    if (sessionInfo.expiresAt) {
      // Proactive refresh: 2 minutes before token expires
      const timeUntilExpiry = sessionInfo.expiresAt - Date.now();
      refreshDelay = Math.max(
        MIN_REFRESH_INTERVAL_MS, // At least 30 seconds from now
        timeUntilExpiry - TOKEN_REFRESH_BUFFER_MS // 2 minutes before expiry
      );
    } else if (sessionInfo.expiresIn !== undefined) {
      // Use expiresIn (seconds) if expiresAt not available
      const timeUntilExpiry = sessionInfo.expiresIn * 1000;
      refreshDelay = Math.max(
        MIN_REFRESH_INTERVAL_MS,
        timeUntilExpiry - TOKEN_REFRESH_BUFFER_MS
      );
    } else {
      // Fallback to periodic refresh every 10 minutes
      refreshDelay = FALLBACK_REFRESH_INTERVAL_MS;
    }

    // Schedule the refresh
    refreshTimerRef.current = setTimeout(async () => {
      if (user && !isRefreshingRef.current) {
        const success = await refreshToken();
        // If refresh succeeded, setupTokenRefresh will be called again via useEffect
        // If it failed but user still exists (network error), set up fallback retry
        if (!success && user) {
          refreshTimerRef.current = setTimeout(() => {
            if (user && !isRefreshingRef.current) {
              refreshToken();
            }
          }, MIN_REFRESH_INTERVAL_MS * 2); // Retry in 1 minute
        }
      }
    }, refreshDelay);
  }, [user, sessionInfo, refreshToken]);

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
        const { user: userData, sessionInfo: sessInfo } = await fetchSession();
        if (mounted) {
          setUser(userData);
          setSessionInfo(sessInfo);
          setError(null);
        }
      } catch (err) {
        // Check if it's a 401 error - try to refresh the token
        if (err instanceof Error && err.message.includes('401')) {
          const refreshed = await refreshToken();
          if (refreshed && mounted) {
            const { user: userData, sessionInfo: sessInfo } = await fetchSession(true);
            setUser(userData);
            setSessionInfo(sessInfo);
            setError(null);
            return;
          }
        }

        if (mounted) {
          const message = err instanceof Error ? err.message : String(err);
          setError({ code: "INIT_ERROR", message });
          setUser(null);
          setSessionInfo(null);
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
            setSessionInfo(null);
            sessionCache = null;
            // Redirect to login
            window.location.href = "/enter?reason=session_expired";
          }
          return;
        }
        // Another tab logged in - refresh
        fetchSession(true).then(({ user: userData, sessionInfo: sessInfo }) => {
          if (mounted) {
            setUser(userData);
            setSessionInfo(sessInfo);
          }
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
   * Also handles visibility changes to refresh when tab becomes visible
   */
  useEffect(() => {
    if (user && sessionInfo) {
      setupTokenRefresh();
    }

    // Handle visibility change - refresh when tab becomes visible after being hidden
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user && sessionInfo?.canRefresh && !isRefreshingRef.current) {
        // Tab became visible - check if token is close to expiring or has expired
        if (sessionInfo.expiresAt) {
          const timeUntilExpiry = sessionInfo.expiresAt - Date.now();
          // If token expires in less than 5 minutes or already expired, refresh immediately
          if (timeUntilExpiry < 5 * 60 * 1000) {
            await refreshToken();
            return;
          }
        }

        // Fallback: if more than 5 minutes since last cache update, refresh
        const lastRefresh = sessionCache?.timestamp || 0;
        const timeSinceRefresh = Date.now() - lastRefresh;
        if (timeSinceRefresh > 5 * 60 * 1000) {
          await refreshToken();
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [user, sessionInfo, setupTokenRefresh, refreshToken]);

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
    session: sessionInfo,
    // Token status
    isRefreshing,
  };
}
