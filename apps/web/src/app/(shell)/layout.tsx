import dynamic from 'next/dynamic';
import { LeftSidebar, MobileBottomBar, PageTransition } from '@/components/shell';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';

const AdminToolbar = dynamic(() => import('@/components/admin/AdminToolbar'), { ssr: false });

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-white bg-black">
      <LeftSidebar />
      <MobileBottomBar />
      <div className="md:ml-[220px]">
        <ImpersonationBanner />
        <PageTransition>{children}</PageTransition>
      </div>
      <AdminToolbar />
    </div>
  );
}
