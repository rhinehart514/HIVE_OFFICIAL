"use client";

/**
 * Universal Shell Provider — Layout wrapper with data integration
 *
 * January 2026: Global Navigation Contract
 *
 * Shell has THREE modes (not two):
 * - full: Sidebar expanded + TopBar (Discovery, Orientation archetypes)
 * - compact: Sidebar collapsed + TopBar (Immersion archetype)
 * - hidden: No shell at all (Focus Flow archetype)
 *
 * Mode is determined by:
 * 1. Route patterns (primary)
 * 2. Archetype context (fallback)
 *
 * @locked This is the Global Navigation Contract - do not modify without review
 */

import React from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { SpaceData, ToolData } from '@hive/ui';
import { useLayout } from '@hive/ui';
import { useShellData } from '@/hooks/data';

/**
 * Shell Mode — Controls navigation visibility
 * Matches the type in UniversalShell
 * @locked Global Navigation Contract (Jan 2026)
 */
type ShellMode = 'full' | 'compact' | 'hidden';

// Import UniversalShell with SSR support
const UniversalShell = dynamic(
  () => import('@hive/ui').then(mod => mod.UniversalShell),
  {
    ssr: true,
    loading: () => <ShellLoader />
  }
);

// ============================================
// ROUTE CONFIGURATION — Global Navigation Contract
// ============================================
//
// Shell Modes:
// - full: Sidebar expanded + TopBar (Discovery, Orientation)
// - compact: Sidebar collapsed + TopBar (Immersion)
// - hidden: No shell (Focus Flow)
//
// @locked January 2026
// ============================================

// Routes that should NEVER have shell (entry, landing, legal, builders)
// Mode: hidden
const NO_SHELL_ROUTES = [
  '/enter',              // Entry flow
  '/landing',            // Pre-auth landing
  '/waitlist',           // Waitlist signup
  '/schools',            // School selection
  '/legal',              // Legal pages (privacy, terms, guidelines)
  '/debug-auth',         // Debug only
  '/hivelab/demo',       // Demo mode
  '/tools',              // HiveLab IDE (full-screen builder experience)
];

// Routes that show Compact shell (sidebar collapsed, topbar visible)
// Mode: compact
// Pattern: User is DOING something but may need quick nav access
const COMPACT_SHELL_ROUTES = [
  '/spaces/*/chat',           // Space chat (real-time messaging)
  '/spaces/*/boards/*',       // Board view within space
  '/tools/*/edit',            // Tool IDE (code editing)
  '/tools/*/preview',         // Tool preview
];

// Routes that use Focus Flow archetype (wizard/form, no shell)
// Mode: hidden
// Pattern: Single task requiring full attention
const FOCUS_FLOW_ROUTES = [
  // Entry & Identity
  '/enter/*',                 // Entry flow steps
  '/invite/*',                // Invite redemption
  '/profile/edit',            // Profile editing

  // Spaces
  '/spaces/create',           // Create space wizard
  '/spaces/claim',            // Claim space flow
  '/spaces/join/*',           // Join via invite code
  '/spaces/*/post',           // Create post in space
  '/spaces/*/event/new',      // Create event in space

  // Tools
  '/tools/create',            // Create tool wizard
  '/tools/*/deploy',          // Deploy tool flow
  '/tools/*/run',             // Tool execution (full immersion)

  // Events
  '/events/*/checkin',        // Event check-in flow

  // Rituals
  '/rituals/*',               // Ritual participation (all except index)
];

/**
 * Check if a pathname matches a route pattern
 * Supports * as wildcard for path segments
 */
function matchesRoute(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '[^/]+') + '$'
    );
    return regex.test(pathname);
  });
}

// ============================================
// COMPONENT
// ============================================

export function UniversalShellProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Get layout archetype from context (if page uses LayoutProvider)
  // Default to shellVisible: true if no provider
  const { shellVisible: archetypeShellVisible } = useLayout();

  // Determine shell mode based on routes and archetype
  const shellMode: ShellMode = React.useMemo(() => {
    if (!pathname) return 'full';

    // 1. Check explicit no-shell routes (highest priority)
    if (NO_SHELL_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/') {
      return 'hidden';
    }

    // 2. Check Focus Flow routes (hidden shell)
    if (matchesRoute(pathname, FOCUS_FLOW_ROUTES)) {
      return 'hidden';
    }

    // 3. Check Compact shell routes (immersion)
    if (matchesRoute(pathname, COMPACT_SHELL_ROUTES)) {
      return 'compact';
    }

    // 4. Check archetype context (fallback)
    if (!archetypeShellVisible) {
      return 'hidden';
    }

    // Default: full shell
    return 'full';
  }, [pathname, archetypeShellVisible]);

  // Backwards compatibility alias
  const hideShell = shellMode === 'hidden';

  // Use the shell data hook (all data fetching happens here)
  const {
    user,
    mySpaces,
    notificationCount,
  } = useShellData({ skipFetch: hideShell });

  // Transform mySpaces to SpaceData format
  const spaces: SpaceData[] = React.useMemo(() => {
    const result: SpaceData[] = [];
    (mySpaces ?? []).forEach(section => {
      (section.spaces ?? []).forEach(space => {
        result.push({
          id: space.id,
          name: space.label,
          emoji: undefined,
          avatarUrl: undefined,
          unreadCount: 0,
        });
      });
    });
    return result;
  }, [mySpaces]);

  // Tools for builders
  const tools: ToolData[] = React.useMemo(() => {
    // TODO: Fetch user's tools from HiveLab
    return [];
  }, []);

  // For routes/archetypes without shell, render children directly
  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <UniversalShell
      mode={shellMode}
      spaces={spaces}
      tools={tools}
      isBuilder={user.isBuilder}
      userName={user.name}
      userHandle={user.handle}
      userAvatarUrl={user.avatarUrl}
      notificationCount={notificationCount}
    >
      {children}
    </UniversalShell>
  );
}

// Loading component while shell loads
function ShellLoader() {
  return (
    <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
    </div>
  );
}
