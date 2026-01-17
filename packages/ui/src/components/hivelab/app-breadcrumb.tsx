"use client";

import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

// Aliases for lucide compatibility
const ChevronLeft = ChevronLeftIcon;

interface AppBreadcrumbProps {
  spaceName: string;
  spaceId: string;
  appName: string;
}

/**
 * Breadcrumb navigation for app surface.
 * Provides "return to space" affordance so the space never feels lost.
 */
export function AppBreadcrumb({
  spaceName,
  spaceId,
  appName,
}: AppBreadcrumbProps) {
  return (
    <div className="sticky top-0 z-10 bg-[var(--hivelab-bg)]/95 backdrop-blur-sm border-b border-[var(--hivelab-border)]">
      <div className="flex items-center h-12 px-4 gap-3 max-w-7xl mx-auto">
        {/* Return to space */}
        <Link
          href={`/spaces/${spaceId}`}
          className="flex items-center gap-1.5 text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] transition-colors duration-[var(--workshop-duration)] group"
          aria-label={`Back to ${spaceName}`}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm">{spaceName}</span>
        </Link>

        {/* Separator */}
        <span className="text-[var(--hivelab-text-tertiary)]" aria-hidden="true">
          /
        </span>

        {/* Current app */}
        <span className="text-sm text-[var(--hivelab-text-primary)] font-medium truncate">
          {appName}
        </span>
      </div>
    </div>
  );
}
