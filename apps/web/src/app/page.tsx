import type { Metadata } from 'next';
import {
  LandingHeader,
  HeroSection,
  ProductSection,
  CTASection,
  LandingFooter,
} from '@/components/landing';

export const metadata: Metadata = {
  title: 'HIVE — Your Club Is Already Here',
  description: 'Find and claim your UB organization on HIVE. Events, creations, and communication — one shared space.',
  openGraph: {
    title: 'HIVE — Your Club Is Already Here',
    description: 'Find and claim your UB organization on HIVE. Events, creations, and communication — one shared space.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HIVE — Your Club Is Already Here',
    description: 'Find and claim your UB organization on HIVE. Events, creations, and communication — one shared space.',
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <LandingHeader />
      <HeroSection />
      <ProductSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
