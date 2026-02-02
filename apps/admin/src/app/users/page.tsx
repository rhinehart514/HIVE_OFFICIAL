"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { UserManagementDashboard } from "@/components/user-management-dashboard";

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Extract filters from URL params
  const filters = {
    search: searchParams.get("q") || "",
    role: (searchParams.get("role") || "all") as "all" | "user" | "builder" | "admin" | "super_admin",
    status: (searchParams.get("status") || "all") as "all" | "active" | "suspended" | "pending",
    page: Number(searchParams.get("page")) || 1,
  };

  const updateFilters = (updates: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      const paramKey = key === "search" ? "q" : key;
      if (value && value !== "all" && value !== 1) {
        params.set(paramKey, String(value));
      } else {
        params.delete(paramKey);
      }
    });
    router.push(`/users?${params.toString()}`);
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="flex items-center h-14 px-6 border-b border-white/10 bg-[#0A0A0A]">
          <h1 className="text-lg font-semibold text-white">Users</h1>
        </header>
        <div className="p-6">
          <UserManagementDashboard
            initialFilters={filters}
            onFiltersChange={updateFilters}
          />
        </div>
      </main>
    </div>
  );
}
