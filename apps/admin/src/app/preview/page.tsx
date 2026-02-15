"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import {
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "https://hive.college";

type Viewport = "mobile" | "tablet" | "desktop";

const QUICK_ROUTES = [
  { label: "Landing", path: "/" },
  { label: "Auth", path: "/enter" },
  { label: "Discover", path: "/discover" },
  { label: "Spaces", path: "/spaces" },
  { label: "Create", path: "/lab" },
  { label: "Profile", path: "/me" },
];

const VIEWPORT_CONFIG: Record<Viewport, { width: string; maxWidth: string; label: string; icon: typeof DevicePhoneMobileIcon; frameClass: string }> = {
  mobile: { width: "375px", maxWidth: "375px", label: "Mobile", icon: DevicePhoneMobileIcon, frameClass: "rounded-[2.5rem] border-[12px] border-white/20 shadow-2xl" },
  tablet: { width: "768px", maxWidth: "768px", label: "Tablet", icon: DeviceTabletIcon, frameClass: "rounded-[1.5rem] border-[10px] border-white/15 shadow-2xl" },
  desktop: { width: "100%", maxWidth: "100%", label: "Desktop", icon: ComputerDesktopIcon, frameClass: "" },
};

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { admin, loading, isAuthenticated } = useAdminAuth();
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [urlPath, setUrlPath] = useState(searchParams.get("url") || "/");
  const [iframeSrc, setIframeSrc] = useState(`${WEB_URL}${searchParams.get("url") || "/"}`);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const url = searchParams.get("url");
    if (url) {
      setUrlPath(url);
      setIframeSrc(`${WEB_URL}${url}`);
    }
  }, [searchParams]);

  const navigateTo = (path: string) => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    setUrlPath(normalized);
    setIframeSrc(`${WEB_URL}${normalized}`);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(urlPath);
  };

  if (loading || !admin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
      </div>
    );
  }

  const config = VIEWPORT_CONFIG[viewport];

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-14 px-6 border-b border-white/10 bg-[#0A0A0A]">
          <h1 className="text-lg font-semibold text-white">Preview</h1>
          <a
            href={iframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
          >
            Open in new tab
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        </header>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-white/10 bg-[#0A0A0A]">
          {/* Viewport toggles */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {(Object.keys(VIEWPORT_CONFIG) as Viewport[]).map((vp) => {
              const Icon = VIEWPORT_CONFIG[vp].icon;
              return (
                <button
                  key={vp}
                  onClick={() => setViewport(vp)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewport === vp
                      ? "bg-[#FFD700]/10 text-[#FFD700]"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {VIEWPORT_CONFIG[vp].label}
                </button>
              );
            })}
          </div>

          {/* URL bar */}
          <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center gap-2">
            <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <span className="px-3 text-sm text-white/30 select-none">{WEB_URL}</span>
              <input
                type="text"
                value={urlPath}
                onChange={(e) => setUrlPath(e.target.value)}
                className="flex-1 bg-transparent py-1.5 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
                placeholder="/"
              />
            </div>
            <button
              type="submit"
              className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Navigate"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </form>

          {/* Quick nav */}
          <div className="flex items-center gap-1">
            {QUICK_ROUTES.map((route) => (
              <button
                key={route.path}
                onClick={() => navigateTo(route.path)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  urlPath === route.path
                    ? "bg-[#FFD700]/10 text-[#FFD700]"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                {route.label}
              </button>
            ))}
          </div>
        </div>

        {/* Iframe area */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-[#111]">
          <div
            className={`transition-all duration-300 ${config.frameClass}`}
            style={{
              width: config.width,
              maxWidth: config.maxWidth,
              height: viewport === "desktop" ? "100%" : viewport === "tablet" ? "1024px" : "812px",
            }}
          >
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              className="w-full h-full bg-white rounded-sm"
              style={{ border: "none" }}
              allow="clipboard-read; clipboard-write"
              title="Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
