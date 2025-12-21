"use client";

import React, { type ReactNode } from "react";
import { SpaceMetadataProvider } from "./SpaceMetadataContext";
import { SpaceEventsProvider } from "./SpaceEventsContext";
import { SpaceStructureProvider } from "./SpaceStructureContext";
import { SpaceTabUIProvider } from "./SpaceTabUIContext";
import { SpaceLeaderProvider } from "./SpaceLeaderContext";

/**
 * SpaceContextProvider
 *
 * Composed provider that nests all focused space contexts.
 * This is the main entry point - use this in page components.
 *
 * Context nesting order (innermost first):
 * 1. SpaceMetadataProvider - space basic info, membership (no deps)
 * 2. SpaceEventsProvider - events (depends on spaceId from metadata)
 * 3. SpaceStructureProvider - tabs, widgets (depends on spaceId from metadata)
 * 4. SpaceTabUIProvider - active tab state (depends on structure)
 * 5. SpaceLeaderProvider - leader actions (depends on metadata + structure)
 */

interface SpaceContextProviderProps {
  spaceId: string;
  children: ReactNode;
  initialTab?: string;
}

export function SpaceContextProvider({
  spaceId,
  children,
  initialTab,
}: SpaceContextProviderProps) {
  return (
    <SpaceMetadataProvider spaceId={spaceId}>
      <SpaceEventsProvider>
        <SpaceStructureProvider>
          <SpaceTabUIProvider initialTab={initialTab}>
            <SpaceLeaderProvider>{children}</SpaceLeaderProvider>
          </SpaceTabUIProvider>
        </SpaceStructureProvider>
      </SpaceEventsProvider>
    </SpaceMetadataProvider>
  );
}
