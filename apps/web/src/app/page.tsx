import type { Metadata } from 'next';
import {
  LandingHeader,
  HeroSection,
  DemoSection,
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
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <LandingHeader />
      <HeroSection />
      <DemoSection />
      <SocialProofSection />
      <CapabilitiesSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
