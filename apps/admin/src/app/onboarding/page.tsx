"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { OnboardingFunnelDashboard } from "@/components/onboarding-funnel-dashboard";

export default function OnboardingPage() {
  const router = useRouter();
  const { admin, loading, isAuthenticated } = useAdminAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="flex items-center h-14 px-6 border-b border-white/10 bg-[#0A0A0A]">
          <h1 className="text-lg font-semibold text-white">Onboarding Funnel</h1>
        </header>
        <div className="p-6">
          <OnboardingFunnelDashboard />
        </div>
      </main>
    </div>
  );
}
