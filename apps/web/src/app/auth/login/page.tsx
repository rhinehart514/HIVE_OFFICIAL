'use client';

import { useState, Suspense } from 'react';
import { Loader2, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input } from '@hive/ui';
import {
  transitionSilk,
  staggerContainer,
  staggerItem,
  breathingGlow,
  GLOW_GOLD_SUBTLE,
} from '@/lib/motion-primitives';

export const dynamic = 'force-dynamic';

// Campus configuration
const CAMPUS_CONFIG = {
  id: process.env.NEXT_PUBLIC_CAMPUS_ID || 'ub-buffalo',
  domain: process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN || 'buffalo.edu',
  name: process.env.NEXT_PUBLIC_CAMPUS_NAME || 'UB',
  fullName: process.env.NEXT_PUBLIC_CAMPUS_FULL_NAME || 'University at Buffalo',
  schoolId: process.env.NEXT_PUBLIC_SCHOOL_ID || 'ub',
};

type LoginState = 'input' | 'sending' | 'sent';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loginState, setLoginState] = useState<LoginState>('input');

  const fullEmail = email.includes('@') ? email : `${email}@${CAMPUS_CONFIG.domain}`;

  const handleSubmit = async () => {
    if (!email) {
      setError('Enter your email');
      return;
    }

    // Basic email format validation
    const emailToSend = fullEmail;
    if (!emailToSend.includes('@') || !emailToSend.includes('.')) {
      setError('Enter a valid email address');
      return;
    }

    setLoginState('sending');
    setError(null);

    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToSend,
          schoolId: CAMPUS_CONFIG.schoolId
        }),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        setLoginState('sent');
      } else {
        setError(data.error || 'Failed to send magic link');
        setLoginState('input');
      }
    } catch (err) {
      console.error('Magic link error:', err);
      setError('Unable to send magic link. Please try again.');
      setLoginState('input');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && loginState === 'input') {
      handleSubmit();
    }
  };

  const handleBackToInput = () => {
    setLoginState('input');
    setError(null);
  };

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center p-6 overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Breathing gold orb */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-500"
          style={{ filter: 'blur(120px)' }}
          variants={breathingGlow}
          animate="animate"
        />
      </div>

      {/* Main content */}
      <motion.div
        className="relative w-full max-w-sm"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Logo & Header */}
        <motion.div variants={staggerItem} transition={transitionSilk} className="text-center mb-8">
          {/* Logo */}
          <motion.div
            className="inline-flex items-center gap-3 mb-6"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div
              className="w-10 h-10 rounded-xl border-2 border-gold-500 bg-gold-500/10 flex items-center justify-center"
              style={{ boxShadow: GLOW_GOLD_SUBTLE }}
            >
              <img src="/assets/hive-logo-gold.svg" alt="" className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">HIVE</span>
          </motion.div>

          <AnimatePresence mode="wait">
            {loginState === 'sent' ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="text-3xl font-bold text-white tracking-tight">Check your email</h1>
                <p className="mt-2 text-neutral-400">
                  We sent a magic link to sign you in
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="text-3xl font-bold text-white tracking-tight">Welcome to HIVE</h1>
                <p className="mt-2 text-neutral-400">
                  Sign in with your {CAMPUS_CONFIG.name} email
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Form Card */}
        <motion.div
          variants={staggerItem}
          transition={transitionSilk}
          className="bg-neutral-950/80 backdrop-blur-xl rounded-2xl p-6 border border-neutral-800/50"
        >
          <AnimatePresence mode="wait">
            {loginState === 'sent' ? (
              <motion.div
                key="sent-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-4 space-y-6"
              >
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </motion.div>

                {/* Email Display */}
                <div className="space-y-2">
                  <p className="text-neutral-300 font-medium">{fullEmail}</p>
                  <p className="text-sm text-neutral-500">
                    Click the link in your email to sign in.
                    <br />
                    The link expires in 15 minutes.
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={handleBackToInput}
                    fullWidth
                    className="text-neutral-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Use a different email
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="input-state"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-5"
              >
                {/* Email Input */}
                <motion.div variants={staggerItem} transition={transitionSilk}>
                  <Input
                    label="Email"
                    type="text"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="yourname"
                    suffix={`@${CAMPUS_CONFIG.domain}`}
                    error={error || undefined}
                    disabled={loginState === 'sending'}
                  />
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={staggerItem} transition={transitionSilk}>
                  <Button
                    onClick={handleSubmit}
                    state={loginState === 'sending' ? 'loading' : 'idle'}
                    fullWidth
                    size="lg"
                    disabled={loginState === 'sending'}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {loginState === 'sending' ? 'Sending...' : 'Send Magic Link'}
                  </Button>
                </motion.div>

                {/* Info Text */}
                <motion.p
                  variants={staggerItem}
                  transition={transitionSilk}
                  className="text-xs text-center text-neutral-500"
                >
                  We&apos;ll email you a secure sign-in link.
                  <br />
                  No password needed.
                </motion.p>

                {/* Legal */}
                <motion.p
                  variants={staggerItem}
                  transition={transitionSilk}
                  className="text-xs text-center text-neutral-500 pt-2"
                >
                  By continuing, you agree to our{' '}
                  <a href="/legal/terms" className="underline hover:text-neutral-300 transition-colors">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="/legal/privacy" className="underline hover:text-neutral-300 transition-colors">
                    Privacy Policy
                  </a>
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Campus Badge */}
        <motion.div
          variants={staggerItem}
          transition={transitionSilk}
          className="mt-6 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/50 border border-neutral-800/50">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-neutral-400">{CAMPUS_CONFIG.fullName}</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Loader2 className="h-6 w-6 animate-spin text-white" />
        <span className="text-sm text-neutral-500">Loading...</span>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginContent />
    </Suspense>
  );
}
