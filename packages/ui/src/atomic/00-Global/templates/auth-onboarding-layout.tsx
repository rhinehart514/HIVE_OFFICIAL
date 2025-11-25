import * as React from "react";

import { cn } from "../../../lib/utils";

export interface AuthOnboardingLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: "calm" | "warm" | "celebrate";
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * AuthOnboardingLayout
 *
 * Provides a consistent full-screen layout for authentication and onboarding flows.
 * Features dynamic background gradients based on mode (calm, warm, celebrate).
 *
 * Used by: login pages, onboarding wizard
 */
export const AuthOnboardingLayout = React.forwardRef<HTMLDivElement, AuthOnboardingLayoutProps>(
  ({ mode = "calm", headerSlot, footerSlot, children, className, ...props }, ref) => {
    // Background gradient variants based on mode
    const backgroundGradient = React.useMemo(() => {
      switch (mode) {
        case "warm":
          return "bg-gradient-to-br from-[var(--hive-background-primary)] via-[var(--hive-background-secondary)] to-[var(--hive-brand-primary)]/5";
        case "celebrate":
          return "bg-gradient-to-br from-[var(--hive-background-primary)] via-[var(--hive-brand-primary)]/10 to-[var(--hive-brand-secondary)]/10";
        case "calm":
        default:
          return "bg-gradient-to-br from-[var(--hive-background-primary)] via-[var(--hive-background-secondary)] to-[var(--hive-background-primary)]";
      }
    }, [mode]);

    const overlayPattern = React.useMemo(() => {
      switch (mode) {
        case "warm":
          return "bg-[radial-gradient(circle_at_30%_40%,rgba(255,215,0,0.08)_0%,transparent_50%),radial-gradient(circle_at_70%_60%,rgba(255,165,0,0.06)_0%,transparent_50%)]";
        case "celebrate":
          return "bg-[radial-gradient(circle_at_30%_40%,rgba(255,215,0,0.15)_0%,transparent_50%),radial-gradient(circle_at_70%_60%,rgba(255,165,0,0.12)_0%,transparent_50%)]";
        case "calm":
        default:
          return "bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.02)_0%,transparent_50%),radial-gradient(circle_at_70%_60%,rgba(255,215,0,0.03)_0%,transparent_50%)]";
      }
    }, [mode]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative min-h-screen overflow-hidden text-[var(--hive-text-primary)]",
          backgroundGradient,
          className
        )}
        {...props}
      >
        {/* Background overlay pattern */}
        <div className={cn("absolute inset-0", overlayPattern)} />

        {/* Header */}
        {headerSlot && (
          <div className="relative z-10 border-b border-[var(--hive-border-primary)]/20 backdrop-blur-sm">
            <div className="mx-auto max-w-6xl p-6">{headerSlot}</div>
          </div>
        )}

        {/* Main Content */}
        <div className="relative z-10 mx-auto max-w-6xl p-6 py-8">
          {children}
        </div>

        {/* Footer */}
        {footerSlot && (
          <div className="relative z-10 border-t border-[var(--hive-border-primary)]/20 backdrop-blur-sm">
            <div className="mx-auto max-w-6xl p-6">{footerSlot}</div>
          </div>
        )}
      </div>
    );
  }
);

AuthOnboardingLayout.displayName = "AuthOnboardingLayout";
