'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Loader2,
  Lock,
  Unlock,
  ArrowRight,
  Users,
  Sparkles,
  AtSign,
  Search,
  Activity
} from 'lucide-react';
import { cn } from '../../../lib/utils';

// =============================================================================
// SHARED DESIGN TOKENS
// =============================================================================

const GLOW_GOLD_STRONG = '0 0 40px rgba(255, 215, 0, 0.2), 0 0 0 1px rgba(255, 215, 0, 0.3)';
const GLOW_GOLD_SUBTLE = '0 0 20px rgba(255, 215, 0, 0.08)';
const EASE_PREMIUM = [0.22, 1, 0.36, 1];

// =============================================================================
// OPTION A: PREVIEW-FIRST (SPLIT SCREEN)
// =============================================================================

/**
 * Split-screen layout where users can see the product before committing.
 * Left side: Live preview of spaces and activity
 * Right side: Auth/onboarding form
 */
function PreviewFirstLayout() {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(email.includes('@buffalo.edu'));
  }, [email]);

  return (
    <div className="min-h-screen flex bg-[#0A0A0A]">
      {/* Left: Product Preview (60%) */}
      <div className="hidden lg:flex w-[60%] flex-col border-r border-white/[0.06] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-gold-500" />
            </div>
            <span className="text-xl font-semibold text-white">HIVE</span>
          </div>
        </div>

        {/* Live Activity Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Activity header */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-neutral-400">Live on campus</span>
          </div>

          {/* Trending Spaces */}
          <div className="mb-8">
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">
              Trending Spaces
            </h3>
            <div className="space-y-3">
              {[
                { name: 'CS Club', members: 847, activity: 'hackathon planning' },
                { name: 'Photography Club', members: 234, activity: 'photo walk tomorrow' },
                { name: 'Debate Society', members: 156, activity: 'mock debate tonight' },
              ].map((space, i) => (
                <motion.div
                  key={space.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">{space.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-3 h-3 text-neutral-500" />
                        <span className="text-xs text-neutral-500">{space.members}</span>
                        <span className="text-xs text-neutral-600">•</span>
                        <span className="text-xs text-gold-500/80">{space.activity}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-600" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">
              Happening Soon
            </h3>
            <div className="space-y-2">
              {[
                { name: 'Startup Mixer', time: 'Tomorrow, 6PM', attendees: 45 },
                { name: 'Game Night', time: 'Friday, 8PM', attendees: 28 },
              ].map((event, i) => (
                <motion.div
                  key={event.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                  className="p-3 rounded-lg bg-white/[0.01] border border-white/[0.04]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-white">{event.name}</span>
                      <span className="text-xs text-neutral-500 ml-2">{event.time}</span>
                    </div>
                    <span className="text-xs text-gold-500">{event.attendees} going</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="p-6 border-t border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">
              <span className="text-gold-500 font-semibold">2,341</span> students active
            </span>
            <span className="text-neutral-600">400+ spaces</span>
          </div>
        </div>
      </div>

      {/* Right: Auth Form (40%) */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16">
        <div className="max-w-sm mx-auto w-full">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-gold-500" />
            </div>
            <span className="text-xl font-semibold text-white">HIVE</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_PREMIUM }}
          >
            <h1 className="text-3xl font-semibold text-white mb-2">
              Join the hive
            </h1>
            <p className="text-neutral-400 mb-8">
              Enter your UB email to get started
            </p>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@buffalo.edu"
                  className="w-full h-14 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500/40 focus:ring-2 focus:ring-gold-500/20 transition-all"
                />
                {isValid && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <Check className="w-5 h-5 text-gold-500" />
                  </motion.div>
                )}
              </div>

              <button
                className={cn(
                  "w-full h-14 rounded-xl font-medium flex items-center justify-center gap-2 transition-all",
                  isValid
                    ? "bg-gold-500 text-black hover:bg-gold-400"
                    : "bg-white/[0.03] text-neutral-600 cursor-not-allowed"
                )}
                disabled={!isValid}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// OPTION B: NARRATIVE REVEAL (FULL-SCREEN PROGRESSIVE)
// =============================================================================

/**
 * One thing at a time. Each screen is ONE question, dramatically presented.
 * Typeform-style but with HIVE's premium aesthetic.
 */
function NarrativeRevealLayout() {
  const [step, setStep] = useState<'email' | 'handle' | 'space'>('email');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [shouldPulse, setShouldPulse] = useState(false);
  const handleInputRef = useRef<HTMLInputElement>(null);

  // Simulate handle checking
  useEffect(() => {
    if (handle.length < 3) {
      setHandleStatus('idle');
      return;
    }
    setHandleStatus('checking');
    const timer = setTimeout(() => {
      const isTaken = handle === 'john' || handle === 'jane';
      setHandleStatus(isTaken ? 'taken' : 'available');
      if (!isTaken) {
        setShouldPulse(true);
        setTimeout(() => setShouldPulse(false), 700);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [handle]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative overflow-hidden">
      {/* Ambient gold orb */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.03, 0.06, 0.03],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Progress dots */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {['email', 'handle', 'space'].map((s, i) => (
            <motion.div
              key={s}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                s === step ? "bg-gold-500" : "bg-white/20"
              )}
              animate={{ scale: s === step ? 1.2 : 1 }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.5, ease: EASE_PREMIUM }}
                className="text-center max-w-md"
              >
                <h1 className="text-4xl md:text-5xl font-semibold text-white mb-8">
                  What's your @buffalo.edu?
                </h1>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@buffalo.edu"
                  className="w-full h-16 px-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white text-lg text-center placeholder:text-neutral-600 focus:outline-none focus:border-gold-500/40 focus:ring-2 focus:ring-gold-500/20 transition-all"
                  autoFocus
                />

                <button
                  onClick={() => setStep('handle')}
                  className="mt-8 h-14 px-8 rounded-xl bg-gold-500 text-black font-medium hover:bg-gold-400 transition-colors flex items-center gap-2 mx-auto"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 'handle' && (
              <motion.div
                key="handle"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.5, ease: EASE_PREMIUM }}
                className="text-center max-w-lg"
              >
                <h1 className="text-3xl md:text-4xl font-semibold text-white mb-2">
                  {handleStatus === 'available' ? "It's yours." : 'Claim your @'}
                </h1>
                <p className="text-neutral-500 mb-12">
                  This is your identity on HIVE
                </p>

                {/* Giant handle display with unlock animation */}
                <motion.div
                  animate={shouldPulse ? {
                    boxShadow: [
                      '0 0 0 0 rgba(255, 215, 0, 0)',
                      '0 0 40px 20px rgba(255, 215, 0, 0.15)',
                      '0 0 0 0 rgba(255, 215, 0, 0)',
                    ],
                  } : {}}
                  transition={{ duration: 0.7 }}
                  className="relative cursor-text mb-6"
                  onClick={() => handleInputRef.current?.focus()}
                >
                  <div className="flex items-center justify-center gap-3">
                    {/* Unlock icon */}
                    <motion.div
                      animate={{
                        rotate: handleStatus === 'available' ? 0 : 0,
                        scale: handleStatus === 'available' ? [1, 1.2, 1] : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {handleStatus === 'available' ? (
                        <Unlock className="w-8 h-8 text-gold-500" />
                      ) : (
                        <Lock className="w-8 h-8 text-neutral-600" />
                      )}
                    </motion.div>

                    {/* Handle text */}
                    <span
                      className={cn(
                        "text-5xl md:text-7xl font-bold tracking-tight transition-colors",
                        handleStatus === 'available' && "text-gold-500",
                        handleStatus === 'taken' && "text-red-400",
                        handleStatus === 'checking' && "text-neutral-400",
                        handleStatus === 'idle' && (handle ? "text-white" : "text-neutral-600")
                      )}
                    >
                      @{handle || '_'}
                    </span>
                  </div>

                  {/* Hidden input */}
                  <input
                    ref={handleInputRef}
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    className="absolute inset-0 opacity-0 cursor-text"
                    autoComplete="off"
                    autoFocus
                  />
                </motion.div>

                {/* Status */}
                <div className="h-6 flex items-center justify-center mb-8">
                  {handleStatus === 'checking' && (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                  )}
                  {handleStatus === 'available' && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-sm text-gold-500 flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" /> claimed
                    </motion.span>
                  )}
                  {handleStatus === 'taken' && (
                    <span className="text-sm text-red-400">taken</span>
                  )}
                </div>

                <button
                  onClick={() => setStep('space')}
                  disabled={handleStatus !== 'available'}
                  className={cn(
                    "h-14 px-8 rounded-xl font-medium transition-all flex items-center gap-2 mx-auto",
                    handleStatus === 'available'
                      ? "bg-gold-500 text-black hover:bg-gold-400"
                      : "bg-white/[0.03] text-neutral-600 cursor-not-allowed"
                  )}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 'space' && (
              <motion.div
                key="space"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.5, ease: EASE_PREMIUM }}
                className="text-center max-w-lg"
              >
                <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4">
                  Find your people
                </h1>
                <p className="text-neutral-500 mb-12">
                  Pick a few spaces to get started
                </p>

                {/* Space selection */}
                <div className="space-y-3 mb-8">
                  {[
                    { name: 'CS Club', members: 847, selected: true },
                    { name: 'Photography Club', members: 234, selected: false },
                    { name: 'Startup Community', members: 312, selected: true },
                  ].map((space) => (
                    <button
                      key={space.name}
                      className={cn(
                        "w-full p-4 rounded-xl border flex items-center justify-between transition-all",
                        space.selected
                          ? "border-gold-500/30 bg-gold-500/[0.05]"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                      )}
                    >
                      <div className="text-left">
                        <span className="text-white font-medium">{space.name}</span>
                        <span className="text-xs text-neutral-500 ml-2">{space.members} members</span>
                      </div>
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center",
                          space.selected ? "bg-gold-500" : "bg-white/[0.05]"
                        )}
                      >
                        {space.selected && <Check className="w-4 h-4 text-black" />}
                      </div>
                    </button>
                  ))}
                </div>

                <button className="h-14 px-8 rounded-xl bg-gold-500 text-black font-medium hover:bg-gold-400 transition-colors flex items-center gap-2 mx-auto">
                  Enter HIVE
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// OPTION C: SPOTLIGHT (SINGLE QUESTION + CONTEXT)
// =============================================================================

/**
 * Single centered input with contextual social proof above and below.
 * The question is simple, but the context builds desire.
 */
function SpotlightLayout() {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [studentsOnline] = useState(Math.floor(Math.random() * 100) + 120);

  useEffect(() => {
    setIsValid(email.includes('@buffalo.edu'));
  }, [email]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Top context bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="p-4"
      >
        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/[0.04] w-fit mx-auto">
          <div className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
          <span className="text-sm text-neutral-400">
            <span className="text-gold-500 font-medium">{studentsOnline}</span> students online right now
          </span>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_PREMIUM }}
          className="text-center max-w-md w-full"
        >
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-12">
            What's your @buffalo.edu?
          </h1>

          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@buffalo.edu"
              className="w-full h-16 px-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white text-lg text-center placeholder:text-neutral-600 focus:outline-none focus:border-gold-500/40 focus:ring-2 focus:ring-gold-500/20 transition-all"
              autoFocus
            />
            {isValid && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute right-5 top-1/2 -translate-y-1/2"
              >
                <div
                  className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center"
                  style={{ boxShadow: GLOW_GOLD_STRONG }}
                >
                  <Check className="w-5 h-5 text-black" />
                </div>
              </motion.div>
            )}
          </div>

          <button
            className={cn(
              "mt-8 h-14 px-10 rounded-xl font-medium flex items-center gap-2 mx-auto transition-all",
              isValid
                ? "bg-gold-500 text-black hover:bg-gold-400"
                : "bg-white/[0.03] text-neutral-600 cursor-not-allowed"
            )}
            disabled={!isValid}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* Bottom context */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="p-6 border-t border-white/[0.04]"
      >
        <p className="text-center text-sm text-neutral-500">
          Join <span className="text-white font-medium">CS Club</span>, <span className="text-white font-medium">Photography Club</span>, and <span className="text-gold-500">400+ more</span>
        </p>
      </motion.div>
    </div>
  );
}

// =============================================================================
// OPTION D: HANDLE HERO (DRAMATIC HANDLE CLAIM)
// =============================================================================

/**
 * Handle claim as the main event. Super dramatic, unlock animation.
 * For testing the "The Unlock" concept in isolation.
 */
function HandleHeroLayout() {
  const [handle, setHandle] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (handle.length < 3) {
      setStatus('idle');
      setIsUnlocked(false);
      return;
    }
    setStatus('checking');
    const timer = setTimeout(() => {
      const isTaken = handle === 'john' || handle === 'admin';
      setStatus(isTaken ? 'taken' : 'available');
      if (!isTaken) setIsUnlocked(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [handle]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      {/* Background glow */}
      <motion.div
        animate={isUnlocked ? {
          scale: [1, 1.5, 1.2],
          opacity: [0.05, 0.15, 0.08],
        } : {
          scale: 1,
          opacity: 0.05,
        }}
        transition={{ duration: 0.8 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 text-center max-w-lg">
        {/* Headline */}
        <motion.h1
          animate={{
            color: status === 'available' ? '#FFD700' : '#FFFFFF',
          }}
          className="text-3xl md:text-4xl font-semibold mb-4"
        >
          {status === 'available' ? "Unlocked." : 'Claim your identity'}
        </motion.h1>

        <p className="text-neutral-500 mb-12">
          Your permanent handle on HIVE
        </p>

        {/* Handle display with lock icon */}
        <motion.div
          className="relative cursor-text mb-8"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Lock/Unlock icon with animation */}
          <motion.div
            className="flex items-center justify-center gap-4 mb-4"
          >
            <motion.div
              animate={isUnlocked ? {
                scale: [1, 1.3, 1],
                rotate: [0, -10, 0],
              } : {}}
              transition={{ duration: 0.5 }}
            >
              {isUnlocked ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <Unlock
                    className="w-12 h-12 text-gold-500"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))' }}
                  />
                </motion.div>
              ) : (
                <Lock className="w-12 h-12 text-neutral-700" />
              )}
            </motion.div>
          </motion.div>

          {/* Giant @ display */}
          <motion.div
            animate={isUnlocked ? {
              boxShadow: [
                '0 0 0 0 rgba(255, 215, 0, 0)',
                '0 0 60px 30px rgba(255, 215, 0, 0.2)',
                '0 0 30px 15px rgba(255, 215, 0, 0.1)',
              ],
            } : {}}
            transition={{ duration: 0.8 }}
            className="inline-block px-8 py-4 rounded-2xl"
          >
            <span
              className={cn(
                "text-6xl md:text-8xl font-bold tracking-tight transition-colors duration-300",
                status === 'available' && "text-gold-500",
                status === 'taken' && "text-red-400",
                status === 'checking' && "text-neutral-500",
                status === 'idle' && (handle ? "text-white" : "text-neutral-700")
              )}
            >
              @{handle || 'you'}
            </span>
          </motion.div>

          {/* Golden underline on success */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isUnlocked ? 1 : 0 }}
            transition={{ duration: 0.5, ease: EASE_PREMIUM }}
            className="h-1 bg-gold-500 rounded-full mt-4 mx-auto"
            style={{
              width: '60%',
              transformOrigin: 'left',
              boxShadow: GLOW_GOLD_STRONG,
            }}
          />

          {/* Hidden input */}
          <input
            ref={inputRef}
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
            className="absolute inset-0 opacity-0 cursor-text"
            autoComplete="off"
            autoFocus
          />
        </motion.div>

        {/* Status indicator */}
        <div className="h-8 flex items-center justify-center mb-8">
          {status === 'checking' && (
            <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
          )}
          {status === 'available' && (
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gold-500 flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              This one's yours
            </motion.span>
          )}
          {status === 'taken' && (
            <span className="text-red-400">Already taken — try another</span>
          )}
        </div>

        {/* Continue button */}
        <motion.button
          animate={{
            opacity: status === 'available' ? 1 : 0.3,
            scale: status === 'available' ? 1 : 0.95,
          }}
          className="h-14 px-10 rounded-xl bg-gold-500 text-black font-medium transition-all flex items-center gap-2 mx-auto disabled:cursor-not-allowed"
          disabled={status !== 'available'}
          style={status === 'available' ? { boxShadow: GLOW_GOLD_SUBTLE } : {}}
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}

// =============================================================================
// OPTION E: MONOCHROME FLOW (MINIMALISTIC BUT FAR FROM IT)
// =============================================================================

/**
 * The refined monochrome approach:
 * - 99% grayscale, gold ONLY at the unlock moment
 * - Sophisticated typography, generous spacing
 * - Subtle motion, confident restraint
 * - The gold is EARNED - it appears only when you claim your handle
 */
function MonochromeFlow() {
  const [step, setStep] = useState<'email' | 'otp' | 'handle' | 'type' | 'space'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [handle, setHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const handleInputRef = useRef<HTMLInputElement>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isEmailValid = email.includes('@buffalo.edu');
  const isOtpComplete = otp.every(d => d !== '');

  // Handle checking simulation
  useEffect(() => {
    if (handle.length < 3) {
      setHandleStatus('idle');
      setIsUnlocked(false);
      return;
    }
    setHandleStatus('checking');
    const timer = setTimeout(() => {
      const isTaken = handle === 'john' || handle === 'admin';
      setHandleStatus(isTaken ? 'taken' : 'available');
      if (!isTaken) {
        setIsUnlocked(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [handle]);

  // OTP input handler
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative overflow-hidden">
      {/* Subtle gradient - barely visible */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.02) 0%, transparent 50%)',
        }}
      />

      {/* Gold unlock glow - only appears on success */}
      <motion.div
        animate={isUnlocked ? {
          opacity: [0, 0.08, 0.04],
          scale: [0.8, 1.2, 1],
        } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 1, ease: EASE_PREMIUM }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 60%)',
          filter: 'blur(100px)',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Minimal header */}
        <div className="p-8">
          <span className="text-sm font-medium tracking-[0.2em] text-neutral-600">HIVE</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-6 pb-24">
          <AnimatePresence mode="wait">
            {/* EMAIL STEP */}
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
              >
                <h1 className="text-[32px] font-normal text-white tracking-tight mb-16 text-center">
                  Enter your email
                </h1>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@buffalo.edu"
                  className="w-full h-14 px-0 bg-transparent border-0 border-b border-neutral-800 text-white text-lg text-center placeholder:text-neutral-700 focus:outline-none focus:border-gold-500/30 transition-all duration-300"
                  style={{
                    boxShadow: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 4px 20px -4px rgba(255, 215, 0, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                  }}
                  autoFocus
                />

                <div className="mt-16 flex justify-center">
                  <button
                    onClick={() => setStep('otp')}
                    disabled={!isEmailValid}
                    className={cn(
                      "h-12 px-8 rounded-full text-sm font-medium transition-all duration-300 relative overflow-hidden",
                      isEmailValid
                        ? "bg-white/95 text-black hover:bg-white hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] backdrop-blur-sm"
                        : "bg-neutral-900/80 text-neutral-700 cursor-not-allowed backdrop-blur-sm border border-neutral-800/50"
                    )}
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* OTP STEP */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
              >
                <h1 className="text-[32px] font-normal text-white tracking-tight mb-4 text-center">
                  Check your email
                </h1>
                <p className="text-neutral-500 text-center mb-16">
                  We sent a code to {email}
                </p>

                {/* OTP inputs - glassmorphism */}
                <div className="flex justify-center gap-3 mb-16">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-xl text-white text-xl text-center focus:outline-none focus:border-gold-500/30 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(255,215,0,0.08)] transition-all duration-300"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => setStep('handle')}
                    disabled={!isOtpComplete}
                    className={cn(
                      "h-12 px-8 rounded-full text-sm font-medium transition-all duration-300",
                      isOtpComplete
                        ? "bg-white/95 text-black hover:bg-white hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] backdrop-blur-sm"
                        : "bg-neutral-900/80 text-neutral-700 cursor-not-allowed backdrop-blur-sm border border-neutral-800/50"
                    )}
                  >
                    Verify
                  </button>
                </div>

                <button
                  onClick={() => setStep('email')}
                  className="mt-8 text-sm text-neutral-600 hover:text-neutral-400 transition-colors mx-auto block"
                >
                  Use a different email
                </button>
              </motion.div>
            )}

            {/* HANDLE STEP - THE MOMENT */}
            {step === 'handle' && (
              <motion.div
                key="handle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-lg text-center"
              >
                <motion.h1
                  animate={{
                    color: isUnlocked ? '#FFD700' : '#FFFFFF',
                  }}
                  transition={{ duration: 0.5 }}
                  className="text-[32px] font-normal tracking-tight mb-16"
                >
                  {isUnlocked ? "It's yours." : 'Choose your handle'}
                </motion.h1>

                {/* Handle input - giant, minimal */}
                <div
                  className="relative cursor-text mb-8"
                  onClick={() => handleInputRef.current?.focus()}
                >
                  <motion.span
                    animate={{
                      color: isUnlocked ? '#FFD700' :
                             handleStatus === 'taken' ? '#EF4444' :
                             handleStatus === 'checking' ? '#525252' :
                             handle ? '#FFFFFF' : '#404040',
                    }}
                    transition={{ duration: 0.3 }}
                    className="text-[56px] md:text-[72px] font-light tracking-tight"
                  >
                    @{handle || 'you'}
                  </motion.span>

                  {/* Golden underline - only on success */}
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{
                      scaleX: isUnlocked ? 1 : 0,
                      opacity: isUnlocked ? 1 : 0,
                    }}
                    transition={{ duration: 0.6, ease: EASE_PREMIUM, delay: 0.2 }}
                    className="h-[2px] bg-gold-500 mt-4 mx-auto"
                    style={{
                      width: '50%',
                      transformOrigin: 'center',
                      boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                    }}
                  />

                  <input
                    ref={handleInputRef}
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    className="absolute inset-0 opacity-0 cursor-text"
                    autoComplete="off"
                    autoFocus
                  />
                </div>

                {/* Status - minimal */}
                <div className="h-6 flex items-center justify-center mb-16">
                  {handleStatus === 'checking' && (
                    <span className="text-sm text-neutral-600">checking...</span>
                  )}
                  {handleStatus === 'taken' && (
                    <span className="text-sm text-red-400">taken</span>
                  )}
                  {isUnlocked && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-gold-500"
                    >
                      claimed
                    </motion.span>
                  )}
                </div>

                <motion.button
                  onClick={() => setStep('type')}
                  disabled={!isUnlocked}
                  animate={{
                    backgroundColor: isUnlocked ? '#FFFFFF' : '#171717',
                    color: isUnlocked ? '#000000' : '#525252',
                  }}
                  className="h-12 px-8 rounded-full text-sm font-medium transition-all duration-300"
                >
                  Continue
                </motion.button>
              </motion.div>
            )}

            {/* USER TYPE STEP */}
            {step === 'type' && (
              <motion.div
                key="type"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
              >
                <h1 className="text-[32px] font-normal text-white tracking-tight mb-16 text-center">
                  What brings you here?
                </h1>

                <div className="space-y-4">
                  <button
                    onClick={() => setStep('space')}
                    className="w-full p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:border-gold-500/20 hover:bg-white/[0.04] hover:shadow-[0_0_40px_rgba(255,215,0,0.06)] transition-all duration-300 text-left group"
                  >
                    <span className="text-lg text-white group-hover:text-gold-500/90 transition-colors">I run a club or org</span>
                    <p className="text-sm text-neutral-600 mt-1">Claim your space</p>
                  </button>

                  <button
                    onClick={() => setStep('space')}
                    className="w-full p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300 text-left group"
                  >
                    <span className="text-lg text-white">I'm looking to join things</span>
                    <p className="text-sm text-neutral-600 mt-1">Find your communities</p>
                  </button>
                </div>
              </motion.div>
            )}

            {/* SPACE STEP */}
            {step === 'space' && (
              <motion.div
                key="space"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
              >
                <h1 className="text-[32px] font-normal text-white tracking-tight mb-4 text-center">
                  Find your people
                </h1>
                <p className="text-neutral-500 text-center mb-12">
                  Pick a few to start
                </p>

                {/* Search - glassmorphism */}
                <div className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input
                    type="text"
                    placeholder="Search spaces..."
                    className="w-full h-12 pl-11 pr-4 bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-gold-500/20 focus:shadow-[0_0_20px_rgba(255,215,0,0.06)] transition-all duration-300"
                  />
                </div>

                {/* Spaces - glassmorphism cards */}
                <div className="space-y-2 mb-12">
                  {[
                    { name: 'CS Club', members: 847, selected: true },
                    { name: 'Photography Club', members: 234, selected: false },
                    { name: 'Startup Community', members: 312, selected: true },
                    { name: 'Debate Society', members: 156, selected: false },
                  ].map((space) => (
                    <button
                      key={space.name}
                      className={cn(
                        "w-full p-4 rounded-xl border flex items-center justify-between transition-all duration-300 backdrop-blur-sm",
                        space.selected
                          ? "border-gold-500/30 bg-gold-500/[0.04] shadow-[0_0_20px_rgba(255,215,0,0.06)]"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="text-left">
                        <span className={cn("transition-colors", space.selected ? "text-gold-500/90" : "text-white")}>{space.name}</span>
                        <span className="text-xs text-neutral-600 ml-2">{space.members}</span>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border transition-all flex items-center justify-center",
                          space.selected
                            ? "bg-gold-500 border-gold-500"
                            : "border-neutral-700"
                        )}
                      >
                        {space.selected && <Check className="w-3 h-3 text-black" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-center">
                  <button className="h-12 px-8 rounded-full bg-gold-500 text-black text-sm font-medium hover:bg-gold-400 hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all duration-300">
                    Enter HIVE
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Minimal footer - progress dots with subtle gold */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="flex items-center gap-2">
            {['email', 'otp', 'handle', 'type', 'space'].map((s) => (
              <motion.div
                key={s}
                animate={{
                  scale: s === step ? [1, 1.2, 1] : 1,
                  backgroundColor: s === step ? 'rgba(255, 215, 0, 0.8)' : 'rgba(38, 38, 38, 1)',
                  boxShadow: s === step ? '0 0 8px rgba(255, 215, 0, 0.4)' : 'none',
                }}
                transition={{
                  scale: { duration: 0.6, repeat: s === step ? Infinity : 0, repeatDelay: 2 },
                  backgroundColor: { duration: 0.3 },
                }}
                className="w-1.5 h-1.5 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// STORYBOOK CONFIGURATION
// =============================================================================

const meta: Meta = {
  title: 'Prototypes/Auth & Onboarding',
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0A0A0A' }],
    },
  },
};

export default meta;

type Story = StoryObj;

export const OptionA_PreviewFirst: Story = {
  name: 'A: Preview-First (Split Screen)',
  render: () => <PreviewFirstLayout />,
  parameters: {
    docs: {
      description: {
        story: 'Split-screen layout showing live product preview on the left (60%) while auth/onboarding happens on the right (40%). Users can see spaces and activity before committing. Best for building FOMO and showing value upfront.',
      },
    },
  },
};

export const OptionB_NarrativeReveal: Story = {
  name: 'B: Narrative Reveal (Full-Screen Progressive)',
  render: () => <NarrativeRevealLayout />,
  parameters: {
    docs: {
      description: {
        story: 'One question at a time, dramatically presented. Typeform-style with HIVE premium aesthetic. Features the "Unlock" animation when handle is claimed. Most focused UX with zero cognitive load.',
      },
    },
  },
};

export const OptionC_Spotlight: Story = {
  name: 'C: Spotlight (Single Question + Context)',
  render: () => <SpotlightLayout />,
  parameters: {
    docs: {
      description: {
        story: 'Single centered input with social proof context bars above and below. Simple question, but context builds desire. Shows live student count and popular spaces.',
      },
    },
  },
};

export const OptionD_HandleHero: Story = {
  name: 'D: Handle Hero (The Unlock Concept)',
  render: () => <HandleHeroLayout />,
  parameters: {
    docs: {
      description: {
        story: 'Dramatic handle claim step in isolation. Features the full "Unlock" concept with lock→unlock icon transition, golden pulse, and underline draw animation. Test this to evaluate the celebration moment.',
      },
    },
  },
};

export const OptionE_MonochromeFlow: Story = {
  name: 'E: Monochrome Flow (Complete)',
  render: () => <MonochromeFlow />,
  parameters: {
    docs: {
      description: {
        story: 'The refined monochrome approach. 99% grayscale with gold ONLY at the handle unlock moment. Complete 5-step flow: email → OTP → handle → type → space. Sophisticated typography, generous spacing, subtle motion, confident restraint. Gold is EARNED - it only appears when you claim your handle.',
      },
    },
  },
};
