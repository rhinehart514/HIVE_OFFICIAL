'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, Award } from 'lucide-react';
import { Button } from '@hive/ui';
import {
  staggerContainer,
  staggerItem,
  transitionSilk,
  transitionSpring,
  GLOW_GOLD_SUBTLE,
} from '@/lib/motion-primitives';
import type { UserType } from '../shared/types';

interface UserTypeStepProps {
  onSelect: (type: UserType) => void;
}

// Campus configuration
const CAMPUS_CONFIG = {
  domain: process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN || 'buffalo.edu',
  name: process.env.NEXT_PUBLIC_CAMPUS_NAME || 'UB',
};

export function UserTypeStep({ onSelect }: UserTypeStepProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Value prop - the hook */}
      <motion.div
        variants={staggerItem}
        transition={transitionSilk}
        className="text-center space-y-3"
      >
        <motion.p
          className="text-lg text-white font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitionSilk, delay: 0.2 }}
        >
          Find your clubs. Coordinate your crew.
        </motion.p>
        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/50 border border-neutral-800/50"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...transitionSpring, delay: 0.3 }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full bg-gold-500"
            style={{ boxShadow: GLOW_GOLD_SUBTLE }}
          />
          <span className="text-xs text-neutral-400">@{CAMPUS_CONFIG.domain} exclusive</span>
        </motion.div>
      </motion.div>

      {/* Primary CTA - Student */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <Button
          onClick={() => onSelect('student')}
          leadingIcon={<GraduationCap className="h-5 w-5" />}
          showArrow
          fullWidth
          size="lg"
        >
          I'm a student
        </Button>
      </motion.div>

      {/* Divider */}
      <motion.div
        variants={staggerItem}
        transition={transitionSilk}
        className="flex items-center gap-3"
      >
        <div className="flex-1 h-px bg-neutral-800" />
        <span className="text-xs text-neutral-600">or</span>
        <div className="flex-1 h-px bg-neutral-800" />
      </motion.div>

      {/* Secondary options */}
      <motion.div
        variants={staggerItem}
        transition={transitionSilk}
        className="grid grid-cols-2 gap-3"
      >
        <Button
          variant="secondary"
          onClick={() => onSelect('faculty')}
          leadingIcon={<Briefcase className="h-4 w-4" />}
          size="md"
        >
          Faculty/Staff
        </Button>

        <Button
          variant="secondary"
          onClick={() => onSelect('alumni')}
          leadingIcon={<Award className="h-4 w-4" />}
          size="md"
        >
          Alumni
        </Button>
      </motion.div>

      {/* Trust signal */}
      <motion.p
        variants={staggerItem}
        transition={transitionSilk}
        className="text-xs text-center text-neutral-600 pt-2"
      >
        Join 2,400+ {CAMPUS_CONFIG.name} students already on HIVE
      </motion.p>
    </motion.div>
  );
}
