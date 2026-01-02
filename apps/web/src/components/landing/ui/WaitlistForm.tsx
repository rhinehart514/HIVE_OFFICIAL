"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@hive/ui";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

/**
 * WaitlistForm - Glassmorphic Email Capture
 *
 * Features:
 * - Email validation with Zod
 * - Glassmorphic card design
 * - Success state with confetti
 * - Error handling with shake animation
 */

// Base count that increments as users join (stored in localStorage to persist across page loads)
const BASE_WAITLIST_COUNT = 47;

export function WaitlistForm() {
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [waitlistCount, setWaitlistCount] = useState(BASE_WAITLIST_COUNT);

  // Load persisted count on mount
  useEffect(() => {
    const stored = localStorage.getItem('hive_waitlist_count');
    if (stored) {
      setWaitlistCount(Math.max(BASE_WAITLIST_COUNT, parseInt(stored, 10)));
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
  });

  const onSubmit = async (data: WaitlistFormData) => {
    setSubmitStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          schoolId: 'ub-buffalo' // Current campus
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to join waitlist');
      }

      setSubmitStatus("success");
      reset();

      // Increment local count for social proof
      const newCount = waitlistCount + 1;
      setWaitlistCount(newCount);
      localStorage.setItem('hive_waitlist_count', newCount.toString());

      // Reset success state after 3 seconds
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      {/* Glassmorphic Card */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5 sm:p-8 shadow-2xl">
        {submitStatus === "success" ? (
          // Success State
          <div className="text-center space-y-2">
            <div className="text-4xl">🎉</div>
            <h3 className="text-xl font-bold text-white">You’re on the list!</h3>
            <p className="text-sm text-white/70">We’ll let you know when HIVE launches at UB.</p>
          </div>
        ) : (
          // Form State
          <>
            <div className="text-center mb-4 sm:mb-6">
              {/* Social proof with avatar stack */}
              <div className="flex items-center justify-center gap-2 mb-3">
                {/* Mini avatar stack */}
                <div className="flex -space-x-2">
                  {[
                    'bg-gradient-to-br from-amber-400 to-orange-500',
                    'bg-gradient-to-br from-blue-400 to-indigo-500',
                    'bg-gradient-to-br from-emerald-400 to-teal-500',
                  ].map((gradient, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-full ${gradient} border-2 border-[#0A0A0A] flex items-center justify-center`}
                    >
                      <span className="text-[8px] font-bold text-white/90">
                        {['M', 'J', 'A'][i]}
                      </span>
                    </div>
                  ))}
                  <div className="w-6 h-6 rounded-full bg-white/10 border-2 border-[#0A0A0A] flex items-center justify-center">
                    <span className="text-[8px] font-medium text-white/60">+{waitlistCount - 3}</span>
                  </div>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={waitlistCount}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="inline-block tabular-nums"
                  >
                    {waitlistCount}
                  </motion.span>
                </AnimatePresence>
                {' '}UB students waiting
              </h3>
              <p className="text-sm text-white/60">
                Get early access before the semester starts
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="your.email@buffalo.edu"
                  className={`
                    w-full h-14 px-4 rounded-xl
                    bg-white/20 backdrop-blur-sm
                    border-2 ${errors.email || errorMessage ? "border-red-400" : "border-white/30"}
                    text-white placeholder:text-white/50
                    focus:outline-none focus:border-[var(--hive-brand-primary)]
                    transition-all duration-200
                    ${submitStatus === "error" ? "animate-shake" : ""}
                  `}
                  disabled={submitStatus === "loading"}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-2">{errors.email.message}</p>
                )}
                {errorMessage && (
                  <p className="text-red-400 text-sm mt-2">{errorMessage}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="brand"
                size="lg"
                className="w-full"
                disabled={submitStatus === "loading"}
              >
                {submitStatus === "loading" ? "Joining..." : "Get early access"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
