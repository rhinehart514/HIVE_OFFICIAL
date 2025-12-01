"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, ArrowRight } from "lucide-react";
import { useAuth } from "@hive/auth-logic";
import { Button, VoidShell } from "@hive/ui";
import { motion } from "framer-motion";

export const dynamic = "force-dynamic";

type Status = "loading" | "success" | "error";

const transition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1],
};

function VerifyContent() {
  const router = useRouter();
  const unifiedAuth = useAuth();

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleMagicLink = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const oobCode = urlParams.get("oobCode");
        const token = urlParams.get("token");
        const email = urlParams.get("email");
        const schoolId = urlParams.get("schoolId");

        const userEmail =
          email ||
          (typeof window !== "undefined"
            ? window.localStorage.getItem("hive_pending_email") ||
              window.localStorage.getItem("emailForSignIn")
            : null);

        if (!userEmail) {
          setStatus("error");
          setError("Email is required. Please try signing in again.");
          return;
        }

        if (!schoolId) {
          setStatus("error");
          setError("School information is missing. Please try signing in again.");
          return;
        }

        const verificationToken = oobCode || token;
        if (!verificationToken) {
          setStatus("error");
          setError("Invalid verification link. Please use the link from your email.");
          return;
        }

        const response = await fetch("/api/auth/verify-magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: verificationToken,
            email: userEmail,
            schoolId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to verify");
        }

        // Session cookie is set by the API response
        // Broadcast auth event to sync other tabs
        if (data.success && typeof window !== "undefined") {
          localStorage.setItem("hive_auth_event", `login_${Date.now()}`);
        }

        setStatus("success");

        if (unifiedAuth?.clearError) {
          unifiedAuth.clearError();
        }

        // Redirect based on onboarding status
        setTimeout(() => {
          if (data.needsOnboarding) {
            router.push("/onboarding");
          } else {
            router.push("/feed");
          }
        }, 1200);
      } catch (err: unknown) {
        console.error("Magic link verification error:", err);
        setStatus("error");

        let errorMessage = "Failed to verify link.";
        const message = err instanceof Error ? err.message : "";

        if (message.includes("expired")) {
          errorMessage = "Link expired. Please request a new one.";
        } else if (message.includes("used")) {
          errorMessage = "Link already used. Please request a new one.";
        } else if (message.includes("invalid")) {
          errorMessage = "Invalid link. Please check your email.";
        } else if (message) {
          errorMessage = message;
        }

        setError(errorMessage);
      }
    };

    if (status === "loading") {
      handleMagicLink();
    }
  }, [router, unifiedAuth, status]);

  return (
    <VoidShell maxWidth="sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        {/* Loading State */}
        {status === "loading" && (
          <div className="text-center space-y-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mx-auto w-fit"
            >
              <Loader2 className="h-10 w-10 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Verifying...
              </h1>
              <p className="mt-2 text-neutral-400">
                One moment
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="mx-auto h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <Check className="h-8 w-8 text-green-500" />
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                You're in
              </h1>
              <p className="mt-2 text-neutral-400">
                Redirecting...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="mx-auto h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center"
              >
                <X className="h-8 w-8 text-red-500" />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Verification failed
                </h1>
                <p className="mt-2 text-neutral-400">
                  {error}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {error?.includes("expired") || error?.includes("used") ? (
                <>
                  <Button
                    type="button"
                    onClick={() => {
                      const email =
                        localStorage.getItem("hive_pending_email") ||
                        localStorage.getItem("emailForSignIn");
                      const schoolId = new URLSearchParams(window.location.search).get("schoolId");
                      router.push(
                        `/auth/expired?email=${encodeURIComponent(email || "")}&schoolId=${schoolId}`
                      );
                    }}
                    className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-semibold transition-colors"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Get new link
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => router.push("/auth/login")}
                    className="w-full text-sm text-neutral-500 hover:text-white py-3 transition-colors"
                  >
                    Start over
                  </button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={() => router.push("/auth/login")}
                  className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-semibold transition-colors"
                >
                  <span className="flex items-center justify-center gap-2">
                    Try again
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </VoidShell>
  );
}

function VerifyPageFallback() {
  return (
    <VoidShell maxWidth="sm">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
      </div>
    </VoidShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyPageFallback />}>
      <VerifyContent />
    </Suspense>
  );
}
