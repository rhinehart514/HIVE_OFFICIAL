'use client';

import React from 'react';

/**
 * Lightweight error boundary for shell preview.
 * Prevents creation state loss on render crash.
 */
export class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-48 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-white/30">Preview couldn&apos;t load</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onReset?.();
              }}
              className="text-xs text-white/30 hover:text-white/30 mt-2 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
