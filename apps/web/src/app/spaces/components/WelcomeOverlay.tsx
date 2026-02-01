'use client';

/**
 * WelcomeOverlay — Personalized First-Time Landing
 *
 * "You're in, [Name]." moment after entry completion.
 * Shows what we know about them, pushes identity spaces.
 *
 * Flow:
 * 1. "You're in, [Name]." (gold moment)
 * 2. Brief identity summary (major, year)
 * 3. Identity space suggestions
 * 4. "Enter HQ" CTA
 *
 * HIVE Design System:
 * - Gold only for earned moments (#FFD700)
 * - Premium motion with ease-premium
 * - Warm dark backgrounds
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, GraduationCap, Home, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@hive/ui';
import { IdentityClaimModal } from '@/components/spaces/identity-claim-modal';
import type { IdentityType } from '@/components/spaces/identity-cards';

const EASE_PREMIUM = [0.16, 1, 0.3, 1];

interface WelcomeOverlayProps {
  firstName: string;
  major?: string | null;
  graduationYear?: number | null;
  onComplete: () => void;
}

type WelcomeStep = 'greeting' | 'identity' | 'spaces';

export function WelcomeOverlay({
  firstName,
  major,
  graduationYear,
  onComplete,
}: WelcomeOverlayProps) {
  const [step, setStep] = React.useState<WelcomeStep>('greeting');
  const [isExiting, setIsExiting] = React.useState(false);
  const [claimModalType, setClaimModalType] = React.useState<IdentityType | null>(null);
  const [claimedResidence, setClaimedResidence] = React.useState<string | null>(null);
  const [claimedGreek, setClaimedGreek] = React.useState<string | null>(null);

  // Auto-advance from greeting after 2s
  React.useEffect(() => {
    if (step === 'greeting') {
      const timer = setTimeout(() => setStep('identity'), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Auto-advance from identity after 2.5s
  React.useEffect(() => {
    if (step === 'identity') {
      const timer = setTimeout(() => setStep('spaces'), 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleEnterHQ = () => {
    setIsExiting(true);
    setTimeout(onComplete, 500);
  };

  const handleClaim = async (type: IdentityType, spaceId: string) => {
    try {
      const response = await fetch('/api/profile/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, spaceId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to claim identity');
      }

      const data = await response.json();

      // Update local state based on type
      if (type === 'residential') {
        setClaimedResidence(data.spaceName || 'Claimed');
      } else if (type === 'greek') {
        setClaimedGreek(data.spaceName || 'Claimed');
      }

      toast.success('Identity claimed!');
    } catch (error) {
      toast.error('Failed to claim', error instanceof Error ? error.message : 'Please try again.');
      throw error;
    }
  };

  // Allow click-to-skip on greeting/identity
  const handleClick = () => {
    if (step === 'greeting') setStep('identity');
    else if (step === 'identity') setStep('spaces');
  };

  return (
    <motion.div
      className="fixed inset-0 bg-foundation-gray-1000 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.5, ease: EASE_PREMIUM }}
    >
      {/* Subtle gold ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.03) 0%, transparent 60%)',
        }}
      />

      <AnimatePresence mode="wait">
        {/* STEP 1: Greeting */}
        {step === 'greeting' && (
          <motion.div
            key="greeting"
            className="text-center cursor-pointer px-8"
            onClick={handleClick}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: EASE_PREMIUM }}
          >
            <motion.p
              className="text-gold-500/60 text-label uppercase tracking-[0.3em] mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Welcome
            </motion.p>
            <h1 className="text-[3rem] md:text-[4.5rem] lg:text-[5.5rem] font-semibold tracking-tight leading-[1.0]">
              <motion.span
                className="text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: EASE_PREMIUM }}
              >
                You're in,
              </motion.span>
              <br />
              <motion.span
                className="text-gold-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: EASE_PREMIUM }}
              >
                {firstName}.
              </motion.span>
            </h1>
          </motion.div>
        )}

        {/* STEP 2: Identity Summary */}
        {step === 'identity' && (
          <motion.div
            key="identity"
            className="text-center cursor-pointer px-8 max-w-lg"
            onClick={handleClick}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: EASE_PREMIUM }}
          >
            <motion.p
              className="text-white/40 text-label uppercase tracking-[0.2em] mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              Your campus identity
            </motion.p>

            <div className="space-y-4">
              {major && (
                <motion.div
                  className="flex items-center justify-center gap-3 text-title text-white/80"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: EASE_PREMIUM }}
                >
                  <GraduationCap className="w-5 h-5 text-white/40" />
                  <span>{major}</span>
                </motion.div>
              )}

              {graduationYear && (
                <motion.div
                  className="flex items-center justify-center gap-3 text-title text-white/80"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35, duration: 0.5, ease: EASE_PREMIUM }}
                >
                  <span className="text-white/40">Class of</span>
                  <span className="text-gold-500">{graduationYear}</span>
                </motion.div>
              )}
            </div>

            <motion.p
              className="text-body text-white/30 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              Three spaces define your campus shape
            </motion.p>
          </motion.div>
        )}

        {/* STEP 3: Identity Spaces */}
        {step === 'spaces' && (
          <motion.div
            key="spaces"
            className="text-center px-8 max-w-2xl w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: EASE_PREMIUM }}
          >
            <motion.p
              className="text-white/40 text-label uppercase tracking-[0.2em] mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              Claim Your Territory
            </motion.p>

            <motion.h2
              className="text-[2rem] md:text-[2.5rem] font-semibold text-white/90 tracking-tight mb-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: EASE_PREMIUM }}
            >
              Three dimensions shape you
            </motion.h2>

            {/* Identity Space Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <IdentitySpaceCard
                icon={<GraduationCap className="w-6 h-6" />}
                label="Major"
                description="Your academic home"
                delay={0.2}
                claimed={!!major}
                claimedValue={major || undefined}
                onClick={() => setClaimModalType('major')}
              />
              <IdentitySpaceCard
                icon={<Home className="w-6 h-6" />}
                label="Residence"
                description="Where you live"
                delay={0.3}
                claimed={!!claimedResidence}
                claimedValue={claimedResidence || undefined}
                onClick={() => setClaimModalType('residential')}
              />
              <IdentitySpaceCard
                icon={<Users className="w-6 h-6" />}
                label="Greek"
                description="Your letters"
                delay={0.4}
                optional
                claimed={!!claimedGreek}
                claimedValue={claimedGreek || undefined}
                onClick={() => setClaimModalType('greek')}
              />
            </div>

            {/* Enter HQ Button */}
            <motion.button
              onClick={handleEnterHQ}
              className={cn(
                'px-8 py-4 rounded-xl font-medium transition-all duration-300',
                'bg-white text-[var(--color-bg-void,#0A0A09)]',
                'hover:bg-white/90 active:opacity-80',
                'flex items-center gap-3 mx-auto'
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, ease: EASE_PREMIUM }}
            >
              Enter Your HQ
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <motion.p
              className="text-label text-white/20 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              You can claim spaces anytime
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3">
        {(['greeting', 'identity', 'spaces'] as WelcomeStep[]).map((s, i) => {
          const isActive = step === s;
          const isPast =
            (s === 'greeting' && (step === 'identity' || step === 'spaces')) ||
            (s === 'identity' && step === 'spaces');

          return (
            <div
              key={s}
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                isActive ? 'w-8 bg-gold-500' : 'w-1.5',
                isPast ? 'bg-gold-500/50' : 'bg-white/20'
              )}
            />
          );
        })}
      </div>

      {/* Identity Claim Modal */}
      <IdentityClaimModal
        type={claimModalType}
        isOpen={!!claimModalType}
        onClose={() => setClaimModalType(null)}
        onClaim={handleClaim}
      />
    </motion.div>
  );
}

