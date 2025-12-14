"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Check, Plus, Lock } from "lucide-react";
import Image from "next/image";
import { Button, Input } from "@hive/ui";
import { motion, AnimatePresence } from "framer-motion";

export const dynamic = "force-dynamic";

interface Space {
  id: string;
  name: string;
  category: string;
  memberCount: number;
  isClaimed: boolean;
}

// Category-based leadership rules (synced with @hive/core space-categories.ts)
const LOCKED_CATEGORIES = new Set(['residential']);
const CATEGORY_LABELS: Record<string, string> = {
  student_org: 'Student Organization',
  university_org: 'University Organization',
  greek_life: 'Greek Life',
  residential: 'Residential',
};

function isLockedCategory(category: string): boolean {
  return LOCKED_CATEGORIES.has(category);
}

// Animation variants
const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const transition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

function ClaimContent() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Form fields for leadership request
  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");
  const [plans, setPlans] = useState("");
  const [timeCommitment, setTimeCommitment] = useState<string>("");
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);

  // Search spaces
  // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce wrapper is stable
  const searchSpaces = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSpaces([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        const response = await fetch(
          `/api/spaces/search?q=${encodeURIComponent(searchQuery)}&unclaimed=true`
        );
        const data = await response.json();

        if (data.spaces) {
          setSpaces(data.spaces);
        } else {
          setSpaces([]);
        }
      } catch {
        setSpaces([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    searchSpaces(query);
  }, [query, searchSpaces]);

  const handleClaimRequest = async () => {
    if (!selectedSpace) return;

    // Validate required fields
    if (motivation.length < 50) {
      setError("Please provide at least 50 characters explaining your motivation");
      return;
    }
    if (experience.length < 10) {
      setError("Please describe your relevant experience (at least 10 characters)");
      return;
    }
    if (plans.length < 30) {
      setError("Please describe your plans for the space (at least 30 characters)");
      return;
    }
    if (!timeCommitment) {
      setError("Please select your expected time commitment");
      return;
    }
    if (!hasAgreedToTerms) {
      setError("You must agree to the builder terms to continue");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/spaces/request-to-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: selectedSpace.id,
          motivation,
          experience,
          plans,
          timeCommitment,
          hasAgreedToTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to submit request");
      }

      setSubmitted(true);

      // Redirect to feed after delay
      setTimeout(() => {
        router.push("/feed");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNew = () => {
    // For now, redirect to a create space flow or contact
    router.push("/spaces/new");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--hive-background-primary)] text-[var(--hive-text-primary)] flex flex-col">
        {/* Header */}
        <header className="p-4">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/hive-logo-gold.svg"
              alt="HIVE"
              width={28}
              height={28}
            />
            <span className="text-lg font-bold text-[var(--hive-text-primary)]">HIVE</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-4 md:px-6 py-8 md:py-12">
          <div className="w-full max-w-md">
            <motion.div
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              transition={transition}
              className="space-y-6 text-center"
            >
              <div className="h-16 w-16 rounded-2xl bg-[var(--hive-status-success)]/20 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-[var(--hive-status-success)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--hive-text-primary)] mb-2">
                  Request submitted!
                </h1>
                <p className="text-[var(--hive-text-secondary)] mb-4">
                  Your request to lead <span className="font-semibold text-[var(--hive-text-primary)]">{selectedSpace?.name}</span> has been sent for review.
                </p>
                <div className="bg-[var(--hive-background-secondary)] rounded-xl p-4 text-left space-y-3 border border-[var(--hive-border-default)]">
                  <h3 className="text-sm font-semibold text-[var(--hive-text-primary)]">What happens next?</h3>
                  <ul className="text-sm text-[var(--hive-text-secondary)] space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--hive-brand-primary)]">1.</span>
                      <span>Our team reviews your application (usually within 24-48 hours)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--hive-brand-primary)]">2.</span>
                      <span>You'll receive a notification when a decision is made</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--hive-brand-primary)]">3.</span>
                      <span>If approved, you'll gain builder access to customize the space</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => router.push("/feed")}
                  className="w-full bg-white text-black hover:bg-neutral-100 font-semibold"
                >
                  Go to Feed
                </Button>
                <button
                  type="button"
                  onClick={() => router.push(`/spaces/${selectedSpace?.id}`)}
                  className="w-full text-sm text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)]"
                >
                  View space while you wait
                </button>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center">
          <p className="text-xs text-[var(--hive-text-tertiary)]">
            University at Buffalo
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--hive-background-primary)] text-[var(--hive-text-primary)] flex flex-col">
      {/* Header */}
      <header className="p-4">
        <div className="flex items-center gap-2">
          <Image
            src="/assets/hive-logo-gold.svg"
            alt="HIVE"
            width={28}
            height={28}
          />
          <span className="text-lg font-bold text-[var(--hive-text-primary)]">HIVE</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 md:px-6 py-8 md:py-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!selectedSpace ? (
              <motion.div
                key="search"
                variants={fadeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-2xl md:text-3xl font-bold text-[var(--hive-text-primary)] mb-2">
                    Find your organization
                  </h1>
                  <p className="text-sm md:text-base text-[var(--hive-text-secondary)]">
                    Search for your club or org to request leadership access.
                  </p>
                </div>

              <div className="bg-[var(--hive-background-secondary)] rounded-2xl p-5 md:p-6 border border-[var(--hive-border-default)] space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--hive-text-tertiary)]" />
                  <Input
                    type="text"
                    autoFocus
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setError(null);
                    }}
                    placeholder="Search spaces..."
                    className="pl-9"
                  />
                </div>

                {/* Search results */}
                <div className="space-y-2">
                  {isSearching && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--hive-text-tertiary)]" />
                    </div>
                  )}

                  {!isSearching && spaces.length > 0 && (
                    <div className="space-y-2">
                      {spaces.map((space) => {
                        const locked = isLockedCategory(space.category);
                        const displayCategory = CATEGORY_LABELS[space.category] || space.category;

                        return (
                          <button
                            key={space.id}
                            type="button"
                            onClick={() => !locked && setSelectedSpace(space)}
                            disabled={locked}
                            className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                              locked
                                ? 'border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] opacity-60 cursor-not-allowed'
                                : 'border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] hover:border-text-tertiary'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-[var(--hive-text-primary)]">
                                  {space.name}
                                </div>
                                <div className="text-xs text-[var(--hive-text-tertiary)]">
                                  {displayCategory} · {space.memberCount} members
                                </div>
                              </div>
                              {locked ? (
                                <span className="flex items-center gap-1 text-xs text-[var(--hive-text-tertiary)]">
                                  <Lock className="h-3 w-3" />
                                  Coming soon
                                </span>
                              ) : space.isClaimed ? (
                                <span className="text-xs text-[var(--hive-text-tertiary)]">
                                  Claimed
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!isSearching && query && spaces.length === 0 && (
                    <div className="py-4 text-center">
                      <p className="text-sm text-[var(--hive-text-secondary)]">
                        No spaces found
                      </p>
                    </div>
                  )}
                </div>

                {/* Create new option */}
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="flex w-full items-center gap-3 rounded-lg border border-dashed border-[var(--hive-border-default)] px-4 py-3 text-left transition-colors hover:border-text-tertiary"
                >
                  <Plus className="h-4 w-4 text-[var(--hive-text-tertiary)]" />
                  <div>
                    <div className="text-sm font-medium text-[var(--hive-text-primary)]">
                      Can't find it?
                    </div>
                    <div className="text-xs text-[var(--hive-text-tertiary)]">
                      Request a new space
                    </div>
                  </div>
                </button>

                {/* Skip option */}
                <button
                  type="button"
                  onClick={() => router.push("/feed")}
                  className="w-full text-sm text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)]"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="space-y-6"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedSpace(null);
                  setError(null);
                }}
                className="text-sm text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)]"
              >
                ← Back to search
              </button>

              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--hive-text-primary)] mb-2">
                  Request to lead
                </h1>
                <p className="text-sm md:text-base text-[var(--hive-text-secondary)]">
                  You're requesting leadership access to:
                </p>
              </div>

              <div className="rounded-lg border border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] px-4 py-3">
                <div className="font-medium text-[var(--hive-text-primary)]">
                  {selectedSpace.name}
                </div>
                <div className="text-xs text-[var(--hive-text-tertiary)]">
                  {selectedSpace.category} · {selectedSpace.memberCount} members
                </div>
              </div>

              {/* Leadership Application Form */}
              <div className="space-y-4">
                {/* Motivation */}
                <div>
                  <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                    Why do you want to lead this space?
                  </label>
                  <textarea
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="Explain your connection to this organization and why you're the right person to lead it on HIVE..."
                    className="w-full rounded-lg border border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] px-3 py-2 text-sm text-[var(--hive-text-primary)] placeholder:text-[var(--hive-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[100px] resize-none"
                    maxLength={1000}
                  />
                  <div className="mt-1 text-xs text-[var(--hive-text-tertiary)] text-right">
                    {motivation.length}/1000 (min 50)
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                    Relevant experience
                  </label>
                  <textarea
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="Describe your role in this organization or relevant leadership experience..."
                    className="w-full rounded-lg border border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] px-3 py-2 text-sm text-[var(--hive-text-primary)] placeholder:text-[var(--hive-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[80px] resize-none"
                    maxLength={500}
                  />
                  <div className="mt-1 text-xs text-[var(--hive-text-tertiary)] text-right">
                    {experience.length}/500 (min 10)
                  </div>
                </div>

                {/* Plans */}
                <div>
                  <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                    What will you do with this space?
                  </label>
                  <textarea
                    value={plans}
                    onChange={(e) => setPlans(e.target.value)}
                    placeholder="How will you use HIVE to engage members? What content will you post? Any events or tools you'll create?"
                    className="w-full rounded-lg border border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] px-3 py-2 text-sm text-[var(--hive-text-primary)] placeholder:text-[var(--hive-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[100px] resize-none"
                    maxLength={1000}
                  />
                  <div className="mt-1 text-xs text-[var(--hive-text-tertiary)] text-right">
                    {plans.length}/1000 (min 30)
                  </div>
                </div>

                {/* Time Commitment */}
                <div>
                  <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                    Expected time commitment
                  </label>
                  <select
                    value={timeCommitment}
                    onChange={(e) => setTimeCommitment(e.target.value)}
                    className="w-full rounded-lg border border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] px-3 py-2 text-sm text-[var(--hive-text-primary)] focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="">Select time commitment...</option>
                    <option value="5-10hrs/week">5-10 hours/week</option>
                    <option value="10-15hrs/week">10-15 hours/week</option>
                    <option value="15-20hrs/week">15-20 hours/week</option>
                    <option value="20+hrs/week">20+ hours/week</option>
                  </select>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={hasAgreedToTerms}
                    onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] text-white focus:ring-2 focus:ring-white/20"
                  />
                  <label htmlFor="terms" className="text-sm text-[var(--hive-text-secondary)]">
                    I agree to the <a href="/terms/builders" className="underline hover:text-[var(--hive-text-primary)]">builder terms</a> and will represent this organization responsibly on HIVE.
                  </label>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm text-[var(--hive-status-error)]"
                >
                  {error}
                </motion.p>
              )}

              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={handleClaimRequest}
                  disabled={isSubmitting}
                  className="w-full bg-white text-black hover:bg-neutral-100 font-semibold"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Submit request"
                  )}
                </Button>

                <p className="text-xs text-[var(--hive-text-tertiary)] text-center">
                  We'll verify your role and grant access within 24 hours.
                </p>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-xs text-[var(--hive-text-tertiary)]">
          University at Buffalo
        </p>
      </footer>
    </div>
  );
}

function ClaimPageFallback() {
  return (
    <div className="min-h-screen bg-[var(--hive-background-primary)] flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-[var(--hive-text-tertiary)]" />
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<ClaimPageFallback />}>
      <ClaimContent />
    </Suspense>
  );
}
