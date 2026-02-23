import { LeftSidebar, MobileBottomBar, PageTransition, RightRail } from '@/components/shell';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { AdminToolbarLazy } from '@/components/admin/AdminToolbarLazy';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-white bg-black">
      <LeftSidebar />
      <MobileBottomBar />

      {/* App grid: content pane is left-anchored, right rail fills remaining space on xl+ */}
      <div className="md:ml-[var(--sidebar-w,56px)] transition-[margin-left] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] xl:flex xl:min-h-screen">
        <main className="flex-1 min-w-0">
          <ImpersonationBanner />
          <PageTransition>{children}</PageTransition>
        </main>
        <RightRail />
      </div>

      <AdminToolbarLazy />
    </div>
  );
}
