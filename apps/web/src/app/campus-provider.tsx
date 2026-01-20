'use client';

/**
 * Campus Provider — Layout wrapper with Campus navigation
 *
 * Replaces UniversalShellProvider with the new Campus navigation system:
 * - CommandBar (top) - search, create, notifications, user
 * - CampusDock (bottom) - spaces and tools as orbs
 * - CampusDrawer (mobile) - pull-up drawer
 *
 * Shell Modes:
 * - Hidden: Auth, onboarding, landing pages (no nav)
 * - Campus: All authenticated app pages
 */

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  useAtmosphereOptional,
  type AtmosphereLevel,
  CampusProvider,
  CommandBar,
  CampusDock,
  DockPreviewCard,
  CampusDrawer,
  type SpacePreviewData,
} from '@hive/ui';
import { useCampusData } from '@/hooks/data/use-campus-data';

// Lazy load command palette
const CommandPalette = dynamic(
  () => import('@hive/ui').then((mod) => mod.CommandPalette),
  { ssr: false }
);

// ============================================
// ROUTE CONFIGURATION
// ============================================

// Routes that should NOT have the campus nav (entry, landing, legal)
const NO_NAV_ROUTES = [
  '/enter',         // Unified entry flow
  '/landing',
  '/waitlist',
  '/schools',
  '/debug-auth',
  '/legal',
  '/privacy',
  '/terms',
];

// ============================================
// COMPONENT
// ============================================

export function CampusShellProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Check if this is a no-nav route
  const isNoNavRoute = NO_NAV_ROUTES.some(
    (route) => pathname?.startsWith(route) || pathname === '/'
  );

  // Get data (skip if no-nav route)
  const {
    user,
    dockSpaces,
    dockTools,
    notifications,
    notificationCount,
    isLoading,
    spaceOrder,
    setSpaceOrder,
  } = useCampusData({ skipFetch: isNoNavRoute });

  // Atmosphere integration
  const atmosphere = useAtmosphereOptional();

  // Derive atmosphere from route
  const routeAtmosphere = React.useMemo<AtmosphereLevel>(() => {
    if (!pathname) return 'spaces';

    if (pathname.startsWith('/tools')) {
      return 'workshop';
    }

    if (
      pathname.startsWith('/enter') ||
      pathname === '/'
    ) {
      return 'landing';
    }

    return 'spaces';
  }, [pathname]);

  // Set atmosphere based on route
  useEffect(() => {
    if (atmosphere?.setAtmosphere && !isNoNavRoute) {
      atmosphere.setAtmosphere(routeAtmosphere);
    }
  }, [atmosphere, routeAtmosphere, isNoNavRoute]);

  // Detect active space from pathname
  const activeSpaceId = React.useMemo(() => {
    if (!pathname) return undefined;
    const match = pathname.match(/^\/spaces\/([^/]+)/);
    if (
      match &&
      match[1] &&
      !['browse', 'create', 'claim', 'search', 's'].includes(match[1])
    ) {
      return match[1];
    }
    return undefined;
  }, [pathname]);

  // Preview state
  const [previewData, setPreviewData] = React.useState<SpacePreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  // Command palette state
  const [isCommandPaletteOpen, setCommandPaletteOpen] = React.useState(false);

  // Quick create state
  const [isQuickCreateOpen, setQuickCreateOpen] = React.useState(false);

  // For no-nav routes, render children directly
  if (isNoNavRoute) {
    return <>{children}</>;
  }

  // Main campus navigation layout
  return (
    <CampusProvider initialSpaceOrder={spaceOrder}>
      {/* Command Bar (Top) */}
      <CommandBar
        user={user}
        notificationCount={notificationCount}
        notifications={notifications}
        onSearchClick={() => setCommandPaletteOpen(true)}
        searchPlaceholder="Search spaces, tools, people..."
        onCreatePost={() => {
          // Post composer will be implemented post-launch
        }}
        onCreateEvent={() => router.push('/events/create')}
        onCreateTool={() => router.push('/tools/create')}
        onCreateSpace={() => router.push('/spaces/create')}
        isBuilder={user.isBuilder}
        isQuickCreateOpen={isQuickCreateOpen}
        onQuickCreateOpenChange={setQuickCreateOpen}
        onProfileClick={() => router.push('/profile')}
        onSettingsClick={() => router.push('/settings')}
        onNotificationClick={() => router.push('/notifications')}
      />

      {/* Main Content */}
      <main
        className="min-h-screen pt-12 pb-20 lg:pb-16"
        style={{
          // Account for command bar (48px) and dock (64px on desktop)
          paddingTop: 48,
          paddingBottom: 80, // Mobile drawer handle + safe area
        }}
      >
        {children}
      </main>

      {/* Campus Dock (Desktop) */}
      <CampusDock
        spaces={dockSpaces}
        tools={dockTools}
        activeSpaceId={activeSpaceId}
        isBuilder={user.isBuilder}
        onSpaceClick={(spaceId: string) => {
          const space = dockSpaces.find((s) => s.id === spaceId);
          if (space?.slug) {
            router.push(`/spaces/s/${space.slug}`);
          } else {
            router.push(`/spaces/${spaceId}`);
          }
        }}
        onToolClick={(toolId: string) => router.push(`/tools/${toolId}`)}
        onSpaceReorder={setSpaceOrder}
        onBrowseMoreSpaces={() => router.push('/spaces')}
        onBrowseMoreTools={() => router.push('/tools')}
      />

      {/* Campus Drawer (Mobile) */}
      <CampusDrawer
        spaces={dockSpaces}
        tools={dockTools}
        activeSpaceId={activeSpaceId}
        isBuilder={user.isBuilder}
        onSearchClick={() => setCommandPaletteOpen(true)}
      />

      {/* Hover Preview Card */}
      <DockPreviewCard
        type="space"
        data={previewData}
        position={null}
        isLoading={previewLoading}
        onNavigate={() => {
          if (previewData) {
            router.push(`/spaces/${previewData.id}`);
          }
        }}
      />

      {/* Command Palette */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        items={[
          // Navigation
          { id: 'browse', label: 'Browse Spaces', category: 'Navigation', shortcut: ['G', 'S'], onSelect: () => router.push('/spaces') },
          { id: 'profile', label: 'My Profile', category: 'Navigation', shortcut: ['G', 'P'], onSelect: () => router.push('/profile') },
          { id: 'notifications', label: 'Notifications', category: 'Navigation', shortcut: ['G', 'N'], onSelect: () => router.push('/notifications') },
          { id: 'settings', label: 'Settings', category: 'Navigation', shortcut: ['G', ','], onSelect: () => router.push('/settings') },
          ...(user.isBuilder ? [
            { id: 'tools', label: 'HiveLab', category: 'Navigation', shortcut: ['G', 'H'], onSelect: () => router.push('/tools') },
          ] : []),
          // Actions
          { id: 'create-space', label: 'Create Space', category: 'Actions', featured: true, onSelect: () => router.push('/spaces/create') },
          // User's spaces
          ...dockSpaces.slice(0, 10).map((space) => ({
            id: `space-${space.id}`,
            label: space.name,
            category: 'Your Spaces',
            description: space.onlineCount > 0 ? `${space.onlineCount} online` : undefined,
            onSelect: () => {
              if (space.slug) {
                router.push(`/spaces/s/${space.slug}`);
              } else {
                router.push(`/spaces/${space.id}`);
              }
            },
          })),
        ]}
      />
    </CampusProvider>
  );
}

// Loading component while campus loads
function CampusLoader() {
  return (
    <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
    </div>
  );
}

export default CampusShellProvider;
