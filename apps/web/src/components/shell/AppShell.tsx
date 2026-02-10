'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Menu, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { AppSidebar, type ShellActiveView } from './AppSidebar';
import { GlobalFAB } from './GlobalFAB';

const AdminToolbar = dynamic(() => import('@/components/admin/AdminToolbar'), {
  ssr: false,
});

const NO_SHELL_EXACT_ROUTES = new Set(['/']);

const NO_SHELL_PREFIX_ROUTES = [
  '/enter',
  '/landing',
  '/waitlist',
  '/schools',
  '/about',
  '/login',
  '/legal',
  '/t/',
];

function extractActiveSpaceHandle(pathname: string): string | null {
  if (!pathname.startsWith('/s/')) return null;
  const segment = pathname.split('/')[2];
  return segment || null;
}

function resolveActiveView(pathname: string): ShellActiveView {
  if (pathname.startsWith('/s/')) return 'space';
  if (
    pathname === '/me' ||
    pathname.startsWith('/me/') ||
    pathname.startsWith('/u/') ||
    pathname.startsWith('/profile')
  ) {
    return 'profile';
  }
  return 'home';
}

function isHomeSurface(pathname: string): boolean {
  return pathname === '/discover' || pathname.startsWith('/discover/');
}

function isRssEventSurface(pathname: string): boolean {
  return pathname.startsWith('/events');
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [fabOpen, setFabOpen] = React.useState(false);
  const swipeStartXRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setMobileSidebarOpen(false);
    setFabOpen(false);
  }, [pathname]);

  const isNoShellRoute = React.useMemo(() => {
    if (NO_SHELL_EXACT_ROUTES.has(pathname)) return true;
    return NO_SHELL_PREFIX_ROUTES.some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

  const activeSpaceHandle = React.useMemo(
    () => extractActiveSpaceHandle(pathname),
    [pathname]
  );

  const activeView = React.useMemo(() => resolveActiveView(pathname), [pathname]);

  const inSpace = activeView === 'space';
  const onHome = isHomeSurface(pathname);
  const onRssEvent = isRssEventSurface(pathname);

  if (isNoShellRoute) {
    return (
      <>
        {children}
        <AdminToolbar />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div
        className="fixed inset-y-0 left-0 z-30 w-2 md:hidden"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          swipeStartXRef.current = touch?.clientX ?? null;
        }}
        onTouchMove={(event) => {
          const startX = swipeStartXRef.current;
          const touch = event.touches[0];
          if (mobileSidebarOpen || startX === null || !touch) return;

          const deltaX = touch.clientX - startX;
          if (startX <= 20 && deltaX > 40) {
            setMobileSidebarOpen(true);
            swipeStartXRef.current = null;
          }
        }}
        onTouchEnd={() => {
          swipeStartXRef.current = null;
        }}
      />

      <AppSidebar
        activeView={activeView}
        activeSpaceHandle={activeSpaceHandle}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="min-h-screen md:pl-[72px]">
        <ImpersonationBanner />

        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-black/95 px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">
            HIVE
          </span>

          <button
            type="button"
            onClick={() => setFabOpen((value) => !value)}
            className={cn(
              'rounded-full border p-1.5 transition-colors',
              fabOpen
                ? 'border-[#FFD700] bg-[#FFD700] text-black'
                : 'border-white/[0.06] text-white/50 hover:bg-white/[0.06] hover:text-white'
            )}
            aria-label="Open create menu"
          >
            <Plus className="h-4 w-4" />
          </button>
        </header>

        <main className="min-h-screen pb-24 md:pb-6">{children}</main>
      </div>

      <GlobalFAB
        activeSpaceHandle={activeSpaceHandle}
        isInSpace={inSpace}
        isOnHome={onHome}
        isRssEvent={onRssEvent}
        open={fabOpen}
        onOpenChange={setFabOpen}
      />

      <AdminToolbar />
    </div>
  );
}

export default AppShell;
