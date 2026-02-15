"use client";

import { FeatureFlagManagement } from "@/components/feature-flag-management";

export default function Page() {
  return (
    <>
      <header className="flex items-center h-14 px-6 border-b border-white/10 bg-[#0A0A0A]">
        <h1 className="text-lg font-semibold text-white">Feature Flags</h1>
      </header>
      <div className="p-6">
        <FeatureFlagManagement />
      </div>
    </>
  );
}
