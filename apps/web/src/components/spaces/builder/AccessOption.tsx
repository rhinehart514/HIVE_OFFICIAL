'use client';

/**
 * AccessOption - Radio option for space privacy settings
 *
 * Features:
 * - Icon + title + description
 * - Radio selection style
 * - Clear privacy implications
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { GlassSurface, MOTION } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export type PrivacyLevel = 'open' | 'approval' | 'invite';

export interface AccessOptionData {
  id: PrivacyLevel;
  name: string;
  description: string;
  icon: string;
}

export interface AccessOptionProps {
  option: AccessOptionData;
  selected: boolean;
  onSelect: (option: AccessOptionData) => void;
}

export function AccessOption({ option, selected, onSelect }: AccessOptionProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(option)}
      className="w-full text-left"
      whileTap={{ scale: 0.99 }}
    >
      <GlassSurface
        intensity="subtle"
        className={cn(
          'p-4 rounded-xl transition-all duration-200',
          selected
            ? 'border-2 border-[var(--life-gold)]/40 bg-[var(--life-gold)]/5'
            : 'border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]'
        )}
      >
        <div className="flex items-center gap-4">
          {/* Radio Circle */}
          <div
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
              selected
                ? 'border-[var(--life-gold)] bg-[var(--life-gold)]'
                : 'border-white/20'
            )}
          >
            {selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-full bg-[var(--bg-ground)]"
              />
            )}
          </div>

          {/* Icon */}
          <div className="text-xl">{option.icon}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                'text-[14px] font-medium',
                selected ? 'text-[var(--life-gold)]' : 'text-white'
              )}
            >
              {option.name}
            </h3>
            <p className="text-[12px] text-white/40 mt-0.5">
              {option.description}
            </p>
          </div>
        </div>
      </GlassSurface>
    </motion.button>
  );
}

// ============================================
// ACCESS OPTIONS
// ============================================

export const ACCESS_OPTIONS: AccessOptionData[] = [
  {
    id: 'open',
    name: 'Open',
    description: 'Anyone can join without approval',
    icon: '🌐',
  },
  {
    id: 'approval',
    name: 'Request to Join',
    description: 'Members need approval to join',
    icon: '✋',
  },
  {
    id: 'invite',
    name: 'Invite Only',
    description: 'Only invited members can join',
    icon: '🔒',
  },
];
