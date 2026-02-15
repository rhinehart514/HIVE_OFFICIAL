"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/auth";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

const STORAGE_KEY = "hive-admin-design-checklist";

interface ChecklistItem {
  id: string;
  label: string;
  route: string;
  checked: boolean;
  notes: string;
}

const DEFAULT_ITEMS: Omit<ChecklistItem, "checked" | "notes">[] = [
  { id: "landing", label: "Landing page", route: "/" },
  { id: "auth", label: "Auth flow", route: "/enter" },
  { id: "onboarding", label: "Onboarding (interests, spaces)", route: "/onboarding" },
  { id: "discover", label: "Discover/Home", route: "/discover" },
  { id: "spaces", label: "Spaces list", route: "/spaces" },
  { id: "space-detail", label: "Space detail", route: "/s/example" },
  { id: "space-chat", label: "Space chat tab", route: "/s/example?tab=chat" },
  { id: "space-events", label: "Space events tab", route: "/s/example?tab=events" },
  { id: "space-posts", label: "Space posts tab", route: "/s/example?tab=posts" },
  { id: "lab", label: "Create/Lab", route: "/lab" },
  { id: "profile", label: "Profile", route: "/me" },
  { id: "settings", label: "Settings", route: "/settings" },
];

function loadChecklist(): ChecklistItem[] {
  if (typeof window === "undefined") return DEFAULT_ITEMS.map((i) => ({ ...i, checked: false, notes: "" }));
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ChecklistItem[];
      // Merge with defaults in case new items were added
      return DEFAULT_ITEMS.map((def) => {
        const existing = parsed.find((p) => p.id === def.id);
        return existing ? { ...def, checked: existing.checked, notes: existing.notes } : { ...def, checked: false, notes: "" };
      });
    }
  } catch {}
  return DEFAULT_ITEMS.map((i) => ({ ...i, checked: false, notes: "" }));
}

export default function ChecklistPage() {
  const router = useRouter();
  const { admin, loading, isAuthenticated } = useAdminAuth();
  const [items, setItems] = useState<ChecklistItem[]>(() => loadChecklist());

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/auth/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const toggle = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const updateNotes = (id: string, notes: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));
  };

  const reviewed = items.filter((i) => i.checked).length;

  if (loading || !admin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
      </div>
    );
  }

  return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 h-14 px-6 border-b border-white/10 bg-[#0A0A0A]">
          <Link href="/preview" className="text-white/50 hover:text-white transition-colors">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-white">Design Review Checklist</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Summary */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFD700]/10 flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-white font-semibold">{reviewed}/{items.length} reviewed</p>
                  <p className="text-sm text-white/40">
                    {reviewed === items.length ? "All pages reviewed! 🎉" : `${items.length - reviewed} remaining`}
                  </p>
                </div>
              </div>
              <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FFD700] rounded-full transition-all duration-300"
                  style={{ width: `${(reviewed / items.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-xl p-4 transition-colors ${
                    item.checked ? "bg-green-500/5 border-green-500/20" : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggle(item.id)} className="flex-shrink-0">
                      {item.checked ? (
                        <CheckCircleSolidIcon className="h-6 w-6 text-green-500" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-white/20 hover:border-white/40 transition-colors" />
                      )}
                    </button>
                    <span className={`flex-1 font-medium ${item.checked ? "text-white/50 line-through" : "text-white"}`}>
                      {item.label}
                    </span>
                    <span className="text-xs text-white/30 font-mono">{item.route}</span>
                    <Link
                      href={`/preview?url=${encodeURIComponent(item.route)}`}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-md hover:bg-[#FFD700]/20 transition-colors"
                    >
                      <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                      Preview
                    </Link>
                  </div>
                  <div className="mt-3 ml-9">
                    <textarea
                      value={item.notes}
                      onChange={(e) => updateNotes(item.id, e.target.value)}
                      placeholder="Add notes..."
                      rows={1}
                      className="w-full bg-transparent border border-white/5 rounded-lg px-3 py-2 text-sm text-white/60 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
  );
}
