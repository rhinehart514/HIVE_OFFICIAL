"use client";

import React, { type ElementType } from "react";
import {
  InboxIcon,
  MagnifyingGlassIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

type EmptyVariant = "no-data" | "no-results" | "no-access";

const variantDefaults: Record<EmptyVariant, { icon: ElementType; title: string; description: string }> = {
  "no-data": {
    icon: InboxIcon,
    title: "No data yet",
    description: "There's nothing here yet. Data will appear once available.",
  },
  "no-results": {
    icon: MagnifyingGlassIcon,
    title: "No results found",
    description: "Try adjusting your search or filters.",
  },
  "no-access": {
    icon: LockClosedIcon,
    title: "Access restricted",
    description: "You don't have permission to view this content.",
  },
};

interface EmptyStateProps {
  icon?: ElementType;
  title?: string;
  description?: string;
  variant?: EmptyVariant;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({
  icon,
  title,
  description,
  variant = "no-data",
  action,
}: EmptyStateProps) {
  const defaults = variantDefaults[variant];
  const Icon = icon || defaults.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Icon className="h-12 w-12 text-white/30 mb-4" />
      <h3 className="text-sm font-medium text-white/70 mb-1">
        {title || defaults.title}
      </h3>
      <p className="text-sm text-white/50 max-w-sm">
        {description || defaults.description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm bg-white/10 hover:bg-white/15 text-white/70 rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
