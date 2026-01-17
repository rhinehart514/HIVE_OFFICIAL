"use client";

/**
 * FeedErrorBoundary - Error boundary for the Feed section
 * Uses the shared ErrorBoundary with feed-specific context
 */

import React from 'react';
import { ErrorBoundary } from '../error-boundary';

interface FeedErrorBoundaryProps {
  children: React.ReactNode;
}

export function FeedErrorBoundary({ children }: FeedErrorBoundaryProps) {
  return (
    <ErrorBoundary
      context="feed"
      enableRecovery={true}
      maxRetries={5}
    >
      {children}
    </ErrorBoundary>
  );
}