// ============================================================
// Identity Space Card
// ============================================================

interface IdentitySpaceCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  delay: number;
  claimed?: boolean;
  claimedValue?: string;
  optional?: boolean;
  onClick?: () => void;
}

function IdentitySpaceCard({
  icon,
  label,
  description,
  delay,
  claimed,
  claimedValue,
  optional,
  onClick,
}: IdentitySpaceCardProps) {
  const isClickable = !claimed && onClick;

  return (
    <motion.div
      className={cn(
        'p-5 rounded-xl text-center transition-all duration-300',
        'border-2',
        claimed
          ? 'border-gold-500/30 bg-gold-500/[0.03]'
          : 'border-white/[0.06] bg-white/[0.02]',
        isClickable && 'cursor-pointer hover:border-white/20 hover:bg-white/[0.04]'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: EASE_PREMIUM }}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3',
          claimed ? 'bg-gold-500/10 text-gold-500' : 'bg-white/[0.04] text-white/40'
        )}
      >
        {icon}
      </div>
      <p
        className={cn(
          'text-body-sm font-medium mb-1',
          claimed ? 'text-gold-500' : 'text-white/60'
        )}
      >
        {label}
        {optional && <span className="text-white/30 ml-1">(optional)</span>}
      </p>
      {claimed && claimedValue ? (
        <p className="text-label text-white/50">{claimedValue}</p>
      ) : (
        <p className="text-label text-white/30">{description}</p>
      )}
    </motion.div>
  );
}
