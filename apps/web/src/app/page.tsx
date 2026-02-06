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
  title: 'HIVE — finally.',
  description: 'One place for student orgs. Spaces, events, members, chat. Live at UB.',
  openGraph: {
    title: 'HIVE — finally.',
    description: 'One place for student orgs. Spaces, events, members, chat. Live at UB.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HIVE — finally.',
    description: 'One place for student orgs. Spaces, events, members, chat. Live at UB.',
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
