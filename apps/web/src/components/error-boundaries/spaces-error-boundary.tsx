"use client";

/**
 * SpacesErrorBoundary - Error boundary for Space sections
 * Uses the shared ErrorBoundary with spaces-specific context and settings
 */

import React from 'react';
import { ErrorBoundary } from '../error-boundary';

interface SpacesErrorBoundaryProps {
  children: React.ReactNode;
  spaceId?: string;
  context?: 'directory' | 'individual' | 'create' | 'search';
}

export function SpacesErrorBoundary({
  children,
  spaceId,
  context = 'directory'
}: SpacesErrorBoundaryProps) {
  const contextualSettings = {
    directory: { maxRetries: 5, enableRecovery: true },
    individual: { maxRetries: 3, enableRecovery: true },
    create: { maxRetries: 2, enableRecovery: false },
    search: { maxRetries: 4, enableRecovery: true }
  };

  const settings = contextualSettings[context];

  return (
    <ErrorBoundary
      context={`spaces${spaceId ? `_${spaceId}` : ''}`}
      enableRecovery={settings.enableRecovery}
      maxRetries={settings.maxRetries}
    >
      {children}
    </ErrorBoundary>
  );
}