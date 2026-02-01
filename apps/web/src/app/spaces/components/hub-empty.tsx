'use client';

/**
 * HubEmpty - Empty state: "Where do I belong?"
 *
 * Features:
 * - Centered layout, max-width 600px
 * - ManifestoLine manifesto quote
 * - Three placeholder cards for identity (ghosted)
 * - Single CTA: "Find Your Spaces" → /spaces/browse
 * - Motion: Staggered reveal, premium easing
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import {
  motion,
  MOTION,
  Button,
} from '@hive/ui/design-system/primitives';
import { SPACES_MOTION } from '@hive/ui/tokens';

// ============================================================
// Types
// ============================================================

interface HubEmptyProps {
  onCreateSpace?: () => void;
}

// ============================================================
// Identity Placeholder Card
// ============================================================

function IdentityPlaceholder({
  type,
  index,
}: {
  type: 'major' | 'home' | 'greek';
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  const config = {
    major: {
      label: 'Major',
      hint: 'Your academic tribe',
      accent: 'text-blue-400',
    },
    home: {
      label: 'Home',
      hint: 'Your residence',
      accent: 'text-emerald-400',
    },
    greek: {
      label: 'Greek',
      hint: 'Your letters',
      accent: 'text-rose-400',
    },
  }[type];

  return (
    <motion.div
      className="flex-1 rounded-xl p-5 text-center"
      style={{
        border: '1px dashed rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.01)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        delay: shouldReduceMotion ? 0 : 0.3 + index * SPACES_MOTION.stagger.identity,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Label */}
      <span className={`text-xs font-medium uppercase tracking-wider ${config.accent}`}>
        {config.label}
      </span>

      {/* Placeholder dots */}
      <div className="flex justify-center gap-1.5 my-4">
        <span className="w-2 h-2 rounded-full bg-white/10" />
        <span className="w-2 h-2 rounded-full bg-white/10" />
        <span className="w-2 h-2 rounded-full bg-white/10" />
      </div>

      {/* Hint */}
      <p className="text-xs text-white/30 italic">
        {config.hint}
      </p>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function HubEmpty({ onCreateSpace }: HubEmptyProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[600px]">
        {/* Manifesto Quote */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.slow,
            ease: MOTION.ease.premium,
          }}
        >
          <p className="text-lg text-white/60 leading-relaxed italic">
            "Every student has a shape on campus.
            <br />
            Yours is waiting to be drawn."
          </p>
        </motion.div>

        {/* Identity Placeholders */}
        <div className="flex gap-4 mb-10">
          <IdentityPlaceholder type="major" index={0} />
          <IdentityPlaceholder type="home" index={1} />
          <IdentityPlaceholder type="greek" index={2} />
        </div>

        {/* Main CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.base,
            delay: shouldReduceMotion ? 0 : 0.6,
            ease: MOTION.ease.premium,
          }}
        >
          <Link href="/spaces/browse">
            <Button
              size="lg"
              className="bg-white/[0.08] hover:bg-white/[0.12] text-white/90 px-8"
            >
              Discover Your Spaces
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </motion.div>

        {/* Secondary action */}
        {onCreateSpace && (
          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
              delay: shouldReduceMotion ? 0 : 0.8,
              ease: MOTION.ease.premium,
            }}
          >
            <button
              onClick={onCreateSpace}
              className="text-sm text-white/30 hover:text-white/50 transition-colors"
            >
              Or create your own space →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

HubEmpty.displayName = 'HubEmpty';
