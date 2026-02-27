import type { Metadata } from 'next';
import {
  LandingHeader,
  HeroSection,
  ProductSection,
  CTASection,
  LandingFooter,
} from '@/components/landing';

export const metadata: Metadata = {
  title: 'HIVE — Your campus, connected.',
  description:
    'The social platform built for your campus. Discover events, join spaces, build apps for your org — all in one place.',
  openGraph: {
    title: 'HIVE — Your campus, connected.',
    description:
      'The social platform built for your campus. Discover events, join spaces, build apps for your org — all in one place.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HIVE — Your campus, connected.',
    description:
      'The social platform built for your campus. Discover events, join spaces, build apps for your org — all in one place.',
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
