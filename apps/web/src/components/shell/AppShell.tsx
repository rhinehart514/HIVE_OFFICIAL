'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { LeftSidebar, MobileBottomBar } from './AppSidebar';
import { PageTransition } from './PageTransition';

const AdminToolbar = dynamic(() => import('@/components/admin/AdminToolbar'), {
  ssr: false,
});

const NO_SHELL_EXACT_ROUTES = new Set(['/']);

const NO_SHELL_PREFIX_ROUTES = ['/enter', '/landing', '/about', '/login', '/legal', '/t/', '/verify', '/s/'];

// Lab tool routes (IDE, preview, deploy, etc.) hide shell for immersive experience.
// But /lab and /lab/templates keep shell since they're browse pages.
const LAB_TOOL_ROUTE = /^\/lab\/[^/]+/;

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const isNoShellRoute = React.useMemo(() => {
    if (NO_SHELL_EXACT_ROUTES.has(pathname)) return true;
    if (NO_SHELL_PREFIX_ROUTES.some((prefix) => pathname.startsWith(prefix))) return true;
    // /lab/[toolId]/* hides shell, but /lab, /lab/templates, /lab/new keep it
    if (LAB_TOOL_ROUTE.test(pathname) && pathname !== '/lab/templates') return true;
    return false;
  }, [pathname]);

  if (isNoShellRoute) {
    return (
      <>
        {children}
        <AdminToolbar />
      </>
    );
  }

  return (
    <div className="min-h-screen text-white bg-black">
      {/* Desktop sidebar */}
      <LeftSidebar />

      {/* Mobile bottom bar */}
      <MobileBottomBar />

      {/* Main content — offset right on desktop, full-width on mobile */}
      <div className="min-h-screen md:ml-[var(--sidebar-w,56px)] transition-[margin-left] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <ImpersonationBanner />
        <main className="min-h-screen pb-20 md:pb-0">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <AdminToolbar />
    </div>
  );
}

export default AppShell;
