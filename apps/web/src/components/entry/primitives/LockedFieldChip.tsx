'use client';

/**
 * LockedFieldChip - Collapsed completed field display
 *
 * Shows a completed field as a compact, read-only chip with:
 * - Value display with truncation
 * - Gold checkmark indicator
 * - Optional "change" action
 * - School color accent (for school chips)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pencil } from 'lucide-react';
import { chipCheckVariants, chipContentVariants } from '../motion/variants';
import { GOLD } from '../motion/constants';

interface LockedFieldChipProps {
  /** The locked value to display */
  value: string;
  /** Optional label prefix (e.g., "School", "Email") */
  label?: string;
  /** Whether to show the change action */
  allowChange?: boolean;
  /** Callback when user clicks change */
  onChangeClick?: () => void;
  /** Accent color (hex) for the left border/badge */
  accentColor?: string;
  /** Icon to show instead of checkmark */
  icon?: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function LockedFieldChip({
  value,
  label,
  allowChange = false,
  onChangeClick,
  accentColor,
  icon,
  className = '',
}: LockedFieldChipProps) {
  const hasAccent = !!accentColor;

  return (
    <motion.div
      className={`
        relative flex items-center gap-3 h-10 px-3
        bg-white/[0.06] border border-white/[0.06] rounded-lg
        ${hasAccent ? 'pl-0 overflow-hidden' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      layout
    >
      {/* Accent stripe (for school) */}
      {hasAccent && (
        <div
          className="w-1 h-full shrink-0"
          style={{ backgroundColor: accentColor }}
        />
      )}

      {/* Checkmark or custom icon */}
      <motion.div
        className="shrink-0"
        variants={chipCheckVariants}
        initial="initial"
        animate="animate"
      >
        {icon || (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: GOLD.glowSubtle }}
          >
            <Check
              size={12}
              strokeWidth={3}
              style={{ color: GOLD.primary }}
            />
          </div>
        )}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          className="flex-1 min-w-0 flex items-center gap-2"
          variants={chipContentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {label && (
            <span className="text-white/50 text-body-sm shrink-0">
              {label}
            </span>
          )}
          <span className="text-white text-body font-medium truncate">
            {value}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Change action */}
      {allowChange && onChangeClick && (
        <button
          type="button"
          onClick={onChangeClick}
          className="
            shrink-0 text-white/50 hover:text-white/50
            transition-colors text-body-sm flex items-center gap-1
            focus:outline-none focus:text-white/50
          "
        >
          <Pencil size={12} />
          <span className="hidden sm:inline">change</span>
        </button>
      )}
    </motion.div>
  );
}

/**
 * SchoolBadgeChip - Special variant for school with logo
 */
interface SchoolBadgeChipProps {
  schoolName: string;
  schoolShortName?: string;
  schoolColor: string;
  allowChange?: boolean;
  onChangeClick?: () => void;
  className?: string;
}

export function SchoolBadgeChip({
  schoolName,
  schoolShortName,
  schoolColor,
  allowChange = false,
  onChangeClick,
  className = '',
}: SchoolBadgeChipProps) {
  return (
    <motion.div
      className={`
        relative flex items-center gap-3 h-10 px-3
        bg-white/[0.06] border border-white/[0.06] rounded-lg
        overflow-hidden
        ${className}
      `}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      layout
    >
      {/* School color badge */}
      <div
        className="
          shrink-0 w-6 h-6 rounded-md flex items-center justify-center
          text-label-xs font-bold text-white
        "
        style={{ backgroundColor: schoolColor }}
      >
        {schoolShortName?.slice(0, 2).toUpperCase() || schoolName.slice(0, 2).toUpperCase()}
      </div>

      {/* School name */}
      <span className="flex-1 text-white text-body font-medium truncate">
        {schoolName}
      </span>

      {/* Checkmark */}
      <motion.div
        variants={chipCheckVariants}
        initial="initial"
        animate="animate"
      >
        <Check
          size={14}
          strokeWidth={3}
          style={{ color: GOLD.primary }}
        />
      </motion.div>

      {/* Change action */}
      {allowChange && onChangeClick && (
        <button
          type="button"
          onClick={onChangeClick}
          className="
            shrink-0 text-white/50 hover:text-white/50
            transition-colors text-body-sm
            focus:outline-none focus:text-white/50
          "
        >
          change
        </button>
      )}
    </motion.div>
  );
}

/**
 * RoleChip - Compact role indicator
 */
interface RoleChipProps {
  role: string;
  allowChange?: boolean;
  onChangeClick?: () => void;
  className?: string;
}

export function RoleChip({
  role,
  allowChange = false,
  onChangeClick,
  className = '',
}: RoleChipProps) {
  const roleLabels: Record<string, string> = {
    student: 'Student',
    faculty: 'Faculty',
    alumni: 'Alumni',
  };

  return (
    <motion.div
      className={`
        relative flex items-center gap-2 h-10 px-3
        bg-white/[0.06] border border-white/[0.06] rounded-lg
        ${className}
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      layout
    >
      <motion.div
        variants={chipCheckVariants}
        initial="initial"
        animate="animate"
      >
        <Check
          size={14}
          strokeWidth={3}
          style={{ color: GOLD.primary }}
        />
      </motion.div>

      <span className="text-white text-body font-medium">
        {roleLabels[role] || role}
      </span>

      {allowChange && onChangeClick && (
        <button
          type="button"
          onClick={onChangeClick}
          className="
            ml-auto shrink-0 text-white/50 hover:text-white/50
            transition-colors text-body-sm
            focus:outline-none focus:text-white/50
          "
        >
          change
        </button>
      )}
    </motion.div>
  );
}
