"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShellStatic } from "@/components/auth/auth-shell";

export const dynamic = "force-dynamic";

/**
 * Legacy magic link verification page
 *
 * This page previously handled Firebase magic link verification.
 * We've migrated to OTP codes - redirect users to the new login flow.
 */
export default function VerifyPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any stale localStorage from old magic link flow
    if (typeof window !== "undefined") {
      localStorage.removeItem("hive_pending_email");
      localStorage.removeItem("emailForSignIn");
    }

    // Redirect to login after a brief moment
    const timer = setTimeout(() => {
      router.replace("/auth/login");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <AuthShellStatic>
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
    </AuthShellStatic>
  );
}
