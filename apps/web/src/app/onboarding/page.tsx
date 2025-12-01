"use client";

import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, WifiOff } from "lucide-react";

import { OnboardingHeader } from "@/components/onboarding/ui/onboarding-header";
import { OnboardingPreview } from "@/components/onboarding/onboarding-preview";
import { DraftRecoveryBanner } from "@/components/onboarding/ui/draft-recovery-banner";
import { ErrorRecoveryModal } from "@/components/onboarding/ui/error-recovery-modal";
import { useOnboarding } from "@/components/onboarding/hooks/use-onboarding";
import { STEP_CONFIG } from "@/components/onboarding/shared/types";

import {
  UserTypeStep,
  IdentityStep,
  ProfileStep,
  InterestsStep,
  LeaderStep,
  SpacesStep,
  AlumniWaitlistStep,
  FacultyProfileStep,
} from "@/components/onboarding/steps";

export const dynamic = "force-dynamic";

const transition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1],
};

function OnboardingContent() {
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
    stepNumber,
    totalSteps,
    handleUserTypeSelect,
    handleBack,
    handleNext,
    handleLeaderChoice,
    submitOnboarding,
    discardDraft,
    retrySubmission,
    dismissErrorModal,
    saveLocallyAndContinue,
  } = useOnboarding();

  const currentConfig = STEP_CONFIG[step];

  const renderStep = () => {
    switch (step) {
      case "userType":
        return <UserTypeStep onSelect={handleUserTypeSelect} />;

      case "identity":
        return (
          <IdentityStep
            data={data}
            handleStatus={handleStatus}
            handleSuggestions={handleSuggestions}
            onUpdate={updateData}
            onNext={() => handleNext("profile")}
            error={error}
            setError={setError}
            isSubmitting={isSubmitting}
          />
        );

      case "profile":
        return (
          <ProfileStep
            data={data}
            onUpdate={updateData}
            onNext={() => handleNext("interests")}
            error={error}
            setError={setError}
          />
        );

      case "interests":
        return (
          <InterestsStep
            data={data}
            onUpdate={updateData}
            onNext={() => handleNext("leader")}
            error={error}
            setError={setError}
            isSubmitting={isSubmitting}
          />
        );

      case "leader":
        return <LeaderStep onChoice={handleLeaderChoice} />;

      case "spaces":
        return (
          <SpacesStep
            userType={data.userType}
            isSubmitting={isSubmitting}
            mustSelectSpace={data.userType === "faculty" || data.isLeader}
            onComplete={async (redirectTo, selectedSpaceIds) => {
              // Update data with selected spaces before submitting
              if (selectedSpaceIds && selectedSpaceIds.length > 0) {
                // For leaders, these become builder requests; for others, join requests
                if (data.isLeader) {
                  updateData({ builderRequestSpaces: selectedSpaceIds });
                } else {
                  updateData({ initialSpaceIds: selectedSpaceIds });
                }
              }
              return submitOnboarding({
                isLeaderOverride: data.userType === "student" ? data.isLeader : false,
                redirectTo,
                // Pass spaces directly since state update might not complete in time
                selectedSpaceIds,
              });
            }}
          />
        );

      case "alumniWaitlist":
        return <AlumniWaitlistStep onBack={handleBack} />;

      case "facultyProfile":
        return (
          <FacultyProfileStep
            data={data}
            onUpdate={updateData}
            onNext={() => handleNext("spaces")}
            error={error}
            setError={setError}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Panel - Live Preview (desktop only) */}
      <div className="hidden lg:flex w-[35%] bg-neutral-900 border-r border-neutral-800/20 sticky top-0 h-screen">
        <OnboardingPreview
          userType={data.userType}
          name={data.name}
          handle={data.handle}
          handleStatus={handleStatus}
          major={data.major}
          graduationYear={data.graduationYear}
          interests={data.interests}
          profilePhoto={data.profilePhoto}
          courseCode={data.courseCode}
          currentStep={step}
        />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <OnboardingHeader
          step={step}
          stepNumber={stepNumber}
          totalSteps={totalSteps}
          onBack={handleBack}
        />

        {/* Main content */}
        <main className="relative z-10 flex-1 flex items-start justify-center px-6 py-8 md:py-12 overflow-y-auto">
          {/* Breathing gold ambient orb */}
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gold-500 rounded-full blur-[120px] pointer-events-none lg:left-[67.5%]"
          />

          <div className="w-full max-w-lg relative z-10">
            {/* Title */}
            <motion.div
              className="text-center mb-8"
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition}
            >
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mb-2">
                {currentConfig.title}
              </h1>
              <p className="text-sm text-neutral-400">
                {currentConfig.subtitle}
              </p>
            </motion.div>

            {/* Draft Recovery Banner */}
            <AnimatePresence>
              {hasRestoredDraft && savedDraftTime && step === "userType" && (
                <DraftRecoveryBanner
                  savedAt={savedDraftTime}
                  onContinue={() => {}} // Already restored, just dismiss
                  onDiscard={discardDraft}
                />
              )}
            </AnimatePresence>

            {/* Offline Warning */}
            <AnimatePresence>
              {!isOnline && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 mb-4"
                >
                  <WifiOff className="w-4 h-4 text-amber-400" />
                  <p className="text-sm text-amber-300">
                    You're offline. Your progress is saved locally.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form content */}
            <div className="w-full">
              <motion.div
                className="space-y-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      {/* Error Recovery Modal */}
      <ErrorRecoveryModal
        isOpen={showErrorModal}
        error={error || "An unexpected error occurred"}
        isRetrying={isRetrying}
        onRetry={retrySubmission}
        onSaveLocally={saveLocallyAndContinue}
        onDismiss={dismissErrorModal}
      />
    </div>
  );
}

function OnboardingPageFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Breathing ambient orb */}
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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500 rounded-full blur-[120px] pointer-events-none"
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
