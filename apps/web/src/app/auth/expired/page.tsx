"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, VoidShell } from "@hive/ui";
import { Loader2, ArrowRight, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fadeVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const transition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1],
};

function ExpiredPageContent() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [countdown, setCountdown] = useState(0);

  const searchParams = useSearchParams();
  const router = useRouter();
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const urlEmail = searchParams?.get("email");
    const urlSchoolId = searchParams?.get("schoolId");
    const storedEmail = localStorage.getItem("emailForSignIn");
    const storedSchool = localStorage.getItem("hive_last_school");

    if (urlEmail) setEmail(urlEmail);
    else if (storedEmail) setEmail(storedEmail);

    if (urlSchoolId) setSchoolId(urlSchoolId);
    else if (storedSchool) {
      try {
        const school = JSON.parse(storedSchool);
        setSchoolId(school.id);
      } catch {
        console.error("Failed to parse stored school");
      }
    }

    const storedAttempts = localStorage.getItem("hive_resend_attempts");
    if (storedAttempts) {
      try {
        const attempts = JSON.parse(storedAttempts);
        setAttemptNumber(attempts.count || 1);
        const now = Date.now();
        const nextAllowedTime = attempts.nextRetryTime || 0;
        if (nextAllowedTime > now) {
          setCountdown(Math.ceil((nextAllowedTime - now) / 1000));
        }
      } catch {
        console.error("Failed to parse resend attempts");
      }
    }
  }, [searchParams, mounted]);

  useEffect(() => {
    if (countdown > 0) {
      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownInterval.current) {
              clearInterval(countdownInterval.current);
              countdownInterval.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
        }
      };
    }
  }, [countdown]);

  if (!mounted) {
    return (
      <VoidShell maxWidth="sm">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
        </div>
      </VoidShell>
    );
  }

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const handleResendLink = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!schoolId) {
      router.push(`/auth/login?email=${encodeURIComponent(email)}`);
      return;
    }

    if (countdown > 0) {
      setError(`Please wait ${formatCountdown(countdown)} before requesting another link`);
      return;
    }

    setIsResending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, schoolId, attemptNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          if (retryAfter) {
            const seconds = parseInt(retryAfter, 10);
            setCountdown(seconds);
            const nextRetryTime = Date.now() + seconds * 1000;
            localStorage.setItem(
              "hive_resend_attempts",
              JSON.stringify({
                count: attemptNumber + 1,
                nextRetryTime,
              })
            );
          }
        }
        throw new Error(data.error || "Failed to resend magic link");
      }

      setAttemptNumber(data.attemptNumber || attemptNumber + 1);

      if (data.nextRetryDelay) {
        setCountdown(data.nextRetryDelay);
        const nextRetryTime = Date.now() + data.nextRetryDelay * 1000;
        localStorage.setItem(
          "hive_resend_attempts",
          JSON.stringify({
            count: data.attemptNumber,
            nextRetryTime,
          })
        );
      }

      setResendSuccess(true);
    } catch (err) {
      console.error("Error resending magic link:", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <VoidShell maxWidth="sm">
      <AnimatePresence mode="wait">
        {!resendSuccess ? (
          <motion.div
            key="form"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Link expired
              </h1>
              <p className="text-base text-neutral-400">
                Request a new one below
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-neutral-950 rounded-2xl p-6 md:p-8 border border-neutral-800 space-y-5">
              {/* Email Display/Input */}
              {email ? (
                <div className="p-3 bg-black rounded-xl border border-neutral-800/50">
                  <p className="text-xs text-neutral-500 mb-1">Resending to:</p>
                  <p className="text-white font-medium break-all">{email}</p>
                  <button
                    onClick={() => setEmail("")}
                    className="text-xs text-neutral-500 hover:text-neutral-400 hover:underline mt-2"
                  >
                    Use different email
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Your email address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter your school email"
                    disabled={isResending}
                    autoFocus
                    className="h-12 bg-black border-neutral-800 text-white placeholder:text-neutral-600"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-center text-red-400"
                >
                  {error}
                </motion.p>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleResendLink}
                  disabled={isResending || countdown > 0 || !email}
                  className="w-full h-12 bg-[#FFD700] text-black hover:brightness-110 font-semibold disabled:opacity-40"
                  style={{ boxShadow: "0 0 30px rgba(255, 215, 0, 0.15)" }}
                >
                  {isResending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : countdown > 0 ? (
                    `Wait ${formatCountdown(countdown)}`
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Send new link
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>

                <Link href="/auth/login" className="block">
                  <button className="w-full text-sm text-neutral-500 hover:text-white py-3 transition-colors">
                    Back to sign in
                  </button>
                </Link>
              </div>
            </div>

            {/* Support */}
            <p className="text-xs text-center text-neutral-500">
              Still having trouble?{" "}
              <a
                href="mailto:support@hive.college"
                className="underline hover:text-neutral-400"
              >
                Contact support
              </a>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="space-y-8"
          >
            {/* Icon */}
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
                className="h-16 w-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center"
              >
                <Mail className="h-7 w-7 text-[#FFD700]" />
              </motion.div>
            </div>

            {/* Success State */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Check your inbox
              </h1>
              <p className="text-base text-neutral-400">
                We sent a new link to{" "}
                <span className="text-white font-medium">{email}</span>
              </p>
            </div>

            <Button
              onClick={() => {
                setResendSuccess(false);
                if (attemptNumber >= 5) {
                  setAttemptNumber(1);
                  localStorage.removeItem("hive_resend_attempts");
                }
              }}
              className="w-full h-12 bg-[#FFD700] text-black hover:brightness-110 font-semibold"
              style={{ boxShadow: "0 0 30px rgba(255, 215, 0, 0.15)" }}
            >
              Got it
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </VoidShell>
  );
}

export default function ExpiredPage() {
  return (
    <Suspense
      fallback={
        <VoidShell maxWidth="sm">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
          </div>
        </VoidShell>
      }
    >
      <ExpiredPageContent />
    </Suspense>
  );
}
