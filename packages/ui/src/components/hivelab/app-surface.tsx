"use client";

/**
 * AppSurface - Full-screen app surface for HiveLab tools
 *
 * Renders a deployed tool in full-screen app mode within a Space.
 * Uses the same ToolCanvas as widget mode but with different layout.
 *
 * @version P0 - App Surface Implementation
 */

import * as React from "react";
import { createContext, useContext, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { ToolCanvas, type ToolElement } from "./tool-canvas";
import type { ToolCapabilities, AppConfig } from "@hive/core";

// ============================================================================
// CAPABILITY CONTEXT
// ============================================================================

/**
 * Context for capability-aware tool rendering.
 * Elements can check capabilities to conditionally render or enable features.
 */
export const CapabilityContext = createContext<ToolCapabilities | null>(null);

export function useCapabilities(): ToolCapabilities | null {
  return useContext(CapabilityContext);
}

// ============================================================================
// TYPES
// ============================================================================

interface DeploymentData {
  id: string;
  toolId: string;
  status: string;
  config: Record<string, unknown>;
  permissions: {
    canInteract: boolean;
    canView: boolean;
    canEdit: boolean;
    allowedRoles: string[];
  };
  surfaceModes: { widget: boolean; app: boolean };
  primarySurface: "widget" | "app";
  appConfig?: AppConfig;
  capabilities: ToolCapabilities;
  budgets: Record<string, number>;
  capabilityLane: "safe" | "scoped" | "power";
}

interface ToolData {
  id: string;
  name: string;
  description?: string;
  composition?: Record<string, unknown>;
  elements?: ToolElement[];
  version?: string;
}

export interface AppSurfaceProps {
  /** Deployment data from API */
  deployment: DeploymentData;
  /** Tool data from API */
  tool: ToolData;
  /** Granted capabilities for this deployment */
  capabilities: ToolCapabilities;
  /** Layout mode */
  layout: "full" | "centered" | "sidebar";
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const glass = {
  surface: "bg-[#0A0A0A]",
  loading: "bg-[#141414]",
};

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

function FullLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full h-full overflow-auto">{children}</div>;
}

function CenteredLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full overflow-auto flex justify-center">
      <div className="w-full max-w-4xl py-8 px-4">{children}</div>
    </div>
  );
}

function SidebarLayout({ children }: { children: React.ReactNode }) {
  // For sidebar layout, main content fills most space
  // Sidebar area can be used for related tools/widgets later
  return (
    <div className="w-full h-full overflow-auto grid grid-cols-[1fr_300px] gap-4">
      <div className="overflow-auto">{children}</div>
      <aside className="overflow-auto border-l border-white/5 p-4">
        {/* Reserved for sidebar widgets */}
        <div className="text-white/40 text-sm text-center pt-8">
          Sidebar tools coming soon
        </div>
      </aside>
    </div>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

function AppSurfaceLoading() {
  return (
    <div
      className={cn(
        "flex-1 flex items-center justify-center",
        glass.loading,
        "rounded-lg m-4"
      )}
    >
      <div className="flex flex-col items-center gap-3 text-white/60">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm">Loading app...</span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * AppSurface renders a HiveLab tool in full-screen app mode.
 *
 * It wraps the ToolCanvas with:
 * - Capability context for conditional rendering
 * - Layout-specific containers
 * - Error boundaries (via parent)
 */
export function AppSurface({
  deployment,
  tool,
  capabilities,
  layout,
  className,
}: AppSurfaceProps) {
  // Get elements from tool data
  const elements = useMemo(() => {
    // Try composition.elements first, then direct elements array
    const compositionElements =
      (tool.composition as { elements?: ToolElement[] })?.elements || [];
    return tool.elements || compositionElements;
  }, [tool.composition, tool.elements]);

  // Placeholder state management - in real usage this would come from useToolRuntime
  // The actual implementation will use the hook at the page level and pass runtime props
  const [state] = React.useState<Record<string, unknown>>({});

  // Handle element state changes
  const handleElementChange = React.useCallback(
    (instanceId: string, data: unknown) => {
      console.log("Element change:", instanceId, data);
      // State updates handled by useToolRuntime in actual implementation
    },
    []
  );

  // Handle element actions
  const handleElementAction = React.useCallback(
    (instanceId: string, action: string, payload: unknown) => {
      console.log("Element action:", instanceId, action, payload);
      // Actions handled by useToolRuntime in actual implementation
    },
    []
  );

  // Layout wrapper based on config
  const LayoutWrapper = useMemo(() => {
    switch (layout) {
      case "centered":
        return CenteredLayout;
      case "sidebar":
        return SidebarLayout;
      case "full":
      default:
        return FullLayout;
    }
  }, [layout]);

  if (elements.length === 0) {
    return <AppSurfaceLoading />;
  }

  return (
    <CapabilityContext.Provider value={capabilities}>
      <div className={cn("flex-1 overflow-hidden", glass.surface, className)}>
        <LayoutWrapper>
          <ToolCanvas
            elements={elements}
            state={state}
            layout="flow"
            onElementChange={handleElementChange}
            onElementAction={handleElementAction}
            context={{
              deploymentId: deployment.id,
              spaceId: undefined, // Will be injected at page level
              isSpaceLeader: false, // Will be determined from membership
            }}
            className="h-full p-4"
          />
        </LayoutWrapper>
      </div>
    </CapabilityContext.Provider>
  );
}
