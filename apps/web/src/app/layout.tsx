import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AppShell } from '@/components/layout';

// Load custom fonts
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HIVE',
  },
  applicationName: 'HIVE Campus',
  // Icons are auto-detected from app/icon.svg and app/apple-icon.svg
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
    { media: '(prefers-color-scheme: light)', color: '#FACC15' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
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
      className={`${GeistSans.variable} ${GeistMono.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head />
      <body style={{ backgroundColor: '#0A0A09', color: '#FAFAFA', minHeight: '100vh' }}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
