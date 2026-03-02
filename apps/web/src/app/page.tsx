import type { Metadata } from 'next';
import {
  LandingHeader,
  HeroSection,
  CampusSection,
  LiveEventsSection,
  CreationDemoSection,
  LeaderPitchSection,
  ProductSection,
  CTASection,
  LandingFooter,
} from '@/components/landing';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hive.college';

export const metadata: Metadata = {
  title: 'HIVE — Your campus runs on what you make.',
  description:
    'Make apps your campus actually needs — polls, brackets, RSVPs, and more. Describe it, see it in 2 seconds, share it with everyone.',
  openGraph: {
    title: 'HIVE — Your campus runs on what you make.',
    description:
      'Make apps your campus actually needs — polls, brackets, RSVPs, and more. Describe it, see it in 2 seconds, share it with everyone.',
    type: 'website',
    images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HIVE — Your campus runs on what you make.',
    description:
      'Make apps your campus actually needs — polls, brackets, RSVPs, and more. Describe it, see it in 2 seconds, share it with everyone.',
    images: [`${baseUrl}/api/og/landing`],
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <LandingHeader />
      <HeroSection />
      <CampusSection />
      <CreationDemoSection />
      <LiveEventsSection />
      <LeaderPitchSection />
      <ProductSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
