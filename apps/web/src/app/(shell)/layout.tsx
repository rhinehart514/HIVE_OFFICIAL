import { LeftSidebar, MobileBottomBar, MobileHeader, PageTransition, SearchCommand } from '@/components/shell';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { AdminToolbarLazy } from '@/components/admin/AdminToolbarLazy';
import { ShellCreateBar } from '@/components/shell/ShellCreateBar';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-white bg-black">
      <LeftSidebar />
      <MobileBottomBar />

      {/* App grid: content pane is left-anchored */}
      <div className="md:ml-[var(--sidebar-w,56px)] transition-[margin-left] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] min-h-screen">
        <MobileHeader />
        <main className="flex-1 min-w-0">
          <ImpersonationBanner />
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <AdminToolbarLazy />
      <ShellCreateBar />
      <SearchCommand />
    </div>
  );
}
