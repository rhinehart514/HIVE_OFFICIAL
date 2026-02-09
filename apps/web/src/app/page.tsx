import type { Metadata } from 'next';
import {
  LandingHeader,
  HeroSection,
  ProblemSection,
  ProductSection,
  ComparisonSection,
  SocialProofSection,
  CTASection,
  LandingFooter,
} from '@/components/landing';

export const metadata: Metadata = {
  title: 'HIVE — Your Campus. Your Spaces. Your Tools.',
  description: 'Run your campus communities with shared spaces and live tools. Build in seconds, share anywhere.',
  openGraph: {
    title: 'HIVE — Your Campus. Your Spaces. Your Tools.',
    description: 'Run your campus communities with shared spaces and live tools. Build in seconds, share anywhere.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HIVE — Your Campus. Your Spaces. Your Tools.',
    description: 'Run your campus communities with shared spaces and live tools. Build in seconds, share anywhere.',
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-x-hidden">
      <LandingHeader />
      <HeroSection />
      <ProblemSection />
      <ProductSection />
      <ComparisonSection />
      <SocialProofSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
