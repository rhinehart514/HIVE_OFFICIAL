import type { Metadata } from 'next';
import {
  LandingHeader,
  HeroSection,
  ProductSection,
  CTASection,
  LandingFooter,
} from '@/components/landing';

export const metadata: Metadata = {
  title: 'HIVE — Describe it. Build it. Deploy it.',
  description:
    'The AI-powered creation platform for student orgs. Polls, signups, countdowns, leaderboards — describe what you need and HIVE builds it instantly.',
  openGraph: {
    title: 'HIVE — Describe it. Build it. Deploy it.',
    description:
      'The AI-powered creation platform for student orgs. No code. No templates. Just describe what you need.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HIVE — Describe it. Build it. Deploy it.',
    description:
      'The AI-powered creation platform for student orgs. No code. No templates. Just describe what you need.',
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
