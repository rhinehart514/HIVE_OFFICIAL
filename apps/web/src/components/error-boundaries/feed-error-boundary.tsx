"use client";

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Users, TrendingUp } from 'lucide-react';
import { Button, Card } from "@hive/ui";

// Inline ErrorBoundary to replace deleted component
interface ErrorBoundaryProps {
  children: ReactNode;
  context?: string;
  enableRecovery?: boolean;
  maxRetries?: number;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void; errorId?: string }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorId: null,
    retryCount: 0
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now().toString(36)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.context}]`, error, errorInfo);
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    if (this.state.retryCount < maxRetries) {
      this.setState(prev => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prev.retryCount + 1
      }));
    }
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error || undefined}
            retry={this.handleRetry}
            errorId={this.state.errorId || undefined}
          />
        );
      }
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
          <p className="text-red-400">Something went wrong</p>
          <button onClick={this.handleRetry} className="mt-2 text-sm underline">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface FeedErrorFallbackProps {
  error?: Error;
  retry: () => void;
  errorId?: string;
}

function FeedErrorFallback({ error: _error, retry, errorId }: FeedErrorFallbackProps) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Card className="p-8 bg-hive-surface border-hive-border text-center">
        <div className="w-16 h-16 bg-[var(--hive-brand-primary)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-[var(--hive-brand-primary)]" />
        </div>

        <h2 className="text-xl font-bold text-hive-text-primary mb-3">
          Feed Temporarily Unavailable
        </h2>
        <p className="text-hive-text-secondary mb-2">
          We're having trouble loading your campus feed. Your connections are safe - this is just a temporary hiccup.
        </p>
        <p className="text-hive-text-tertiary text-sm mb-6">
          Try refreshing or check your spaces directly while we fix this.
        </p>

        {errorId && (
          <div className="mb-4 p-3 bg-hive-surface-elevated border border-hive-border rounded-lg">
            <p className="text-xs text-hive-text-tertiary mb-1">Error ID:</p>
            <code className="text-xs text-hive-text-secondary font-mono">{errorId}</code>
          </div>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <Button
            onClick={retry}
            className="bg-[var(--hive-brand-primary)] text-hive-obsidian hover:bg-hive-champagne"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Feed
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/spaces'}
            className="border-hive-border text-hive-text-secondary"
          >
            <Users className="w-4 h-4 mr-2" />
            Check Spaces
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/rituals'}
            className="border-hive-border text-hive-text-secondary"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            View Rituals
          </Button>
        </div>

        {/* Behavioral continuity - don't let errors break the panic-to-relief loop */}
        <div className="mt-6 pt-4 border-t border-hive-border">
          <p className="text-xs text-hive-text-tertiary">
            Looking for something specific? Try searching in a space or checking notifications.
          </p>
        </div>
      </Card>
    </div>
  );
}

interface FeedErrorBoundaryProps {
  children: React.ReactNode;
}

export function FeedErrorBoundary({ children }: FeedErrorBoundaryProps) {
  return (
    <ErrorBoundary
      context="feed"
      enableRecovery={true}
      maxRetries={5}
      fallback={FeedErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
}