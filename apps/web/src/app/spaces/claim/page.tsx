"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Check, Plus, Lock, Shield, Clock, Sparkles } from "lucide-react";
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
  status?: 'unclaimed' | 'active' | 'claimed' | 'verified';
}

// Role options for leaders
const ROLE_OPTIONS = [
  { value: 'president', label: 'President' },
  { value: 'vice_president', label: 'Vice President' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'board_member', label: 'Board Member' },
  { value: 'founder', label: 'Founder' },
  { value: 'advisor', label: 'Advisor' },
  { value: 'other', label: 'Other Role' },
];

// Proof type options
const PROOF_OPTIONS = [
  { value: 'none', label: "I'll verify later", description: 'Get started now, provide proof anytime' },
  { value: 'email', label: 'Organization email', description: 'Email from an @organization domain' },
  { value: 'social', label: 'Social media link', description: 'Link to org\'s official social media' },
  { value: 'document', label: 'Document', description: 'Roster, charter, or official document' },
];

// Category-based leadership rules
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
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const transition = {
  duration: 0.25,
  ease: [0.22, 1, 0.36, 1],
};

function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

function ClaimContent() {
  const router = useRouter();

  // Steps: search → claim → success
  const [step, setStep] = useState<'search' | 'claim' | 'success'>('search');

  // Search state
  const [query, setQuery] = useState("");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

  // Claim form state
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [proofType, setProofType] = useState("none");
  const [proofUrl, setProofUrl] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search spaces
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

  const handleSelectSpace = (space: Space) => {
    setSelectedSpace(space);
    setStep('claim');
    setError(null);
  };

  const handleSubmitClaim = async () => {
    if (!selectedSpace || !role) {
      setError("Please select your role in the organization");
      return;
    }

    const finalRole = role === 'other' ? customRole : ROLE_OPTIONS.find(r => r.value === role)?.label || role;

    if (role === 'other' && !customRole.trim()) {
      setError("Please specify your role");
      return;
    }

    if (proofType !== 'none' && !proofUrl.trim()) {
      setError("Please provide the proof URL or select 'I'll verify later'");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/spaces/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: selectedSpace.id,
          role: finalRole,
          proofType,
          proofUrl: proofType !== 'none' ? proofUrl : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to claim space");
      }

      setStep('success');

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-redirect to space after brief success message
  useEffect(() => {
    if (step === 'success' && selectedSpace) {
      const timer = setTimeout(() => {
        router.push(`/spaces/${selectedSpace.id}`);
      }, 2500); // Show success briefly, then redirect
      return () => clearTimeout(timer);
    }
  }, [step, selectedSpace, router]);

  // Success screen
  if (step === 'success' && selectedSpace) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <motion.div
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            transition={transition}
            className="w-full max-w-md space-y-6 text-center"
          >
            {/* Success icon */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-amber-500" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold mb-2">
                Welcome, Leader!
              </h1>
              <p className="text-[#A1A1A6]">
                You now have provisional access to <span className="text-white font-medium">{selectedSpace.name}</span>
              </p>
            </div>

            {/* What's next */}
            <div className="bg-[#141414] rounded-xl border border-white/5 p-5 text-left space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                What happens now?
              </h3>
              <ul className="space-y-3 text-sm text-[#A1A1A6]">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-medium">1</span>
                  <span><strong className="text-white">Start setting up</strong> — Post a welcome message, deploy tools, invite co-leaders</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 text-white/50 flex items-center justify-center text-xs font-medium">2</span>
                  <span><strong className="text-white">We verify</strong> — Usually within 24 hours</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 text-white/50 flex items-center justify-center text-xs font-medium">3</span>
                  <span><strong className="text-white">Go live</strong> — Your space becomes discoverable</span>
                </li>
              </ul>
            </div>

            {/* CTA with auto-redirect indicator */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => router.push(`/spaces/${selectedSpace.id}`)}
                className="w-full bg-white text-black hover:bg-neutral-100 font-semibold flex items-center justify-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Taking you to your space...
              </Button>
              <p className="text-xs text-[#818187]">
                Your space is in stealth mode until verified
              </p>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // Claim form
  if (step === 'claim' && selectedSpace) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <motion.div
            key="claim"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="w-full max-w-md space-y-6"
          >
            <button
              type="button"
              onClick={() => {
                setStep('search');
                setError(null);
              }}
              className="text-sm text-[#A1A1A6] hover:text-white transition-colors"
            >
              ← Back to search
            </button>

            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">
                Claim your space
              </h1>
              <p className="text-[#A1A1A6]">
                Get instant access while we verify your role
              </p>
            </div>

            {/* Selected space */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="font-medium">{selectedSpace.name}</div>
                <div className="text-xs text-[#A1A1A6]">
                  {CATEGORY_LABELS[selectedSpace.category] || selectedSpace.category} · Unclaimed
                </div>
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your role in this organization
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                        role === option.value
                          ? 'border-white bg-white/5'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {role === 'other' && (
                  <Input
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Enter your role..."
                    className="mt-2"
                  />
                )}
              </div>

              {/* Proof selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Verification (optional)
                </label>
                <div className="space-y-2">
                  {PROOF_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProofType(option.value)}
                      className={`w-full px-3 py-2.5 rounded-lg border text-left transition-all ${
                        proofType === option.value
                          ? 'border-white bg-white/5'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs text-[#818187]">{option.description}</div>
                    </button>
                  ))}
                </div>
                {proofType !== 'none' && (
                  <Input
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder={
                      proofType === 'email' ? 'your@organization.edu' :
                      proofType === 'social' ? 'https://instagram.com/yourorg' :
                      'https://docs.google.com/...'
                    }
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}

            <div className="space-y-3 pt-2">
              <Button
                onClick={handleSubmitClaim}
                disabled={isSubmitting || !role}
                className="w-full bg-white text-black hover:bg-neutral-100 font-semibold disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Claim Space"
                )}
              </Button>
              <p className="text-xs text-[#818187] text-center">
                You'll get provisional access immediately
              </p>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // Search screen (default)
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          key="search"
          variants={fadeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Claim your organization
            </h1>
            <p className="text-[#A1A1A6]">
              Search for your club or org to become its leader on HIVE
            </p>
          </div>

          <div className="bg-[#141414] rounded-2xl p-5 border border-white/5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#818187]" />
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
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {isSearching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-[#818187]" />
                </div>
              )}

              <AnimatePresence>
                {!isSearching && spaces.length > 0 && spaces.map((space) => {
                  const locked = isLockedCategory(space.category);
                  const claimed = space.isClaimed || space.status === 'claimed' || space.status === 'verified';

                  return (
                    <motion.button
                      key={space.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      type="button"
                      onClick={() => !locked && !claimed && handleSelectSpace(space)}
                      disabled={locked || claimed}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                        locked || claimed
                          ? 'border-white/5 bg-white/[0.02] opacity-60 cursor-not-allowed'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{space.name}</div>
                          <div className="text-xs text-[#818187]">
                            {CATEGORY_LABELS[space.category] || space.category} · {space.memberCount} members
                          </div>
                        </div>
                        {locked ? (
                          <span className="flex items-center gap-1 text-xs text-[#818187]">
                            <Lock className="h-3 w-3" />
                            Locked
                          </span>
                        ) : claimed ? (
                          <span className="text-xs text-[#818187]">
                            Claimed
                          </span>
                        ) : (
                          <span className="text-xs text-amber-500">
                            Unclaimed
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>

              {!isSearching && query && spaces.length === 0 && (
                <div className="py-4 text-center">
                  <p className="text-sm text-[#A1A1A6]">No spaces found</p>
                </div>
              )}
            </div>

            {/* Create new option */}
            <button
              type="button"
              onClick={() => router.push("/spaces/create")}
              className="flex w-full items-center gap-3 rounded-lg border border-dashed border-white/10 px-4 py-3 text-left transition-colors hover:border-white/20"
            >
              <Plus className="h-4 w-4 text-[#818187]" />
              <div>
                <div className="text-sm font-medium">Can't find your org?</div>
                <div className="text-xs text-[#818187]">Create a new space</div>
              </div>
            </button>

            {/* Skip */}
            <button
              type="button"
              onClick={() => router.push("/spaces")}
              className="w-full text-sm text-[#A1A1A6] hover:text-white transition-colors"
            >
              Skip for now
            </button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="p-4">
      <div className="flex items-center gap-2">
        <Image
          src="/assets/hive-logo-gold.svg"
          alt="HIVE"
          width={28}
          height={28}
        />
        <span className="text-lg font-bold">HIVE</span>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="p-4 text-center">
      <p className="text-xs text-[#818187]">University at Buffalo</p>
    </footer>
  );
}

function ClaimPageFallback() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-[#818187]" />
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
