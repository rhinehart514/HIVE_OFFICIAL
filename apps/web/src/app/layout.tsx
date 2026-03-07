import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from './providers';

const clashDisplay = localFont({
  src: [
    { path: './fonts/ClashDisplay-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ClashDisplay-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/ClashDisplay-Semibold.woff2', weight: '600', style: 'normal' },
    { path: './fonts/ClashDisplay-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-clash',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    template: '%s | HIVE',
    default: 'HIVE — Your Campus. Your Communities.',
  },
  description: 'Run your campus communities with shared spaces. Make anything in seconds, share anywhere.',
  keywords: ['campus', 'social', 'university', 'community', 'collaboration'],
  authors: [{ name: 'HIVE Team' }],
  creator: 'HIVE',
  publisher: 'HIVE',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://hive.college'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HIVE',
  },
  applicationName: 'HIVE',
  // Icons are auto-detected from app/icon.svg and app/apple-icon.svg
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'HIVE',
    title: 'HIVE — Your Campus. Your Communities.',
    description: 'Run your campus communities with shared spaces. Make anything in seconds, share anywhere.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HIVE — Your Campus. Your Communities.',
    description: 'Run your campus communities with shared spaces. Make anything in seconds, share anywhere.',
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
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFD700' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
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
      className={`${GeistSans.variable} ${GeistMono.variable} ${clashDisplay.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-[var(--bg-ground)] text-[var(--text-primary)] min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
