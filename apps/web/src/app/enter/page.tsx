'use client';

/**
 * /enter - The Threshold
 *
 * 4-phase entry flow (same URL):
 * 1. Gate     → Email + code verification
 * 2. Naming   → First/last name (THE WEDGE)
 * 3. Field    → Year + major selection
 * 4. Crossing → Interests selection
 *
 * Narrative Arc: Outsider → Proven → Named → Claimed → Arrived
 */

import { Suspense } from 'react';
import { Entry } from '@/components/entry/Entry';

export const dynamic = 'force-dynamic';

function EntryFallback() {
  return (
    <div className="min-h-dvh bg-void flex items-center justify-center">
      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );
}

export default function EnterPage() {
  return (
    <Suspense fallback={<EntryFallback />}>
      <Entry />
    </Suspense>
  );
}
