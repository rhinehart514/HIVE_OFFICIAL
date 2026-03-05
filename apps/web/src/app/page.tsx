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
  title: 'HIVE — Say something. Your campus responds.',
  description:
    'Type a sentence. HIVE turns it into a live app your campus actually uses — polls, brackets, RSVPs, and more.',
  openGraph: {
    title: 'HIVE — Say something. Your campus responds.',
    description:
      'Type a sentence. HIVE turns it into a live app your campus actually uses — polls, brackets, RSVPs, and more.',
    type: 'website',
    images: [{ url: `${baseUrl}/api/og/landing`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HIVE — Say something. Your campus responds.',
    description:
      'Type a sentence. HIVE turns it into a live app your campus actually uses — polls, brackets, RSVPs, and more.',
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
