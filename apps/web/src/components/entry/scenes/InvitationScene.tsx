'use client';

/**
 * InvitationScene - "We don't let everyone in."
 *
 * Act I, Scene 1: School Selection
 * The user proves they belong by selecting their school.
 *
 * Headline: "We don't let everyone in."
 * Subtext: "Only builders." (word-by-word)
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { ManifestoLine } from '../primitives/ManifestoLine';
import {
  sceneMorphVariants,
  sceneChildVariants,
  headlineVariants,
  subtextVariants,
} from '../motion/scene-transitions';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import type { School } from '../hooks/useEvolvingEntry';

// Available schools - UB active, other SUNY schools coming soon
const AVAILABLE_SCHOOLS: School[] = [
  {
    id: 'ub-buffalo',
    name: 'University at Buffalo',
    shortName: 'UB',
    domain: 'buffalo.edu',
    location: 'Buffalo, NY',
    status: 'active',
    color: '#005BBB',
  },
  {
    id: 'stonybrook',
    name: 'Stony Brook University',
    shortName: 'SBU',
    domain: 'stonybrook.edu',
    location: 'Stony Brook, NY',
    status: 'waitlist',
    color: '#990000',
  },
  {
    id: 'binghamton',
    name: 'Binghamton University',
    shortName: 'BING',
    domain: 'binghamton.edu',
    location: 'Binghamton, NY',
    status: 'waitlist',
    color: '#006747',
  },
  {
    id: 'albany',
    name: 'University at Albany',
    shortName: 'UAlbany',
    domain: 'albany.edu',
    location: 'Albany, NY',
    status: 'waitlist',
    color: '#46166B',
  },
];

interface InvitationSceneProps {
  school: School | null;
  onSchoolSelect: (school: School) => void;
  onContinue: () => void;
  error?: string;
}

export function InvitationScene({
  school,
  onSchoolSelect,
  onContinue,
  error,
}: InvitationSceneProps) {
  const shouldReduceMotion = useReducedMotion();
  const [selectedSchoolId, setSelectedSchoolId] = React.useState(school?.id || null);
  const [notifySchool, setNotifySchool] = React.useState<School | null>(null);
  const [notifyEmail, setNotifyEmail] = React.useState('');
  const [notifySuccess, setNotifySuccess] = React.useState(false);

  const activeSchools = AVAILABLE_SCHOOLS.filter((s) => s.status === 'active');
  const waitlistSchools = AVAILABLE_SCHOOLS.filter((s) => s.status === 'waitlist');

  const handleSchoolClick = (s: School) => {
    if (s.status === 'active') {
      setSelectedSchoolId(s.id);
      onSchoolSelect(s);
    } else {
      setNotifySchool(s);
      setNotifyEmail('');
      setNotifySuccess(false);
    }
  };

  const handleNotifySubmit = async () => {
    if (!notifyEmail.trim() || !notifySchool) return;
    try {
      await fetch('/api/waitlist/school-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail,
          schoolId: notifySchool.id,
          schoolName: notifySchool.name,
        }),
      });
    } catch {
      // Continue anyway
    }
    setNotifySuccess(true);
    setTimeout(() => {
      setNotifySchool(null);
      setNotifySuccess(false);
    }, 2000);
  };

  const handleContinue = () => {
    if (selectedSchoolId) {
      onContinue();
    }
  };

  return (
    <motion.div
      variants={sceneMorphVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
    >
      {/* Headline */}
      <motion.div variants={sceneChildVariants} className="space-y-3">
        <motion.h1
          variants={headlineVariants}
          className="text-title-lg font-semibold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          We don't let everyone in.
        </motion.h1>

        <motion.p
          variants={subtextVariants}
          className="text-body-lg text-white/50"
        >
          <ManifestoLine delay={0.4} stagger={0.12}>
            Only builders.
          </ManifestoLine>
        </motion.p>
      </motion.div>

      {/* School selection */}
      <motion.div variants={sceneChildVariants} className="space-y-3">
        {/* Active school - UB with premium treatment */}
        {activeSchools.map((s) => {
          const isSelected = selectedSchoolId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleSchoolClick(s)}
              className={cn(
                'group relative w-full p-5 rounded-2xl text-left transition-all duration-300',
                'border-2',
                isSelected
                  ? 'bg-white/[0.04]'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
              )}
              style={{
                borderColor: isSelected ? `${s.color}99` : undefined,
              }}
            >

              <div className="relative flex items-center gap-4">
                {/* School badge */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: s.color }}
                >
                  <span className="text-white font-bold text-base tracking-tight">
                    {s.shortName}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-body-lg font-semibold text-white truncate">
                      {s.name}
                    </p>
                  </div>
                  <p className="text-body-sm text-white/50 mt-0.5">
                    {s.location}
                  </p>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-white flex items-center justify-center"
                  >
                    <svg
                      className="w-4 h-4"
                      style={{ color: s.color }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </button>
          );
        })}

        {/* Divider */}
        {waitlistSchools.length > 0 && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-label-sm text-white/30 uppercase tracking-wider">Coming Soon</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
        )}

        {/* Waitlist schools - muted treatment */}
        {waitlistSchools.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSchoolClick(s)}
            className={cn(
              'w-full p-4 rounded-xl border text-left transition-all duration-200',
              'border-white/[0.06] bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]'
            )}
          >
            <div className="flex items-center gap-4">
              {/* School color badge - smaller, desaturated */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center opacity-60"
                style={{ backgroundColor: s.color }}
              >
                <span className="text-white font-semibold text-body-sm">
                  {s.shortName.slice(0, 3)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-white/60 truncate">
                  {s.name}
                </p>
                <p className="text-body-sm text-white/30">
                  {s.location}
                </p>
              </div>

              {/* Notify button */}
              <span className="px-3 py-1 text-label-sm font-medium rounded-full bg-white/[0.04] text-white/40 flex-shrink-0">
                Notify me
              </span>
            </div>
          </button>
        ))}
      </motion.div>

      {/* Notification modal */}
      <AnimatePresence>
        {notifySchool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            onClick={() => setNotifySchool(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
              className="w-full max-w-sm p-6 rounded-2xl bg-surface border border-white/[0.08]"
              onClick={(e) => e.stopPropagation()}
            >
              {notifySuccess ? (
                <div className="text-center py-4">
                  <p className="text-white font-medium mb-2">You're on the list</p>
                  <p className="text-sm text-white/50">
                    We'll let you know when {notifySchool.shortName} goes live
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: notifySchool.color }}
                    >
                      <span className="text-white font-bold text-base">
                        {notifySchool.shortName}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white text-center mb-2">
                    {notifySchool.name}
                  </h3>
                  <p className="text-sm text-white/50 text-center mb-6">
                    Not available yet. Get notified when we launch.
                  </p>

                  <div className="space-y-3">
                    <input
                      type="email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                    />
                    <Button
                      onClick={handleNotifySubmit}
                      disabled={!notifyEmail.trim()}
                      variant="solid"
                      size="lg"
                      className="w-full"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Notify me
                    </Button>
                  </div>

                  <button
                    onClick={() => setNotifySchool(null)}
                    className="w-full mt-4 text-sm text-white/40 hover:text-white/60 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-body-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* CTA */}
      <motion.div variants={sceneChildVariants}>
        <Button
          variant="cta"
          size="lg"
          onClick={handleContinue}
          disabled={!selectedSchoolId}
          className="w-full"
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}

InvitationScene.displayName = 'InvitationScene';

export { AVAILABLE_SCHOOLS };
