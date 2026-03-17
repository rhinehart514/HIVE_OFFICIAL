'use client';

/**
 * SignupListCard — Sign up for slots with capacity limits.
 *
 * Slots with fill bars, tap to join, already-joined shows leave button.
 */

import { motion } from 'framer-motion';
import { MOTION, CARD } from '@hive/tokens';
import type { ShellComponentProps, SignupListConfig, SignupListState } from '@/lib/shells/types';

function SignupListCard({
  config,
  state,
  currentUserId,
  onAction,
  compact = true,
}: ShellComponentProps<SignupListConfig, SignupListState>) {
  const { title, slots } = config;
  const signups = state?.signups ?? {};
  const counts = state?.counts ?? {};

  const isSignedUp = (slotLabel: string) => {
    const slotSignups = signups[slotLabel] ?? [];
    return slotSignups.some((s) => s.userId === currentUserId);
  };

  const handleJoin = (slotLabel: string) => {
    if (isSignedUp(slotLabel)) return;
    onAction({ type: 'signup_join', slotLabel });
  };

  const handleLeave = (slotLabel: string) => {
    if (!isSignedUp(slotLabel)) return;
    onAction({ type: 'signup_leave', slotLabel });
  };

  return (
    <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      <p className="text-white text-sm font-medium mb-3 leading-snug">{title}</p>

      <div className="flex flex-col gap-2">
        {slots.map((slot) => {
          const count = counts[slot.label] ?? 0;
          const full = count >= slot.capacity;
          const joined = isSignedUp(slot.label);
          const fillPct = Math.min(100, Math.round((count / slot.capacity) * 100));

          return (
            <div key={slot.label} className="relative overflow-hidden rounded-xl border border-white/[0.10] bg-white/[0.03]">
              {/* Fill bar */}
              <motion.div
                className={`absolute inset-y-0 left-0 ${
                  joined ? 'bg-[#FFD700]/[0.10]' : 'bg-white/[0.05]'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${fillPct}%` }}
                transition={{ duration: MOTION.duration.standard / 1000 }}
              />

              <div className="relative flex items-center justify-between px-3 py-2.5">
                <div>
                  <span className={`text-sm ${joined ? 'text-[#FFD700] font-medium' : 'text-white/70'}`}>
                    {slot.label}
                  </span>
                  <span className="text-[11px] text-white/30 ml-2 font-mono">
                    {count}/{slot.capacity}
                  </span>
                </div>

                {joined ? (
                  <button
                    onClick={() => handleLeave(slot.label)}
                    className="text-[12px] text-white/30 hover:text-white/50 transition-colors duration-100"
                  >
                    Leave
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin(slot.label)}
                    disabled={full}
                    className={`
                      px-3 py-1 rounded-full text-[12px] font-medium transition-colors duration-100
                      ${full
                        ? 'text-white/20 cursor-default'
                        : 'border border-white/[0.10] text-white/50 hover:text-white hover:border-white/20'
                      }
                    `}
                  >
                    {full ? 'Full' : 'Join'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {config.deadline && (
        <p className="text-[11px] text-white/30 mt-3">
          Deadline: {config.deadline}
        </p>
      )}
    </div>
  );
}

export default SignupListCard;
