"use client";

/**
 * ToolsErrorBoundary - Error boundary for HiveLab Tools sections
 * Uses the shared ErrorBoundary with tools-specific context and settings
 */

import React from 'react';
import { ErrorBoundary } from '../error-boundary';

interface ToolsErrorBoundaryProps {
  children: React.ReactNode;
  toolId?: string;
  context?: 'list' | 'edit' | 'run' | 'create' | 'preview' | 'deploy';
}

export function ToolsErrorBoundary({
  children,
  toolId,
  context = 'list'
}: ToolsErrorBoundaryProps) {
  const contextualSettings = {
    list: { maxRetries: 4, enableRecovery: true },
    edit: { maxRetries: 2, enableRecovery: false },
    run: { maxRetries: 3, enableRecovery: true },
    create: { maxRetries: 2, enableRecovery: false },
    preview: { maxRetries: 3, enableRecovery: true },
    deploy: { maxRetries: 1, enableRecovery: false }
  };

  const settings = contextualSettings[context];

  return (
    <ErrorBoundary
      context={`tools${toolId ? `_${toolId}` : ''}`}
      enableRecovery={settings.enableRecovery}
      maxRetries={settings.maxRetries}
    >
      {children}
    </ErrorBoundary>
  );
}
