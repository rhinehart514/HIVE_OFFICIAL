"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
    <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-white/5">
      <div className="flex items-center h-12 px-4 gap-3 max-w-7xl mx-auto">
        {/* Return to space */}
        <Link
          href={`/spaces/${spaceId}`}
          className="flex items-center gap-1.5 text-white/60 hover:text-white/90 transition-colors group"
          aria-label={`Back to ${spaceName}`}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm">{spaceName}</span>
        </Link>

        {/* Separator */}
        <span className="text-white/20" aria-hidden="true">
          /
        </span>

        {/* Current app */}
        <span className="text-sm text-white/90 font-medium truncate">
          {appName}
        </span>
      </div>
    </div>
  );
}
