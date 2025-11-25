"use client";

import { motion } from "framer-motion";
import { Button } from "@hive/ui";
import { staggerContainer, staggerItem, transition } from "../shared/animations";

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
      className="space-y-4"
    >
      <motion.div variants={staggerItem} transition={transition}>
        <Button
          type="button"
          onClick={() => onChoice(true)}
          className="w-full h-12 bg-[#FFD700] text-black hover:brightness-110 font-semibold text-sm transition-all"
          style={{ boxShadow: "0 0 30px rgba(255, 215, 0, 0.15)" }}
        >
          Yes, I lead a club
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} transition={transition}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onChoice(false)}
          className="w-full h-12 text-base font-medium bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800"
        >
          No, just exploring
        </Button>
      </motion.div>
    </motion.div>
  );
}
