import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  LandingHeader,
  HeroSection,
  SocialProofSection,
  CapabilitiesSection,
  CTASection,
  LandingFooter,
} from '@/components/landing';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hive.college';

export const metadata: Metadata = {
  title: 'HIVE — Rally your people in 30 seconds',
  description:
    'Polls, brackets, RSVPs — describe what you need and HIVE makes it live. Your org sees it instantly.',
  openGraph: {
    title: 'HIVE — Rally your people in 30 seconds',
    description:
      'Polls, brackets, RSVPs — describe what you need and HIVE makes it live. Your org sees it instantly.',
    type: 'website',
    images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HIVE — Rally your people in 30 seconds',
    description:
      'Polls, brackets, RSVPs — describe what you need and HIVE makes it live. Your org sees it instantly.',
    images: [`${baseUrl}/api/og/landing`],
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-white overflow-x-hidden">
      <Link href="#hero" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-[#FFD700] focus:text-black focus:rounded-full focus:m-2 focus:font-semibold">Skip to content</Link>
      <Suspense fallback={null}>
        <LandingHeader />
      </Suspense>
      <Suspense fallback={null}>
        <HeroSection />
      </Suspense>
      <CapabilitiesSection />
      <SocialProofSection />
      <Suspense fallback={null}>
        <CTASection />
      </Suspense>
      <LandingFooter />
    </div>
  );
}
