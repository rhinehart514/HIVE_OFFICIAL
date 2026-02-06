'use client';

import { Footer } from '@hive/ui/design-system/primitives';

export function LandingFooter() {
  return (
    <Footer variant="minimal">
      <Footer.Copyright>&copy; {new Date().getFullYear()} HIVE</Footer.Copyright>
      <Footer.Links>
        <Footer.Link href="/legal/terms">Terms</Footer.Link>
        <Footer.Link href="/legal/privacy">Privacy</Footer.Link>
      </Footer.Links>
    </Footer>
  );
}
