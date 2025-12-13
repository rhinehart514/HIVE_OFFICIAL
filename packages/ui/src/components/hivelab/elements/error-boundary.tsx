'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { Card, CardContent, Button } from '../../../atomic';

interface ElementErrorBoundaryProps {
  elementType: string;
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ElementErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for HiveLab elements.
 * Catches render errors in individual elements without crashing the entire tool.
 */
export class ElementErrorBoundary extends Component<ElementErrorBoundaryProps, ElementErrorBoundaryState> {
  constructor(props: ElementErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ElementErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging
    console.error(`[HiveLab] Element "${this.props.elementType}" crashed:`, error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ElementErrorFallback
          elementType={this.props.elementType}
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Fallback UI shown when an element crashes.
 * Provides user-friendly error message and retry option.
 */
export function ElementErrorFallback({
  elementType,
  error,
  onRetry
}: {
  elementType: string;
  error: Error | null;
  onRetry: () => void;
}) {
  const isDevMode = process.env.NODE_ENV === 'development';

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-destructive/10 p-2">
            <Bell className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">
              Element failed to load
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The {elementType.replace(/-/g, ' ')} element encountered an error.
            </p>
            {isDevMode && error && (
              <pre className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
                {error.message}
              </pre>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="mt-2 h-7 text-xs"
            >
              Try again
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
