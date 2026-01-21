'use client';

/**
 * HIVE Landing Page — Gated Entry
 *
 * 6-digit access code entry
 * Limited access mode - codes distributed manually
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  motion,
  NoiseOverlay,
  Logo,
} from '@hive/ui/design-system/primitives';

const ACCESS_GATE_ENABLED = process.env.NEXT_PUBLIC_ACCESS_GATE_ENABLED === 'true';

export default function LandingPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if already has valid access
  useEffect(() => {
    if (!ACCESS_GATE_ENABLED) {
      router.push('/enter');
      return;
    }

    const hasAccess = sessionStorage.getItem('hive_access_granted');
    if (hasAccess === 'true') {
      router.push('/enter');
    }
  }, [router]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(0, 1);

    const newCode = code.split('');
    newCode[index] = digit;
    const updatedCode = newCode.join('');

    setCode(updatedCode);
    setError('');

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
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
        router.push('/enter');
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

  // If gate disabled, show loading while redirecting
  if (!ACCESS_GATE_ENABLED) {
    return (
      <div className="h-screen bg-[var(--color-bg-void)] flex items-center justify-center">
        <NoiseOverlay />
        <div className="flex items-center gap-3 text-white/50">
          <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <span className="text-[14px]">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[var(--color-bg-void)] text-[var(--color-text-primary)] flex flex-col overflow-hidden">
      <NoiseOverlay />

      {/* Main — vertically centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <Logo variant="mark" size="lg" color="gold" />
        </motion.div>

        {/* Statement */}
        <motion.h1
          className="text-center text-[clamp(28px,6vw,48px)] font-semibold leading-[1.1] tracking-[-0.02em] text-white max-w-[600px] mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          Enter your code
        </motion.h1>

        <motion.p
          className="text-[15px] text-white/40 text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Limited access — codes distributed via LinkedIn
        </motion.p>

        {/* 6-digit code input */}
        <motion.div
          className="flex gap-3 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
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
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.p
            className="text-[13px] text-red-400/90 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}

        {/* Loading state */}
        {isVerifying && (
          <motion.div
            className="flex items-center gap-2 text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="w-3 h-3 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            <span className="text-[13px]">Verifying...</span>
          </motion.div>
        )}

        {/* Learn more */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <Link
            href="/about"
            className="text-[14px] text-white/40 hover:text-white/60 transition-colors"
          >
            What is HIVE?
          </Link>
        </motion.div>
      </main>

      {/* Footer — minimal */}
      <footer className="py-6 px-6 flex justify-between items-center text-[12px] text-white/30">
        <span>HIVE</span>
        <div className="flex gap-4">
          <Link href="/legal/terms" className="hover:text-white/50 transition-colors">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}
