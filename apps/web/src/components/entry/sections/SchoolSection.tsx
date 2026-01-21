'use client';

/**
 * SchoolSection - Compact inline school selector
 *
 * First section in the evolving entry flow.
 * - Shows dropdown/search when active
 * - Collapses to badge chip when locked
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Bell, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  sectionEnterVariants,
  sectionChildVariants,
  shakeVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { DURATION, EASE_PREMIUM, GOLD } from '../motion/entry-motion';
import { SchoolBadgeChip } from '../primitives/LockedFieldChip';
import type { School, SectionState } from '../hooks/useEvolvingEntry';

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

export { AVAILABLE_SCHOOLS };

interface SchoolSectionProps {
  section: SectionState;
  school: School | null;
  onSchoolSelect: (school: School) => void;
  onConfirm: () => void;
  onEdit: () => void;
}

export function SchoolSection({
  section,
  school,
  onSchoolSelect,
  onConfirm,
  onEdit,
}: SchoolSectionProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifyEmail, setNotifyEmail] = React.useState('');
  const [notifySchool, setNotifySchool] = React.useState<School | null>(null);
  const [notifySuccess, setNotifySuccess] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSchoolClick = (s: School) => {
    if (s.status === 'active') {
      onSchoolSelect(s);
      setIsOpen(false);
      // Auto-confirm after selection
      setTimeout(() => {
        onConfirm();
      }, 100);
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

  const isLocked = section.status === 'locked' || section.status === 'complete';
  const isActive = section.status === 'active';
  const hasError = !!section.error;

  // Locked state - show badge chip
  if (isLocked && school) {
    return (
      <div className="space-y-2">
        <p className="text-[13px] text-white/40">Campus</p>
        <SchoolBadgeChip
          schoolName={school.name}
          schoolShortName={school.shortName}
          schoolColor={school.color}
          allowChange={true}
          onChangeClick={onEdit}
        />
      </div>
    );
  }

  // Active state - show selector
  return (
    <motion.div
      variants={sectionEnterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-4"
    >
      <motion.div variants={sectionChildVariants}>
        <p className="text-[13px] text-white/40 mb-2">Campus</p>

        {/* Dropdown trigger */}
        <motion.div
          ref={dropdownRef}
          className="relative"
          variants={shakeVariants}
          animate={hasError ? 'shake' : 'idle'}
        >
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'w-full flex items-center gap-3 h-14 px-4',
              'bg-white/[0.04] border rounded-xl',
              'text-left transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
              isOpen ? 'border-white/20' : 'border-white/[0.08]',
              hasError && 'border-red-400/50'
            )}
          >
            {school ? (
              <>
                {/* Selected school */}
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: school.color }}
                >
                  <span className="text-white font-bold text-[10px]">
                    {school.shortName}
                  </span>
                </div>
                <span className="flex-1 text-white text-[15px] font-medium truncate">
                  {school.name}
                </span>
              </>
            ) : (
              <span className="flex-1 text-white/40 text-[15px]">
                Select your school
              </span>
            )}
            <ChevronDown
              className={cn(
                'w-5 h-5 text-white/40 transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: DURATION.quick, ease: EASE_PREMIUM }}
                className="absolute top-full left-0 right-0 mt-2 z-50 py-2 bg-[#1a1a19] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden"
              >
                {AVAILABLE_SCHOOLS.map((s) => {
                  const isAvailable = s.status === 'active';
                  const isSelected = school?.id === s.id;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSchoolClick(s)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-all',
                        isAvailable
                          ? 'hover:bg-white/[0.04]'
                          : 'hover:bg-white/[0.02]',
                        isSelected && 'bg-white/[0.06]'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0',
                          !isAvailable && 'opacity-60'
                        )}
                        style={{ backgroundColor: s.color }}
                      >
                        <span className="text-white font-bold text-[10px]">
                          {s.shortName}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <span
                          className={cn(
                            'text-[14px] font-medium block truncate',
                            isAvailable ? 'text-white' : 'text-white/50'
                          )}
                        >
                          {s.name}
                        </span>
                        <span className="text-[12px] text-white/40">
                          {s.location}
                        </span>
                      </div>

                      {isAvailable ? (
                        isSelected ? (
                          <Check
                            size={16}
                            style={{ color: GOLD.primary }}
                            className="flex-shrink-0"
                          />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                        )
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-white/[0.06] text-white/40 flex-shrink-0">
                          Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Inline error */}
      <AnimatePresence>
        {hasError && (
          <motion.p
            variants={errorInlineVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-[13px] text-red-400/90"
          >
            {section.error}
          </motion.p>
        )}
      </AnimatePresence>

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
    </motion.div>
  );
}

SchoolSection.displayName = 'SchoolSection';
