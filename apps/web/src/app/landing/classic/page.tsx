import { LandingPage } from '@/components/landing/landing-page';

export const dynamic = 'force-dynamic';

/**
 * Classic Landing Page
 *
 * The traditional SaaS landing with sections:
 * - Hero
 * - Product showcase
 * - Credibility
 * - CTA
 *
 * Kept for A/B testing and fallback.
 */
export default function ClassicLandingPage() {
  return <LandingPage />;
}
