"use client";

import { Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, WifiOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { OnboardingLayout } from "@/components/onboarding/layout";
import { DraftRecoveryBanner } from "@/components/onboarding/ui/draft-recovery-banner";
import { ErrorRecoveryModal } from "@/components/onboarding/ui/error-recovery-modal";
import { useOnboarding } from "@/components/onboarding/hooks/use-onboarding";

import {
  UserTypeStep,
  QuickProfileStep,
  InterestsCloudStep,
  // Legacy steps (kept for draft compatibility)
  SpacesStep,
  CompletionStep,
} from "@/components/onboarding/steps";

export const dynamic = "force-dynamic";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Get redirect URL from query params (set by middleware when user tried to access protected route)
  const redirectAfterOnboarding = searchParams.get('redirect') || '/feed';
  // Prevent hydration mismatch from isOnline check (navigator.onLine differs server vs client)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {
    step,
    data,
    error,
    isSubmitting,
    handleStatus,
    handleSuggestions,
    isOnline,
    hasRestoredDraft,
    savedDraftTime,
    showErrorModal,
    isRetrying,
    setError,
    updateData,
    setStep,
    handleUserTypeSelect,
    handleBack,
    handleNext,
    submitOnboarding,
    discardDraft,
    retrySubmission,
    dismissErrorModal,
    saveLocallyAndContinue,
  } = useOnboarding();

  const renderStep = () => {
    switch (step) {
      // === STREAMLINED 3-STEP FLOW (Phase 6) ===

      case "userType":
        return (
          <UserTypeStep
            key="userType"
            onSelect={(type, isLeader) => {
              // Leader path: "I run a club" (isLeader = true)
              // Explorer path: "Looking around" (isLeader = false)
              handleUserTypeSelect(type, isLeader);
            }}
          />
        );

      case "quickProfile":
        return (
          <QuickProfileStep
            key="quickProfile"
            data={data}
            handleStatus={handleStatus}
            handleSuggestions={handleSuggestions}
            onUpdate={updateData}
            isSubmitting={isSubmitting}
            onNext={async () => {
              // LEADER FORK: Leaders skip interestsCloud and go to claim flow
              if (data.isLeader) {
                // Submit profile immediately for leaders
                updateData({ termsAccepted: true });
                await submitOnboarding({
                  isLeaderOverride: true,
                  redirectTo: '/spaces/claim',
                });
              } else {
                // Explorers continue to interests selection
                handleNext("interestsCloud");
              }
            }}
            onBack={handleBack}
          />
        );

      case "interestsCloud":
        return (
          <InterestsCloudStep
            key="interestsCloud"
            data={data}
            onUpdate={updateData}
            onNext={async () => {
              // Phase 6: Auto-join recommended spaces and submit directly
              updateData({ termsAccepted: true });

              // Fetch recommended spaces based on interests
              try {
                const response = await fetch('/api/spaces/recommended', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    interests: data.interests,
                    limit: 3, // Auto-join top 3 recommended
                  }),
                });

                if (response.ok) {
                  const result = await response.json();
                  const spaces = result.data?.spaces || result.spaces || [];
                  const spaceIds = spaces?.map((s: { id: string }) => s.id) || [];
                  const spaceNames = spaces?.map((s: { name: string }) => s.name) || [];

                  if (spaceIds.length > 0) {
                    updateData({
                      initialSpaceIds: spaceIds,
                      initialSpaceNames: spaceNames,
                      claimedSpaceId: spaceIds[0],
                      claimedSpaceName: spaceNames[0],
                    });
                  }

                  // Submit and redirect directly to first space
                  const redirectPath = spaceIds.length > 0
                    ? `/spaces/${spaceIds[0]}`
                    : (redirectAfterOnboarding !== '/feed' ? redirectAfterOnboarding : '/spaces/browse');

                  await submitOnboarding({
                    isLeaderOverride: data.isLeader,
                    redirectTo: redirectPath,
                    selectedSpaceIds: spaceIds,
                  });
                } else {
                  // Fallback: submit without auto-join
                  await submitOnboarding({
                    isLeaderOverride: data.isLeader,
                    redirectTo: redirectAfterOnboarding !== '/feed' ? redirectAfterOnboarding : '/spaces/browse',
                  });
                }
              } catch {
                // On error, still submit but redirect to browse
                await submitOnboarding({
                  isLeaderOverride: data.isLeader,
                  redirectTo: '/spaces/browse',
                });
              }
            }}
            onBack={handleBack}
            error={error}
            setError={setError}
          />
        );

      // === LEGACY STEP HANDLERS (for draft migration) ===

      case "name":
      case "handleSelection":
      case "profile":
        // Redirect legacy profile steps to quickProfile
        handleNext("quickProfile");
        return null;

      case "interests":
        handleNext("interestsCloud");
        return null;

      case "spaces":
        return (
          <SpacesStep
            key="spaces"
            userType={data.userType}
            isSubmitting={isSubmitting}
            mustSelectSpace={true} // Both leaders and explorers must select at least one space
            isExplorer={!data.isLeader}
            onComplete={async (redirectTo, selectedSpaceIds, selectedSpaceNames) => {
              // Update data with selected spaces before submitting
              // For BOTH leaders AND explorers, track the first selected space
              // This ensures explorers land on a space with content, not an empty feed
              if (selectedSpaceIds && selectedSpaceIds.length > 0) {
                if (data.isLeader) {
                  updateData({
                    builderRequestSpaces: selectedSpaceIds,
                    claimedSpaceId: selectedSpaceIds[0],
                    claimedSpaceName: selectedSpaceNames?.[0],
                  });
                } else {
                  // Explorers: store IDs, names, and first space for redirect
                  updateData({
                    initialSpaceIds: selectedSpaceIds,
                    initialSpaceNames: selectedSpaceNames,
                    claimedSpaceId: selectedSpaceIds[0],
                  });
                }
              }

              // Use the redirect URL from query params if available, otherwise use the one from step
              const finalRedirect = redirectAfterOnboarding !== '/feed'
                ? redirectAfterOnboarding
                : (redirectTo || '/feed');

              const success = await submitOnboarding({
                isLeaderOverride: data.isLeader,
                redirectTo: finalRedirect,
                selectedSpaceIds,
              });

              // If successful and claiming a space, show celebration
              if (success && selectedSpaceIds && selectedSpaceIds.length > 0) {
                // Store space info for celebration
                updateData({
                  claimedSpaceId: selectedSpaceIds[0],
                  claimedSpaceName: selectedSpaceNames?.[0],
                  initialSpaceNames: selectedSpaceNames,
                });
                setStep("completion");
                return true;
              }

              return success;
            }}
          />
        );

      case "completion":
        return (
          <CompletionStep
            key="completion"
            spaceName={data.claimedSpaceName}
            spaceId={data.claimedSpaceId}
            isLeader={data.isLeader}
            handle={data.handle}
            joinedSpaces={data.initialSpaceNames}
            onNavigate={(path) => router.push(path)}
          />
        );

      case "identity":
      case "leader":
      case "alumniWaitlist":
      case "facultyProfile":
        // Redirect all legacy steps to quickProfile
        handleNext("quickProfile");
        return null;

      default:
        return null;
    }
  };

  return (
    <OnboardingLayout currentStep={step}>
      {/* Offline Warning - only render after mount to prevent hydration mismatch */}
      <AnimatePresence mode="wait">
        {mounted && !isOnline && (
          <motion.div
            key="offline-warning"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2"
          >
            <WifiOff className="w-4 h-4 text-amber-400" />
            <p className="text-sm text-amber-300">
              You're offline. Progress saved locally.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draft Recovery Banner - only render after mount */}
      <AnimatePresence mode="wait">
        {mounted && hasRestoredDraft && savedDraftTime && step === "userType" && (
          <motion.div
            key="draft-recovery"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <DraftRecoveryBanner
              savedAt={savedDraftTime}
              onContinue={() => {}}
              onDiscard={discardDraft}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content with AnimatePresence */}
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>

      {/* Error Recovery Modal */}
      <ErrorRecoveryModal
        isOpen={showErrorModal}
        error={error || "An unexpected error occurred"}
        isRetrying={isRetrying}
        onRetry={retrySubmission}
        onSaveLocally={saveLocallyAndContinue}
        onDismiss={dismissErrorModal}
      />
    </OnboardingLayout>
  );
}

function OnboardingPageFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: 'var(--hive-bg-base)' }}
    >
      {/* Ambient glow */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.02, 0.04, 0.02],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <Loader2 className="h-6 w-6 animate-spin text-neutral-500 relative z-10" />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingPageFallback />}>
      <OnboardingContent />
    </Suspense>
  );
}
