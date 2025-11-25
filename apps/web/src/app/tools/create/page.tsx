'use client';

import { AILandingPageChat } from '@hive/ui';

/**
 * AI Tool Builder (MVP)
 *
 * Primary tool creation flow using AI generation.
 * Anonymous users can try before signup (localStorage persistence).
 * Visual builder moved to Phase 2 post-launch.
 */
export default function CreateToolPage() {
  return (
    <AILandingPageChat
      isAuthenticated={false} // Handled by component internally
      redirectToSignup={() => {
        // Redirect to signup page
        window.location.href = '/auth/signup?redirect=/tools';
      }}
    />
  );
}
