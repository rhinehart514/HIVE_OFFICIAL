'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { DesktopSidebar, MobileBottomBar } from './AppSidebar';
import { GlobalFAB } from './GlobalFAB';

const AdminToolbar = dynamic(() => import('@/components/admin/AdminToolbar'), {
  ssr: false,
});

const NO_SHELL_EXACT_ROUTES = new Set(['/']);

const NO_SHELL_PREFIX_ROUTES = [
  '/enter',
  '/landing',
  '/about',
  '/login',
  '/legal',
  '/t/',
  '/verify',
];

function extractActiveSpaceHandle(pathname: string): string | null {
  if (!pathname.startsWith('/s/')) return null;
  const segment = pathname.split('/')[2];
  return segment || null;
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const isNoShellRoute = React.useMemo(() => {
    if (NO_SHELL_EXACT_ROUTES.has(pathname)) return true;
    return NO_SHELL_PREFIX_ROUTES.some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

  const activeSpaceHandle = React.useMemo(
    () => extractActiveSpaceHandle(pathname),
    [pathname]
  );

  const isInSpace = pathname.startsWith('/s/');
  const isOnHome = pathname === '/discover' || pathname.startsWith('/discover/');

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
      <DesktopSidebar />
      <MobileBottomBar />

      <div className="min-h-screen md:pl-[200px]">
        <ImpersonationBanner />
        <main className="min-h-screen pb-20 md:pb-6">{children}</main>
      </div>

      <GlobalFAB
        activeSpaceHandle={activeSpaceHandle}
        isInSpace={isInSpace}
        isOnHome={isOnHome}
      />

      <AdminToolbar />
    </div>
  );
}

export default AppShell;
