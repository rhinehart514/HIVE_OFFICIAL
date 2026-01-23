'use client';

import { LayoutProvider } from '@hive/ui';

interface Props {
  children: React.ReactNode;
}

/**
 * Tool Layout Client Wrapper
 *
 * Uses LayoutProvider with 'immersion' archetype to hide the shell.
 * This gives the tool IDE a full-screen, focused experience.
 */
export function ToolLayoutClient({ children }: Props) {
  return (
    <LayoutProvider archetype="immersion">
      {children}
    </LayoutProvider>
  );
}
