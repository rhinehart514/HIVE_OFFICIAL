'use client';

/**
 * HIVE Landing Page — "The Window"
 *
 * Show, don't tell. The landing page is a window into campus activity.
 * FOMO through visibility, not explanation.
 */

import { useState } from 'react';
import {
  Button,
  motion,
  NoiseOverlay,
  DisplayText,
  Text,
  LandingNav,
  Footer,
  LandingWindow,
  type LandingWindowSpace,
} from '@hive/ui/design-system/primitives';

// Mock data for initial render (replaced by API in production)
const FEATURED_SPACES: LandingWindowSpace[] = [
  { id: '1', name: 'UB Esports', shortName: 'ESP', memberCount: 47, isLive: true },
  { id: '2', name: 'CS Club', shortName: 'CS', memberCount: 23, isLive: true },
  { id: '3', name: 'Pre-Med Society', shortName: 'PMS', memberCount: 89, isLive: true },
  { id: '4', name: 'UB Hacks', shortName: 'UBH', memberCount: 156, isLive: true },
  { id: '5', name: 'Acupuncture Club', shortName: 'ACU', memberCount: 12, isLive: false },
  { id: '6', name: 'Photography', shortName: 'PHO', memberCount: 34, isLive: true },
  { id: '7', name: 'Dance Marathon', shortName: 'DM', memberCount: 67, isLive: false },
  { id: '8', name: 'Debate Team', shortName: 'DBT', memberCount: 28, isLive: true },
];

export default function LandingPage() {
  const [spaces] = useState<LandingWindowSpace[]>(FEATURED_SPACES);
  const [studentCount] = useState(3247);

  return (
    <div className="min-h-screen bg-[var(--color-bg-void)] text-[var(--color-text-primary)] flex flex-col">
      <NoiseOverlay />

      {/* Nav */}
      <LandingNav fixed={false}>
        <LandingNav.Logo />
        <LandingNav.Actions>
          <Button variant="cta" size="sm" asChild>
            <a href="/enter">Enter with .edu</a>
          </Button>
        </LandingNav.Actions>
      </LandingNav>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center">
        {/* Headline */}
        <motion.div
          className="text-center mb-12 px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <DisplayText>Your campus is already here.</DisplayText>
        </motion.div>

        {/* The Window */}
        <LandingWindow spaces={spaces} featuredIndex={3} />
      </main>

      {/* Footer */}
      <Footer variant="minimal">
        <Footer.Brand />
        <Text size="sm" tone="muted">
          {studentCount.toLocaleString()} students building at UB
        </Text>
        <Footer.Copyright />
      </Footer>
    </div>
  );
}
