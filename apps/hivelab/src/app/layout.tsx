import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    template: '%s | HiveLab',
    default: 'HiveLab - Build Campus Tools',
  },
  description: 'Create interactive tools for your campus community with AI. No coding required.',
  keywords: ['hivelab', 'tools', 'campus', 'builder', 'no-code', 'ai'],
  authors: [{ name: 'HIVE Team' }],
  creator: 'HIVE',
  publisher: 'HIVE',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'HiveLab',
    title: 'HiveLab - Build Campus Tools',
    description: 'Create interactive tools for your campus community with AI.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-screen bg-[var(--hive-background-primary)] font-sans antialiased">
        <Providers>
          {/* Minimal chrome - HiveLab is a focused workspace */}
          <div className="relative flex min-h-screen flex-col">
            {/* Simple header */}
            <header className="sticky top-0 z-50 border-b border-[var(--hive-border-default)] bg-[var(--hive-background-primary)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--hive-background-primary)]/80">
              <div className="flex h-14 items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[var(--hive-brand-primary)] flex items-center justify-center">
                    <span className="text-black font-bold text-sm">H</span>
                  </div>
                  <span className="font-semibold text-[var(--hive-text-primary)]">HiveLab</span>
                </Link>
                <nav className="flex items-center gap-4">
                  <Link
                    href="/"
                    className="text-sm text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)] transition-colors"
                  >
                    My Tools
                  </Link>
                  <Link
                    href="/create"
                    className="text-sm px-4 py-2 rounded-lg bg-[var(--hive-brand-primary)] text-black font-medium hover:bg-[var(--hive-brand-hover)] transition-colors"
                  >
                    Create New
                  </Link>
                </nav>
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
