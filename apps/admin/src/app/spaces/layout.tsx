"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheckIcon,
  TrophyIcon,
  HeartIcon,
  ChartBarIcon,
  UserPlusIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";

interface SpacesLayoutProps {
  children: ReactNode;
}

const navItems = [
  {
    href: "/spaces",
    label: "Dashboard",
    icon: Squares2X2Icon,
    exact: true,
  },
  {
    href: "/spaces/claims",
    label: "Claims",
    icon: TrophyIcon,
  },
  {
    href: "/spaces/health",
    label: "Health",
    icon: HeartIcon,
  },
  {
    href: "/spaces/analytics",
    label: "Analytics",
    icon: ChartBarIcon,
  },
  {
    href: "/spaces/invites",
    label: "Invites",
    icon: UserPlusIcon,
    superAdminOnly: true,
  },
];

export default function SpacesLayout({ children }: SpacesLayoutProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#1A1A1A]">
      {/* Sub-navigation header */}
      <div className="border-b border-white/[0.08] bg-[#0A0A0A]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Title */}
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-6 w-6 text-amber-400" />
              <h1 className="text-lg font-semibold text-white">Space Control Center</h1>
            </div>

            {/* Navigation tabs */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                      ${active
                        ? "bg-amber-500/10 text-amber-400"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {children}
      </div>
    </div>
  );
}
