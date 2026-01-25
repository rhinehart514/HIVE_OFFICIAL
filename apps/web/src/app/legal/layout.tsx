import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@hive/ui/design-system/primitives';

export const metadata: Metadata = {
  title: {
    template: '%s | HIVE',
    default: 'Legal | HIVE',
  },
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-void)]">
      {/* Subtle noise texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[var(--color-bg-void)]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
              <Logo variant="mark" size="sm" color="gold" />
              <span className="text-body-sm font-medium text-white/40">Legal</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/legal/terms"
                className="text-body-sm text-white/50 transition-colors hover:text-white/80"
              >
                Terms
              </Link>
              <Link
                href="/legal/privacy"
                className="text-body-sm text-white/50 transition-colors hover:text-white/80"
              >
                Privacy
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-center justify-between text-label text-white/30">
            <span>&copy; {new Date().getFullYear()} HIVE</span>
            <Link href="/" className="transition-colors hover:text-white/50">
              Back to HIVE
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
