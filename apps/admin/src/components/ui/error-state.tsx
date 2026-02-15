"use client";

import React, { Component, type ReactNode, useState } from "react";
import { XCircleIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  detail?: string;
}

export function ErrorState({ message, onRetry, detail }: ErrorStateProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="p-3 rounded-full bg-red-500/10">
          <XCircleIcon className="h-8 w-8 text-red-400" />
        </div>
        <p className="text-red-400 font-medium">{message}</p>
        {detail && (
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="flex items-center gap-1 text-xs text-red-400/60 hover:text-red-400/80 transition-colors"
          >
            {showDetail ? "Hide" : "Show"} details
            {showDetail ? (
              <ChevronUpIcon className="h-3 w-3" />
            ) : (
              <ChevronDownIcon className="h-3 w-3" />
            )}
          </button>
        )}
        {showDetail && detail && (
          <pre className="w-full text-left text-xs text-red-400/50 bg-red-500/5 rounded-lg p-3 overflow-auto max-h-40">
            {detail}
          </pre>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorState
          message="Something went wrong"
          detail={this.state.error?.message}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}
