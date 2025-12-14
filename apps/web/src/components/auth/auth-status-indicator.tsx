"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Avatar, AvatarImage, AvatarFallback } from "@hive/ui";
import { User, LogOut, Settings, ChevronDown, Loader2 } from "lucide-react";
import { useAuth } from "@hive/auth-logic";

/**
 * Auth Status Indicator
 *
 * Shows user authentication state with dropdown menu.
 * Uses useAuth hook for secure, cookie-based authentication.
 */
export function AuthStatusIndicator() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/landing');
    } catch {
      // Logout handles its own errors, redirect anyway
      router.push('/landing');
    }
  };

  const handleNavigateToProfile = () => {
    router.push('/profile');
    setIsDropdownOpen(false);
  };

  const handleNavigateToSettings = () => {
    router.push('/profile/settings');
    setIsDropdownOpen(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-8 h-8">
        <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
      </div>
    );
  }

  // Not logged in - show Sign In button
  if (!user) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => router.push('/auth/login')}
        className="flex items-center gap-2"
      >
        <User className="w-4 h-4" />
        Sign In
      </Button>
    );
  }

  // Logged in - show user menu
  const displayName = user.handle || user.email?.split('@')[0] || 'User';
  const initials = (user.fullName?.[0] || user.email?.[0] || 'U').toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--hive-background-secondary)] transition-colors duration-200"
        aria-expanded={isDropdownOpen}
        aria-haspopup="menu"
      >
        <Avatar size="sm">
          <AvatarImage src={user.avatarUrl || undefined} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-[var(--hive-text-primary)] hidden sm:block">
          {user.handle ? `@${user.handle}` : displayName}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--hive-text-secondary)] transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div
            className="absolute right-0 mt-2 w-56 z-50 bg-[var(--hive-background-primary)] rounded-xl shadow-[var(--hive-shadow-level3)] border border-[var(--hive-border-default)] overflow-hidden"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="p-3 border-b border-[var(--hive-border-default)]">
              <p className="text-sm font-medium text-[var(--hive-text-primary)]">
                {user.fullName || user.email}
              </p>
              {user.handle && (
                <p className="text-xs text-gold-500 mt-0.5">
                  @{user.handle}
                </p>
              )}
              <p className="text-xs text-[var(--hive-text-secondary)] mt-1">
                {user.major || 'No major set'}
              </p>
            </div>

            <div className="p-1">
              <button
                onClick={handleNavigateToProfile}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--hive-background-secondary)] transition-colors duration-200 text-left"
                role="menuitem"
              >
                <User className="w-4 h-4 text-[var(--hive-text-secondary)]" aria-hidden="true" />
                <span className="text-sm text-[var(--hive-text-primary)]">
                  Profile
                </span>
              </button>

              <button
                onClick={handleNavigateToSettings}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--hive-background-secondary)] transition-colors duration-200 text-left"
                role="menuitem"
              >
                <Settings className="w-4 h-4 text-[var(--hive-text-secondary)]" aria-hidden="true" />
                <span className="text-sm text-[var(--hive-text-primary)]">
                  Settings
                </span>
              </button>

              <div className="border-t border-[var(--hive-border-default)] my-1" role="separator" />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--hive-status-error)]/10 transition-colors duration-200 text-left group"
                role="menuitem"
              >
                <LogOut className="w-4 h-4 text-[var(--hive-text-secondary)] group-hover:text-[var(--hive-status-error)]" aria-hidden="true" />
                <span className="text-sm text-[var(--hive-text-primary)] group-hover:text-[var(--hive-status-error)]">
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
