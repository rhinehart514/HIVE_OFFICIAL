'use client';

/**
 * FamiliarFaces - Mutual connections highlight
 *
 * Features:
 * - Shows if user has mutual connections in space
 * - "3 people you know are here"
 * - Avatar stack with gold pulse on hover
 * - Creates social proof for joining
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  motion,
  useInView,
  MOTION,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '@hive/ui/design-system/primitives';
import { SPACES_GOLD } from '@hive/ui/tokens';

// ============================================================
// Types
// ============================================================

interface FamiliarFace {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface FamiliarFacesProps {
  /** Array of mutual connections */
  faces: FamiliarFace[];
  /** Maximum faces to show in stack */
  maxDisplay?: number;
  /** Delay before animation starts */
  delay?: number;
}

// ============================================================
// Avatar Stack
// ============================================================

function AvatarStack({
  faces,
  maxDisplay = 3,
}: {
  faces: FamiliarFace[];
  maxDisplay: number;
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const displayFaces = faces.slice(0, maxDisplay);

  return (
    <div
      className="flex -space-x-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {displayFaces.map((face, index) => (
        <motion.div
          key={face.id}
          className="relative"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.3,
            delay: index * 0.1,
          }}
          whileHover={{ scale: 1.1, zIndex: 10 }}
        >
          <Avatar
            size="sm"
            className={`
              ring-2 ring-[#0A0A09]
              transition-all duration-200
              ${isHovered ? 'ring-[#FFD700]/30' : ''}
            `}
          >
            {face.avatarUrl && <AvatarImage src={face.avatarUrl} />}
            <AvatarFallback className="text-xs bg-white/[0.08]">
              {getInitials(face.name)}
            </AvatarFallback>
          </Avatar>

          {/* Gold pulse on hover */}
          {isHovered && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0, 0.5, 0],
                scale: [0.8, 1.3, 1.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.2,
              }}
              style={{
                background: `radial-gradient(circle, ${SPACES_GOLD.glow}, transparent 70%)`,
              }}
            />
          )}
        </motion.div>
      ))}

      {/* Overflow indicator */}
      {faces.length > maxDisplay && (
        <motion.div
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] ring-2 ring-[#0A0A09] text-xs text-white/50"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.3,
            delay: maxDisplay * 0.1,
          }}
        >
          +{faces.length - maxDisplay}
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function FamiliarFaces({
  faces,
  maxDisplay = 3,
  delay = 0,
}: FamiliarFacesProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const shouldReduceMotion = useReducedMotion();

  // Don't render if no familiar faces
  if (faces.length === 0) return null;

  const count = faces.length;
  const label = count === 1
    ? '1 person you know is here'
    : `${count} people you know are here`;

  return (
    <motion.div
      ref={ref}
      className="flex items-center gap-4 p-4 rounded-xl"
      style={{
        background: 'linear-gradient(180deg, rgba(255,215,0,0.04) 0%, rgba(255,215,0,0.01) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,215,0,0.08), 0 0 0 1px rgba(255,215,0,0.06)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        delay: shouldReduceMotion ? 0 : delay,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Avatar stack */}
      <AvatarStack faces={faces} maxDisplay={maxDisplay} />

      {/* Label */}
      <motion.p
        className="text-sm"
        style={{ color: `${SPACES_GOLD.primary}99` }}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
          delay: shouldReduceMotion ? 0 : delay + 0.3,
        }}
      >
        {label}
      </motion.p>
    </motion.div>
  );
}

FamiliarFaces.displayName = 'FamiliarFaces';
