'use client';

import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="px-6 py-8 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <span className="text-[11px] text-white/20 font-sans">
          &copy; {new Date().getFullYear()} HIVE
        </span>
        <div className="flex items-center gap-4">
          <Link href="/legal/terms" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
            Terms
          </Link>
          <Link href="/legal/privacy" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
