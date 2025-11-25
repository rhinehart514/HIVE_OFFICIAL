"use client";

import { motion } from "framer-motion";
import { GraduationCap, Bell, ArrowLeft } from "lucide-react";
import { Button } from "@hive/ui";
import { staggerContainer, staggerItem, transition } from "../shared/animations";

interface AlumniWaitlistStepProps {
  onBack: () => void;
}

export function AlumniWaitlistStep({ onBack }: AlumniWaitlistStepProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Icon */}
      <motion.div
        variants={staggerItem}
        transition={transition}
        className="flex justify-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
          className="h-20 w-20 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center"
        >
          <GraduationCap className="h-10 w-10 text-[#FFD700]" />
        </motion.div>
      </motion.div>

      {/* Message */}
      <motion.div variants={staggerItem} transition={transition}>
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold text-white">
            Alumni access is coming soon
          </h2>
          <p className="text-sm text-neutral-400 max-w-sm mx-auto">
            We're building something special for UB alumni. Join the waitlist
            to be the first to know when we launch.
          </p>
        </div>
      </motion.div>

      {/* Features preview */}
      <motion.div variants={staggerItem} transition={transition}>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Coming for Alumni
          </p>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
              Connect with current students & mentors
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
              Exclusive alumni networking events
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
              Campus news & updates tailored for you
            </li>
          </ul>
        </div>
      </motion.div>

      {/* Join waitlist CTA */}
      <motion.div variants={staggerItem} transition={transition}>
        <Button
          type="button"
          onClick={() => window.open("https://hive.so/alumni-waitlist", "_blank")}
          className="w-full h-12 bg-[#FFD700] text-black hover:brightness-110 font-semibold text-sm transition-all"
          style={{ boxShadow: "0 0 30px rgba(255, 215, 0, 0.15)" }}
        >
          <span className="flex items-center justify-center gap-2">
            <Bell className="h-4 w-4" />
            Join the waitlist
          </span>
        </Button>
      </motion.div>

      {/* Back button */}
      <motion.div variants={staggerItem} transition={transition}>
        <button
          type="button"
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-white py-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </motion.div>
    </motion.div>
  );
}
