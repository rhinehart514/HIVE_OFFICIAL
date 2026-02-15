import * as React from 'react';

// Force dynamic rendering for this route segment
// This prevents static generation at build time which requires Firebase config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function CreateRitualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
