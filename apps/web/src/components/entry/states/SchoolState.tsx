'use client';

/**
 * SchoolState - Campus Selection Step
 *
 * First step in the entry flow. User selects their campus.
 * - Active schools proceed to email entry
 * - Coming Soon schools show notification signup
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  stateVariants,
  childVariants,
  EASE_PREMIUM,
  DURATION,
} from '../motion/entry-motion';

export interface School {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  location: string;
  status: 'active' | 'waitlist' | 'beta';
  /** Brand color for logo background */
  color: string;
}

export interface SchoolStateProps {
  /** Selected school */
  school: School | null;
  /** School change handler */
  onSchoolSelect: (school: School) => void;
  /** Error message */
  error: string | null;
  /** Loading state */
  isLoading: boolean;
}

// Schools with their brand colors
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
    id: 'nyu',
    name: 'New York University',
    shortName: 'NYU',
    domain: 'nyu.edu',
    location: 'New York, NY',
    status: 'waitlist',
    color: '#57068c',
  },
  {
    id: 'cornell',
    name: 'Cornell University',
    shortName: 'CU',
    domain: 'cornell.edu',
    location: 'Ithaca, NY',
    status: 'waitlist',
    color: '#B31B1B',
  },
];

export function SchoolState({
  school,
  onSchoolSelect,
  error,
  isLoading,
}: SchoolStateProps) {
  const [notifyEmail, setNotifyEmail] = React.useState('');
  const [notifySchool, setNotifySchool] = React.useState<School | null>(null);
  const [notifySuccess, setNotifySuccess] = React.useState(false);

  const handleComingSoonClick = (s: School) => {
    setNotifySchool(s);
    setNotifyEmail('');
    setNotifySuccess(false);
  };

  const handleNotifySubmit = async () => {
    if (!notifyEmail.trim() || !notifySchool) return;

    // Submit to notification list (fire and forget)
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
    } catch (err) {
      // Continue anyway
    }

    setNotifySuccess(true);
    setTimeout(() => {
      setNotifySchool(null);
      setNotifySuccess(false);
    }, 2000);
  };

  return (
    <motion.div
      variants={stateVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={childVariants} className="space-y-3">
        <h1 className="text-heading-sm font-semibold tracking-tight text-white">
          Select your campus
        </h1>
        <p className="text-body leading-relaxed text-white/50">
          Choose where you belong
        </p>
      </motion.div>

      {/* Schools list */}
      <motion.div variants={childVariants} className="space-y-3">
        {AVAILABLE_SCHOOLS.map((s) => {
          const isActive = s.status === 'active';
          const isSelected = school?.id === s.id;

          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
              onClick={() => isActive ? onSchoolSelect(s) : handleComingSoonClick(s)}
              disabled={isLoading}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all',
                'border bg-white/[0.02]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-ground)]',
                isActive
                  ? 'hover:bg-white/[0.04] cursor-pointer'
                  : 'cursor-pointer hover:bg-white/[0.03]',
                isSelected
                  ? 'border-white/20 bg-white/[0.06]'
                  : 'border-white/[0.06]'
              )}
            >
              {/* School logo (styled initials) */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: s.color }}
              >
                <span className="text-white font-bold text-sm tracking-tight">
                  {s.shortName}
                </span>
              </div>

              {/* School info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-body font-medium truncate',
                      isActive ? 'text-white' : 'text-white/60'
                    )}
                  >
                    {s.name}
                  </span>
                </div>
                <p className="text-body-sm text-white/40 mt-0.5">
                  {s.location}
                </p>
              </div>

              {/* Arrow or Coming Soon */}
              {isActive ? (
                <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
              ) : (
                <span className="px-3 py-1 text-label-sm font-medium rounded-full bg-white/[0.06] text-white/40 flex-shrink-0">
                  Coming Soon
                </span>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Notification modal for Coming Soon schools */}
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
              className="w-full max-w-sm p-6 rounded-2xl bg-[#141413] border border-white/[0.08]"
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
                  {/* School logo */}
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
                    <button
                      onClick={handleNotifySubmit}
                      disabled={!notifyEmail.trim()}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all',
                        notifyEmail.trim()
                          ? 'bg-white text-black hover:bg-white/90'
                          : 'bg-white/10 text-white/30 cursor-not-allowed'
                      )}
                    >
                      <Bell className="w-4 h-4" />
                      Notify me
                    </button>
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
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: DURATION.fast, ease: EASE_PREMIUM }}
          >
            <p className="text-sm text-red-400/90">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

SchoolState.displayName = 'SchoolState';
