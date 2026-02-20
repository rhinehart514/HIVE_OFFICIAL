'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { MobileBottomBar, TopBar } from './AppSidebar';

const AdminToolbar = dynamic(() => import('@/components/admin/AdminToolbar'), {
  ssr: false,
});

const NO_SHELL_EXACT_ROUTES = new Set(['/']);

const NO_SHELL_PREFIX_ROUTES = ['/enter', '/landing', '/about', '/login', '/legal', '/t/', '/verify', '/s/'];

// Lab tool routes (IDE, preview, deploy, etc.) hide shell for immersive experience.
// But /lab, /lab/templates, /lab/new keep shell since they're browse pages.
const LAB_TOOL_ROUTE = /^\/lab\/[^/]+/;

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
    if (NO_SHELL_PREFIX_ROUTES.some((prefix) => pathname.startsWith(prefix))) return true;
    // /lab/[toolId]/* hides shell, but /lab, /lab/templates, /lab/new keep it
    if (LAB_TOOL_ROUTE.test(pathname) && pathname !== '/lab/templates' && pathname !== '/lab/new') return true;
    return false;
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
    <div className="min-h-screen text-white" style={{ background: '#08080F' }}>
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

      <AdminToolbar />
    </div>
  );
}

export default AppShell;
