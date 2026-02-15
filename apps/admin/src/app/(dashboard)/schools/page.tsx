"use client";

import { SchoolManagementDashboard } from "@/components/school-management-dashboard";

export default function SchoolsPage() {
  return (
    <>
      <header className="flex items-center h-14 px-6 border-b border-white/10 bg-[#0A0A0A]">
        <h1 className="text-lg font-semibold text-white">Schools</h1>
      </header>
      <div className="p-6">
        <SchoolManagementDashboard />
      </div>
    </>
  );
}
