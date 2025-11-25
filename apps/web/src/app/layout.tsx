import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from './providers';
import { WebVitals } from '@/components/web-vitals';

export const metadata: Metadata = {
  title: {
    template: '%s | HIVE',
    default: 'HIVE - Campus Social Platform',
  },
  description: 'Connect, collaborate, and build community on your campus with HIVE.',
  keywords: ['campus', 'social', 'university', 'community', 'collaboration'],
  authors: [{ name: 'HIVE Team' }],
  creator: 'HIVE',
  publisher: 'HIVE',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'HIVE',
    title: 'HIVE - Campus Social Platform',
    description: 'Connect, collaborate, and build community on your campus with HIVE.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HIVE - Campus Social Platform',
    description: 'Connect, collaborate, and build community on your campus with HIVE.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-screen bg-background font-sans antialiased">
        <WebVitals />
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
