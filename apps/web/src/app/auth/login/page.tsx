"use client";

import { useState, Suspense } from "react";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";
import { initializeApp, getApps, getApp } from "firebase/app";

export const dynamic = "force-dynamic";

// Initialize Firebase Client SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Campus configuration - configurable via env vars for multi-tenant support
const CAMPUS_CONFIG = {
  id: process.env.NEXT_PUBLIC_CAMPUS_ID || "ub-buffalo",
  domain: process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN || "buffalo.edu",
  name: process.env.NEXT_PUBLIC_CAMPUS_NAME || "UB",
  fullName: process.env.NEXT_PUBLIC_CAMPUS_FULL_NAME || "University at Buffalo",
};

type Step = "email" | "sent";

const RESEND_DELAY_MS = 30_000;

const transition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1],
};

function LoginContent() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);

  const canResend = sentAt ? Date.now() - sentAt >= RESEND_DELAY_MS : true;
  const fullEmail = email.includes("@") ? email : `${email}@${CAMPUS_CONFIG.domain}`;

  const handleSubmit = async () => {
    if (!email) {
      setError("Enter your email");
      return;
    }

    if (!fullEmail.endsWith(`@${CAMPUS_CONFIG.domain}`)) {
      setError(`Use your @${CAMPUS_CONFIG.domain} email`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Store email for verification page
      if (typeof window !== "undefined") {
        localStorage.setItem("hive_pending_email", fullEmail);
      }

      // Configure where the magic link redirects to
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const actionCodeSettings = {
        url: `${appUrl}/auth/verify?schoolId=${CAMPUS_CONFIG.id}&email=${encodeURIComponent(fullEmail)}`,
        handleCodeInApp: true,
      };

      // Use Firebase Client SDK - this sends the email automatically!
      await sendSignInLinkToEmail(auth, fullEmail, actionCodeSettings);

      setStep("sent");
      setSentAt(Date.now());
    } catch (err: unknown) {
      console.error("Magic link error:", err);
      const firebaseError = err as { code?: string; message?: string };

      // Handle specific Firebase errors
      if (firebaseError.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else if (firebaseError.code === "auth/missing-android-pkg-name" ||
                 firebaseError.code === "auth/missing-continue-uri" ||
                 firebaseError.code === "auth/invalid-continue-uri") {
        setError("Configuration error. Please try again later.");
      } else {
        setError(firebaseError.message || "Unable to send link");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || !canResend) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Configure where the magic link redirects to
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const actionCodeSettings = {
        url: `${appUrl}/auth/verify?schoolId=${CAMPUS_CONFIG.id}&email=${encodeURIComponent(fullEmail)}`,
        handleCodeInApp: true,
      };

      // Use Firebase Client SDK - this sends the email automatically!
      await sendSignInLinkToEmail(auth, fullEmail, actionCodeSettings);

      setSentAt(Date.now());
    } catch (err: unknown) {
      console.error("Resend magic link error:", err);
      const firebaseError = err as { code?: string; message?: string };
      setError(firebaseError.message || "Unable to resend link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {step === "email" && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={transition}
            className="w-full max-w-sm space-y-8"
          >
            {/* Logo */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-[#FFD700] rounded-lg" />
                <span className="text-xl font-bold text-white">HIVE</span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Join the movement
              </h1>
              <p className="mt-2 text-neutral-400">
                Sign in with your {CAMPUS_CONFIG.name} email
              </p>
            </div>

            {/* Form */}
            <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-800 space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="yourname"
                    className={`w-full h-12 px-4 pr-[120px] bg-black border rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600 ${
                      error ? "border-red-500" : "border-neutral-800"
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                    @{CAMPUS_CONFIG.domain}
                  </span>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 bg-[#FFD700] text-black font-semibold rounded-lg hover:brightness-110 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ boxShadow: "0 0 30px rgba(255, 215, 0, 0.15)" }}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-xs text-center text-neutral-500">
                By continuing, you agree to our{" "}
                <a href="/legal/terms" className="underline hover:text-neutral-300">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/legal/privacy" className="underline hover:text-neutral-300">
                  Privacy Policy
                </a>
              </p>
            </div>
          </motion.div>
        )}

        {step === "sent" && (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={transition}
            className="w-full max-w-sm space-y-8"
          >
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

            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Check your inbox
              </h1>
              <p className="text-neutral-400">
                We sent a magic link to{" "}
                <span className="text-white font-medium">{fullEmail}</span>
              </p>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-center text-red-400"
              >
                {error}
              </motion.p>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || isSubmitting}
                className="w-full h-12 bg-neutral-900 border border-neutral-800 text-white font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Resend link"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError(null);
                }}
                className="w-full text-sm text-neutral-500 hover:text-white py-3 transition-colors"
              >
                Use different email
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginContent />
    </Suspense>
  );
}
