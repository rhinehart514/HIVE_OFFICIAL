import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | HIVE',
  description: 'Account preferences and security settings',
};

/**
 * Settings Layout
 *
 * Provides metadata and layout context for settings routes.
 * Settings uses client-side routing with ?section= params,
 * so the main page.tsx handles all section rendering.
 */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
