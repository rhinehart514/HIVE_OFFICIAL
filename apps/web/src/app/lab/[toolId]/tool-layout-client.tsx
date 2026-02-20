'use client';

interface Props {
  children: React.ReactNode;
}

/**
 * Tool Layout Client Wrapper
 *
 * Shell is hidden for /lab/ routes via AppShell prefix exclusion.
 * This wrapper passes children through for the full-screen IDE experience.
 */
export function ToolLayoutClient({ children }: Props) {
  return <>{children}</>;
}
