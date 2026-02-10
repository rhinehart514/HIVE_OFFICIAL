'use client';

/**
 * SpaceCreationModal — Narrative creation wizard
 *
 * DRAMA.md ritual, not form. Steps flow as modal transitions.
 * Peak moment: Handle claim with "It's yours." gold reveal.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Users, Lock, Globe, Compass, Briefcase, GraduationCap } from 'lucide-react';
import {
  Button,
  Input,
  HandleInput,
  MOTION,
  WordReveal,
  ThresholdReveal,
  useDramaticHandleCheck,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface SpaceCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'template' | 'identity' | 'access' | 'launch';

const TEMPLATES = [
  { id: 'club', label: 'Club / Organization', icon: Users, desc: 'For student groups and organizations' },
  { id: 'study', label: 'Study Group', icon: GraduationCap, desc: 'Academic collaboration space' },
  { id: 'interest', label: 'Interest Group', icon: Compass, desc: 'Connect over shared interests' },
  { id: 'project', label: 'Project Team', icon: Briefcase, desc: 'Collaborate on a specific project' },
];

const ACCESS_OPTIONS = [
  { id: 'open', label: 'Open', icon: Globe, desc: 'Anyone can join instantly' },
  { id: 'approval', label: 'Approval', icon: Users, desc: 'Request to join, you approve' },
  { id: 'invite_only', label: 'Invite Only', icon: Lock, desc: 'Only invited members can join' },
];

export function SpaceCreationModal({ isOpen, onClose }: SpaceCreationModalProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>('template');
  const [template, setTemplate] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [access, setAccess] = React.useState<string>('open');
  const [isCreating, setIsCreating] = React.useState(false);
  const [createdSpace, setCreatedSpace] = React.useState<{ handle: string; slug: string } | null>(null);

  const {
    handle,
    setHandle,
    status: handleStatus,
    isAvailable,
    statusMessage,
    reset: resetHandle,
  } = useDramaticHandleCheck();

  const canProceedFromIdentity = name.trim().length > 0 && isAvailable;

  const handleCreate = async () => {
    if (!canProceedFromIdentity || !template) return;

    setIsCreating(true);
    setStep('launch');

    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: `A ${template} space created on HIVE.`,
          category: 'student_org',
          joinPolicy: access,
          tags: [template],
          agreedToGuidelines: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to create space');
      }

      const data = await response.json();
      setCreatedSpace({ handle: data.space.slug, slug: data.space.slug });
    } catch (error) {
      logger.error('Space creation failed', error instanceof Error ? error : new Error(String(error)));
      setStep('identity');
      setIsCreating(false);
    }
  };

  const handleEnterSpace = () => {
    if (createdSpace) {
      router.push(`/s/${createdSpace.slug}`);
      onClose();
    }
  };

  const handleClose = () => {
    if (isCreating && !createdSpace) return;
    setStep('template');
    setTemplate(null);
    setName('');
    setAccess('open');
    resetHandle();
    setCreatedSpace(null);
    setIsCreating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 "
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg bg-[var(--bg-ground)] border border-white/[0.06] rounded-lg overflow-hidden"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
        >
          {/* Header */}
          {step !== 'launch' && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <button
                onClick={step === 'template' ? handleClose : () => setStep(step === 'access' ? 'identity' : 'template')}
                className="text-white/50 hover:text-white/50 text-sm transition-colors"
              >
                {step === 'template' ? 'Cancel' : 'Back'}
              </button>
              <span className="text-white/50 text-sm">
                {step === 'template' ? '1' : step === 'identity' ? '2' : '3'} of 3
              </span>
              <button onClick={handleClose} className="text-white/50 hover:text-white/50 transition-colors">
                <X size={20} />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Template */}
              {step === 'template' && (
                <motion.div
                  key="template"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-title-lg font-semibold text-white mb-2">
                      What are you building?
                    </h2>
                    <p className="text-white/50">Choose a template to get started</p>
                  </div>

                  <div className="space-y-3">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTemplate(t.id);
                          setStep('identity');
                        }}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-lg transition-all',
                          'hover:bg-white/[0.06] hover:border-white/[0.06]',
                          template === t.id
                            ? 'border-white/[0.06] bg-white/[0.06]'
                            : 'border-white/[0.06]'
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                          <t.icon size={20} className="text-white/50" />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{t.label}</p>
                          <p className="text-white/50 text-sm">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Identity (THE PEAK) */}
              {step === 'identity' && (
                <motion.div
                  key="identity"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-title-lg font-semibold text-white mb-2">
                      Name your space
                    </h2>
                    <p className="text-white/50">Choose wisely — this is your territory</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/50 mb-2">Name</label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="UB Consulting Club"
                        size="lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-white/50 mb-2">Handle</label>
                      <HandleInput
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        status={handleStatus}
                        statusMessage={statusMessage}
                        placeholder="ubconsulting"
                        size="lg"
                      />
                    </div>
                  </div>

                  <Button
                    variant="default"
                    size="lg"
                    className="w-full mt-6"
                    disabled={!canProceedFromIdentity}
                    onClick={() => setStep('access')}
                  >
                    Continue
                  </Button>
                </motion.div>
              )}

              {/* Step 3: Access */}
              {step === 'access' && (
                <motion.div
                  key="access"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-title-lg font-semibold text-white mb-2">
                      Who can join?
                    </h2>
                    <p className="text-white/50">You can change this anytime</p>
                  </div>

                  <div className="space-y-3">
                    {ACCESS_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setAccess(opt.id)}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-lg transition-all',
                          access === opt.id
                            ? 'border-white/50 bg-white/[0.06]'
                            : 'border-white/[0.06] hover:border-white/15'
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                          <opt.icon size={20} className="text-white/50" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-white font-medium">{opt.label}</p>
                          <p className="text-white/50 text-sm">{opt.desc}</p>
                        </div>
                        {access === opt.id && (
                          <Check size={20} className="text-white/50" />
                        )}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="cta"
                    size="lg"
                    className="w-full mt-6"
                    onClick={handleCreate}
                  >
                    Create Space
                  </Button>
                </motion.div>
              )}

              {/* Step 4: Launch (THE RELEASE) */}
              {step === 'launch' && (
                <motion.div
                  key="launch"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-8"
                >
                  <ThresholdReveal
                    isReady={!!createdSpace}
                    preparingMessage="Creating your space..."
                    pauseDuration={800}
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* Gold checkmark */}
                      <motion.div
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
                        style={{
                          background: 'linear-gradient(135deg, #FFD700, #B8860B)',
                          boxShadow: '0 0 40px rgba(255,215,0,0.3)',
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      >
                        <Check className="w-10 h-10 text-black" strokeWidth={3} />
                      </motion.div>

                      {/* Word-by-word reveal */}
                      <h2
                        className="text-heading font-semibold mb-4"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        <WordReveal
                          text="Your territory is ready."
                          variant="default"
                          delay={0.2}
                        />
                      </h2>

                      {/* Handle in gold */}
                      <motion.p
                        className="text-title-sm text-[#FFD700] font-medium mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        @{createdSpace?.slug || handle} is live
                      </motion.p>

                      {/* Enter button */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                      >
                        <Button
                          variant="cta"
                          size="lg"
                          onClick={handleEnterSpace}
                          className="px-12"
                        >
                          Enter Your Space
                        </Button>
                      </motion.div>
                    </div>
                  </ThresholdReveal>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SpaceCreationModal;
