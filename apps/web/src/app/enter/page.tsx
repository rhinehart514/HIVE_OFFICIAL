'use client';

/**
 * /enter - The Threshold
 *
 * Streamlined 2-screen entry flow:
 * 1) Email
 * 2) Code + Name (name appears inline after code verification for new users)
 */

import { Suspense } from 'react';
import { EntryFlowV2 } from '@/components/entry/EntryFlowV2';

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
      <EntryFlowV2 />
    </Suspense>
  );
}
