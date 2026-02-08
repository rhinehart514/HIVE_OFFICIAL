'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '@hive/auth-logic';

const STORAGE_KEY = 'hive_admin_flag_overrides';

interface ImpersonationProfile {
  id: string;
  displayName: string | null;
  email: string | null;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
  major: string | null;
  graduationYear: number | null;
  isBuilder: boolean;
  onboardingCompleted: boolean;
  schoolId: string | null;
  campusId: string | null;
  createdAt: string | null;
}

interface ImpersonationState {
  sessionId: string;
  profile: ImpersonationProfile;
}

type TabId = 'flags' | 'debug' | 'factory' | 'viewas';

interface AdminToolbarContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  flagOverrides: Record<string, boolean>;
  setFlagOverride: (id: string, value: boolean | null) => void;
  clearAllOverrides: () => void;
  hasOverrides: boolean;
  impersonation: ImpersonationState | null;
  startImpersonation: (sessionId: string, profile: ImpersonationProfile) => void;
  endImpersonation: () => void;
}

const AdminToolbarContext = createContext<AdminToolbarContextValue | null>(null);

export function useAdminToolbar(): AdminToolbarContextValue {
  const ctx = useContext(AdminToolbarContext);
  if (!ctx) {
    throw new Error('useAdminToolbar must be used within AdminToolbarProvider');
  }
  return ctx;
}

/** Safe variant — returns null when no admin context exists (non-admin users) */
export function useAdminToolbarSafe(): AdminToolbarContextValue | null {
  return useContext(AdminToolbarContext);
}

function loadOverrides(): Record<string, boolean> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* intentionally empty */ }
  return {};
}

function saveOverrides(overrides: Record<string, boolean>) {
  try {
    if (Object.keys(overrides).length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    }
  } catch { /* intentionally empty */ }
}

export function AdminToolbarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('debug');
  const [flagOverrides, setFlagOverrides] = useState<Record<string, boolean>>({});
  const [impersonation, setImpersonation] = useState<ImpersonationState | null>(null);

  // Load overrides from sessionStorage on mount
  useEffect(() => {
    setFlagOverrides(loadOverrides());
  }, []);

  // Keyboard shortcut: Cmd+Shift+D
  useEffect(() => {
    if (!user?.isAdmin) return;

    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'd') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [user?.isAdmin]);

  const setFlagOverride = useCallback((id: string, value: boolean | null) => {
    setFlagOverrides(prev => {
      const next = { ...prev };
      if (value === null) {
        delete next[id];
      } else {
        next[id] = value;
      }
      saveOverrides(next);
      return next;
    });
  }, []);

  const clearAllOverrides = useCallback(() => {
    setFlagOverrides({});
    saveOverrides({});
  }, []);

  const startImpersonation = useCallback((sessionId: string, profile: ImpersonationProfile) => {
    setImpersonation({ sessionId, profile });
  }, []);

  const endImpersonation = useCallback(() => {
    setImpersonation(null);
  }, []);

  // Don't render context for non-admins (children still render)
  if (!user?.isAdmin) {
    return <>{children}</>;
  }

  const hasOverrides = Object.keys(flagOverrides).length > 0;

  return (
    <AdminToolbarContext.Provider
      value={{
        isOpen,
        setIsOpen,
        activeTab,
        setActiveTab,
        flagOverrides,
        setFlagOverride,
        clearAllOverrides,
        hasOverrides,
        impersonation,
        startImpersonation,
        endImpersonation,
      }}
    >
      {children}
    </AdminToolbarContext.Provider>
  );
}
