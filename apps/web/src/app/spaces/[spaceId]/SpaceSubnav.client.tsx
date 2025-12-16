"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SpaceSubnav({ spaceId }: { spaceId: string }) {
  const pathname = usePathname() || "";
  const base = `/spaces/${spaceId}`;

  const items = [
    { id: "overview", label: "Overview", href: base },
    { id: "events", label: "Events", href: `${base}/events` },
    { id: "members", label: "Members", href: `${base}/members` },
    { id: "resources", label: "Resources", href: `${base}/resources` },
    { id: "settings", label: "Settings", href: `${base}/settings` },
  ];

  const isActive = (href: string) => {
    if (href === base) return pathname === base;
    return pathname.startsWith(href);
  };

  return (
    <div className="sticky top-16 z-30 bg-[#0A0A0A]/90 backdrop-blur border-b border-[#2A2A2A]">
      <nav className="max-w-7xl mx-auto px-4" role="navigation" aria-label="Space sections">
        <ul className="flex gap-2 overflow-x-auto no-scrollbar">
          {items.map((item) => (
            <li key={item.id} className="py-2">
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap
                  ${isActive(item.href)
                    ? "text-[#FAFAFA] border-b-2 border-[#FFD700]"
                    : "text-[#818187] hover:text-[#FAFAFA]"}
                `}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

