'use client';

import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-black px-6 py-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <span className="font-mono text-[11px] text-white/20">
          &copy; {new Date().getFullYear()} HIVE
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/legal/terms"
            className="text-[11px] text-white/20 transition-colors hover:text-white/40"
          >
            Terms
          </Link>
          <Link
            href="/legal/privacy"
            className="text-[11px] text-white/20 transition-colors hover:text-white/40"
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
