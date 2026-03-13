'use client';

/**
 * /enter - The Threshold
 *
 * Streamlined 2-screen entry flow:
 * 1) Email
 * 2) Code + Name (name appears inline after code verification for new users)
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { EntryFlowV2 } from '@/components/entry/EntryFlowV2';

export const dynamic = 'force-dynamic';

function EntryFallback() {
  return (
    <div className="min-h-dvh bg-void flex items-center justify-center">
      <div className="w-3 h-3 rounded-full bg-white/[0.05]" />
    </div>
  );
}

export default function EnterPage() {
  return (
    <Suspense fallback={<EntryFallback />}>
      <Link href="/" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-[#FFD700] focus:text-black focus:rounded-full focus:m-2 focus:font-semibold">Back to home</Link>
      <EntryFlowV2 />
    </Suspense>
  );
}
