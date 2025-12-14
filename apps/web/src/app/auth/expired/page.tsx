"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthShell, AuthShellStatic } from "@/components/auth/auth-shell";

export const dynamic = "force-dynamic";

/**
 * Legacy expired link page
 *
 * This page previously handled expired magic links.
 * We've migrated to OTP codes - redirect users to login.
 */
function ExpiredPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Clear any stale localStorage from old magic link flow
    if (typeof window !== "undefined") {
      localStorage.removeItem("hive_pending_email");
      localStorage.removeItem("emailForSignIn");
      localStorage.removeItem("hive_resend_attempts");
    }

    // Preserve email if provided, redirect to new login
    const email = searchParams?.get("email");
    const timer = setTimeout(() => {
      if (email) {
        // Pre-fill email on login page
        router.replace(`/auth/login?email=${encodeURIComponent(email)}`);
      } else {
        router.replace("/auth/login");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [router, searchParams]);

  return (
    <AuthShell>
      <div className="text-center space-y-6">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Redirecting...
          </h1>
          <p className="text-sm text-zinc-500">
            We&apos;ve updated our sign-in process. Taking you to the new login page.
          </p>
        </div>
      </div>
    </AuthShell>
  );
}

export default function ExpiredPage() {
  return (
    <Suspense
      fallback={
        <AuthShellStatic>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
          </div>
        </AuthShellStatic>
      }
    >
      <ExpiredPageContent />
    </Suspense>
  );
}
