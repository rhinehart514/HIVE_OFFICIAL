"use client";

/**
 * ProfileErrorBoundary - Error boundary for Profile sections
 * Uses the shared ErrorBoundary with profile-specific context and settings
 */

import React from 'react';
import { ErrorBoundary } from '../error-boundary';

interface ProfileErrorBoundaryProps {
  children: React.ReactNode;
  profileId?: string;
  context?: 'own' | 'other' | 'edit' | 'settings';
}

export function ProfileErrorBoundary({
  children,
  profileId,
  context = 'own'
}: ProfileErrorBoundaryProps) {
  const contextualSettings = {
    own: { maxRetries: 5, enableRecovery: true },
    other: { maxRetries: 3, enableRecovery: true },
    edit: { maxRetries: 2, enableRecovery: false },
    settings: { maxRetries: 3, enableRecovery: false }
  };

  const settings = contextualSettings[context];

  return (
    <ErrorBoundary
      context={`profile${profileId ? `_${profileId}` : ''}`}
      enableRecovery={settings.enableRecovery}
      maxRetries={settings.maxRetries}
    >
      {children}
    </ErrorBoundary>
  );
}