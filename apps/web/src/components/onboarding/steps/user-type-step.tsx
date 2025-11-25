"use client";

import { motion } from "framer-motion";
import { Button } from "@hive/ui";
import { staggerContainer, staggerItem, transition } from "../shared/animations";
import type { UserType } from "../shared/types";

interface UserTypeStepProps {
  onSelect: (type: UserType) => void;
}

export function UserTypeStep({ onSelect }: UserTypeStepProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-4"
    >
      {/* Value prop */}
      <motion.div variants={staggerItem} transition={transition}>
        <p className="text-sm text-neutral-400 text-center mb-2">
          Find your clubs. Coordinate your crew.
        </p>
        <p className="text-xs text-neutral-500 text-center mb-4">
          @buffalo.edu exclusive
        </p>
      </motion.div>

      <motion.div variants={staggerItem} transition={transition}>
        <Button
          type="button"
          onClick={() => onSelect("student")}
          className="w-full h-12 bg-[#FFD700] text-black hover:brightness-110 font-semibold text-sm transition-all"
          style={{ boxShadow: "0 0 30px rgba(255, 215, 0, 0.15)" }}
        >
          I'm a student
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} transition={transition}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onSelect("faculty")}
          className="w-full h-12 text-sm font-medium bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800"
        >
          I'm faculty/staff
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} transition={transition}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onSelect("alumni")}
          className="w-full h-12 text-sm font-medium bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800"
        >
          I'm an alum
        </Button>
      </motion.div>
    </motion.div>
  );
}
