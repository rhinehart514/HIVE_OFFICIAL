'use client';

import { motion } from 'framer-motion';
import { Users, Compass } from 'lucide-react';
import { Button } from '@hive/ui';
import {
  staggerContainer,
  staggerItem,
  transitionSilk,
  transitionSpring,
} from '@/lib/motion-primitives';

interface LeaderStepProps {
  onChoice: (isLeader: boolean) => void;
}

export function LeaderStep({ onChoice }: LeaderStepProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Context */}
      <motion.div
        variants={staggerItem}
        transition={transitionSilk}
        className="text-center space-y-2"
      >
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 mb-2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...transitionSpring, delay: 0.2 }}
        >
          <Users className="w-8 h-8 text-gold-500" />
        </motion.div>
        <p className="text-sm text-neutral-400">
          Leaders get tools to manage their club's space,
          <br />
          invite members, and post updates.
        </p>
      </motion.div>

      {/* Primary CTA - Leader */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <Button
          onClick={() => onChoice(true)}
          leadingIcon={<Users className="h-5 w-5" />}
          showArrow
          fullWidth
          size="lg"
        >
          Yes, I lead a club
        </Button>
      </motion.div>

      {/* Secondary CTA - Explorer */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <Button
          variant="secondary"
          onClick={() => onChoice(false)}
          leadingIcon={<Compass className="h-5 w-5" />}
          fullWidth
          size="lg"
        >
          No, just exploring
        </Button>
      </motion.div>

      {/* Note */}
      <motion.p
        variants={staggerItem}
        transition={transitionSilk}
        className="text-xs text-center text-neutral-600"
      >
        You can claim a space later from your profile
      </motion.p>
    </motion.div>
  );
}
