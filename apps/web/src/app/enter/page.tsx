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

import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
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
 * Access Code Gate Component
 */
function AccessCodeGate({ onAccessGranted }: { onAccessGranted: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    const newCode = code.split('');
    newCode[index] = digit;
    const updatedCode = newCode.join('');

    setCode(updatedCode);
    setError('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (updatedCode.length === 6) {
      verifyCode(updatedCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setCode(pastedData);
    if (pastedData.length === 6) {
      verifyCode(pastedData);
    }
  };

  const verifyCode = async (accessCode: string) => {
    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.setItem('hive_access_granted', 'true');
        onAccessGranted();
      } else {
        setError('Invalid code');
        setCode('');
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Something went wrong');
      setCode('');
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <EntryShellStatic>
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-[32px] font-semibold tracking-tight text-white">
            Enter your code
          </h1>
          <p className="text-[15px] text-white/40">
            Limited access — codes distributed via LinkedIn
          </p>
        </div>

        <div className="flex gap-3 mb-4">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={code[index] || ''}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isVerifying}
              className="w-12 h-14 text-center text-[24px] font-semibold bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]/50 focus:bg-white/8 transition-all disabled:opacity-50"
              autoFocus={index === 0}
            />
          ))}
        </div>

        {error && (
          <p className="text-[13px] text-red-400/90">{error}</p>
        )}

        {isVerifying && (
          <div className="flex items-center gap-2 text-white/40">
            <span className="w-3 h-3 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            <span className="text-[13px]">Verifying...</span>
          </div>
        )}
      </div>
    </EntryShellStatic>
  );
}

/**
 * Main entry content with evolving flow
 */
function EntryContent() {
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('neutral');
  const [hasAccess, setHasAccess] = useState(!ACCESS_GATE_ENABLED);

  // Check for existing access on mount
  useEffect(() => {
    if (!ACCESS_GATE_ENABLED) {
      setHasAccess(true);
      return;
    }

    const accessGranted = sessionStorage.getItem('hive_access_granted');
    if (accessGranted === 'true') {
      setHasAccess(true);
    }
  }, []);

  const handleEmotionalStateChange = useCallback((state: EmotionalState) => {
    setEmotionalState(state);
  }, []);

  const handleAccessGranted = useCallback(() => {
    setHasAccess(true);
  }, []);

  // Show access code gate if gate is enabled and no access
  if (ACCESS_GATE_ENABLED && !hasAccess) {
    return <AccessCodeGate onAccessGranted={handleAccessGranted} />;
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
