'use client';

/**
 * RoleCard - Premium role selection card
 *
 * Visual card with icon, gold selection border, and hover effects.
 * Used in RoleSection for selecting user role.
 */

import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, Users, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE_PREMIUM } from '../motion/entry-motion';

type RoleType = 'student' | 'faculty' | 'alumni';

interface RoleConfig {
  icon: LucideIcon;
  label: string;
  description: string;
  badge?: string;
}

const ROLE_CONFIG: Record<RoleType, RoleConfig> = {
  student: {
    icon: GraduationCap,
    label: 'Student',
    description: 'Currently enrolled',
  },
  faculty: {
    icon: Briefcase,
    label: 'Faculty',
    description: 'Staff or instructor',
  },
  alumni: {
    icon: Users,
    label: 'Alumni',
    description: 'Graduated',
    badge: 'Coming Soon',
  },
};

interface RoleCardProps {
  role: RoleType;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function RoleCard({ role, selected, onSelect, disabled = false }: RoleCardProps) {
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: EASE_PREMIUM }}
      className={cn(
        'flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl transition-all duration-200',
        'border text-center',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
        selected
          ? 'border-[var(--color-gold)]/30 bg-white/[0.06] shadow-[0_0_20px_rgba(255,215,0,0.1)]'
          : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <motion.div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
          selected ? 'bg-[var(--color-gold)]/10' : 'bg-white/[0.04]'
        )}
        animate={{
          backgroundColor: selected
            ? 'rgba(255, 215, 0, 0.1)'
            : 'rgba(255, 255, 255, 0.04)',
        }}
        transition={{ duration: 0.2 }}
      >
        <Icon
          className={cn(
            'w-6 h-6 transition-colors',
            selected ? 'text-[var(--color-gold)]' : 'text-white/50'
          )}
        />
      </motion.div>

      <div className="space-y-1">
        <span
          className={cn(
            'text-body font-medium block transition-colors',
            selected ? 'text-white' : 'text-white/70'
          )}
        >
          {config.label}
        </span>
        <span className="text-body-sm text-white/40 block">
          {config.description}
        </span>
        {config.badge && (
          <span className="text-label-xs text-white/30 block mt-1">
            {config.badge}
          </span>
        )}
      </div>
    </motion.button>
  );
}

RoleCard.displayName = 'RoleCard';
