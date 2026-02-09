'use client';

import { LayoutProvider } from '@hive/ui';

/**
 * Spaces Layout
 *
 * Sets the 'orientation' archetype for the Spaces HQ.
 * Shell visibility is ON for orientation layouts.
 */
export default function SpacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutProvider archetype="orientation">
      {children}
    </LayoutProvider>
  );
}
