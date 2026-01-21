'use client';

/**
 * /enter - Single-Page Evolving Entry Flow
 * REDESIGNED: Jan 20, 2026
 *
 * One page that evolves as the user progresses through entry.
 * No navigation, no page swaps — sections appear and lock to chips.
 *
 * Flow: school → email → code → role → identity → arrival
 *
 * Key changes from previous:
 * - All sections on one page that transforms
 * - Completed sections collapse to locked chips
 * - Role selection is an "earned moment" after code verification
 * - No progress indicator (visual progress through locked chips)
 * - Gated by access code if ACCESS_GATE_ENABLED
 */

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  EntryShell,
  EntryShellStatic,
  EvolvingEntry,
  type EmotionalState,
} from '@/components/entry';

export const dynamic = 'force-dynamic';

const ACCESS_GATE_ENABLED = process.env.NEXT_PUBLIC_ACCESS_GATE_ENABLED === 'true';

/**
 * Static loading fallback
 */
function EntryPageFallback() {
  return (
    <EntryShellStatic>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-[24px] font-semibold tracking-tight text-white">
            Get in
          </h1>
          <div className="flex items-center gap-2 text-white/50">
            <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <span className="text-[14px]">Loading</span>
          </div>
        </div>
      </div>
    </EntryShellStatic>
  );
}

/**
 * Main entry content with evolving flow
 */
function EntryContent() {
  const router = useRouter();
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('neutral');
  const [isCheckingAccess, setIsCheckingAccess] = useState(ACCESS_GATE_ENABLED);

  // Check for valid access code
  useEffect(() => {
    if (!ACCESS_GATE_ENABLED) {
      setIsCheckingAccess(false);
      return;
    }

    const hasAccess = sessionStorage.getItem('hive_access_granted');
    if (hasAccess !== 'true') {
      router.push('/');
    } else {
      setIsCheckingAccess(false);
    }
  }, [router]);

  const handleEmotionalStateChange = useCallback((state: EmotionalState) => {
    setEmotionalState(state);
  }, []);

  if (isCheckingAccess) {
    return (
      <EntryShellStatic>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-[24px] font-semibold tracking-tight text-white">
              Checking access
            </h1>
            <div className="flex items-center gap-2 text-white/50">
              <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <span className="text-[14px]">Please wait</span>
            </div>
          </div>
        </div>
      </EntryShellStatic>
    );
  }

  return (
    <EntryShell
      emotionalState={emotionalState}
      showProgress={false}
      scrollable={true}
    >
      <EvolvingEntry onEmotionalStateChange={handleEmotionalStateChange} />
    </EntryShell>
  );
}

/**
 * Entry page with Suspense boundary
 */
export default function EnterPage() {
  return (
    <Suspense fallback={<EntryPageFallback />}>
      <EntryContent />
    </Suspense>
  );
}
