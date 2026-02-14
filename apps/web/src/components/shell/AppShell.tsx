'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { MobileBottomBar, TopBar } from './AppSidebar';
import { CreatePromptBar } from './CreatePromptBar';

const AdminToolbar = dynamic(() => import('@/components/admin/AdminToolbar'), {
  ssr: false,
});

const NO_SHELL_EXACT_ROUTES = new Set(['/']);

const NO_SHELL_PREFIX_ROUTES = ['/enter', '/landing', '/about', '/login', '/legal', '/t/', '/verify'];

interface AppShellProps {
  children: React.ReactNode;
}

function extractActiveSpaceHandle(pathname: string): string | null {
  if (!pathname.startsWith('/s/')) return null;
  const segment = pathname.split('/')[2];
  return segment || null;
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
      <TopBar />
      <MobileBottomBar />

      <div className="min-h-screen">
        <ImpersonationBanner />
        <main className="min-h-screen pb-20 md:pb-6">
          <div className="mx-auto max-w-[1200px] px-4 pt-14 md:px-6">
            {children}
          </div>
        </main>
      </div>

      <CreatePromptBar
        spaceHandle={activeSpaceHandle}
        className="hidden md:flex"
      />

      <AdminToolbar />
    </div>
  );
}

export default AppShell;
