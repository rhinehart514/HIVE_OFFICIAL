"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Button, Input } from "@hive/ui";
import { motion } from "framer-motion";

export const dynamic = "force-dynamic";

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

const CATEGORY_OPTIONS = [
  { value: 'student_org', label: 'Student Organization', description: 'Clubs, teams, academic groups' },
  { value: 'residential', label: 'Residential', description: 'Dorms, halls, living communities' },
  { value: 'greek_life', label: 'Greek Life', description: 'Fraternities, sororities, chapters' },
];

const JOIN_POLICY_OPTIONS = [
  { value: 'open', label: 'Open', description: 'Anyone can join immediately' },
  { value: 'approval', label: 'Approval Required', description: 'Leaders approve join requests' },
  { value: 'invite_only', label: 'Invite Only', description: 'Members must be invited' },
];

function CreateSpaceContent() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [joinPolicy, setJoinPolicy] = useState("open");
  const [visibility, setVisibility] = useState("public");
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSpace, setCreatedSpace] = useState<{ id: string; name: string } | null>(null);

  const handleCreate = async () => {
    // Validate
    if (!name.trim()) {
      setError("Please enter a space name");
      return;
    }
    if (name.length > 100) {
      setError("Name must be under 100 characters");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }
    if (description.length > 500) {
      setError("Description must be under 500 characters");
      return;
    }
    if (!category) {
      setError("Please select a category");
      return;
    }
    if (!agreedToGuidelines) {
      setError("You must agree to the community guidelines");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          joinPolicy,
          visibility,
          tags: [],
          agreedToGuidelines,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to create space");
      }

      setCreatedSpace({ id: data.space?.id, name: name.trim() });

      // Redirect to the new space after delay
      setTimeout(() => {
        router.push(`/spaces/${data.space?.id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create space");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdSpace) {
    return (
      <div className="min-h-screen bg-[var(--hive-background-primary)] text-[var(--hive-text-primary)] flex flex-col">
        <header className="p-4">
          <div className="flex items-center gap-2">
            <Image src="/assets/hive-logo-gold.svg" alt="HIVE" width={28} height={28} />
            <span className="text-lg font-bold text-[var(--hive-text-primary)]">HIVE</span>
          </div>
        </header>

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
                  Space created!
                </h1>
                <p className="text-[var(--hive-text-secondary)]">
                  <strong>{createdSpace.name}</strong> is now live. Redirecting you there...
                </p>
              </div>
            </motion.div>
          </div>
        </main>

        <footer className="p-4 text-center">
          <p className="text-xs text-[var(--hive-text-tertiary)]">University at Buffalo</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--hive-background-primary)] text-[var(--hive-text-primary)] flex flex-col">
      <header className="p-4">
        <div className="flex items-center gap-2">
          <Image src="/assets/hive-logo-gold.svg" alt="HIVE" width={28} height={28} />
          <span className="text-lg font-bold text-[var(--hive-text-primary)]">HIVE</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 md:px-6 py-8 md:py-12">
        <div className="w-full max-w-md">
          <motion.div
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            transition={transition}
            className="space-y-6"
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--hive-text-primary)] mb-2">
                Create a space
              </h1>
              <p className="text-sm md:text-base text-[var(--hive-text-secondary)]">
                Start a new community on HIVE
              </p>
            </div>

            <div className="bg-[var(--hive-background-secondary)] rounded-2xl p-5 md:p-6 border border-[var(--hive-border-default)] space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                  Space name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., UB Photography Club"
                  maxLength={100}
                />
                <div className="mt-1 text-xs text-[var(--hive-text-tertiary)] text-right">
                  {name.length}/100
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this space about? What will members do here?"
                  className="w-full rounded-lg border border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] px-3 py-2 text-sm text-[var(--hive-text-primary)] placeholder:text-[var(--hive-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[80px] resize-none"
                  maxLength={500}
                />
                <div className="mt-1 text-xs text-[var(--hive-text-tertiary)] text-right">
                  {description.length}/500
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                  Category
                </label>
                <div className="space-y-2">
                  {CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCategory(option.value)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                        category === option.value
                          ? 'border-white bg-white/5'
                          : 'border-[var(--hive-border-default)] hover:border-[var(--hive-text-tertiary)]'
                      }`}
                    >
                      <div className="font-medium text-[var(--hive-text-primary)] text-sm">
                        {option.label}
                      </div>
                      <div className="text-xs text-[var(--hive-text-tertiary)]">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Join Policy */}
              <div>
                <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                  Who can join?
                </label>
                <select
                  value={joinPolicy}
                  onChange={(e) => setJoinPolicy(e.target.value)}
                  className="w-full rounded-lg border border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] px-3 py-2 text-sm text-[var(--hive-text-primary)] focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  {JOIN_POLICY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full rounded-lg border border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] px-3 py-2 text-sm text-[var(--hive-text-primary)] focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="public">Public - Anyone can see posts</option>
                  <option value="members_only">Members Only - Only members see content</option>
                </select>
              </div>

              {/* Guidelines Agreement */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="guidelines"
                  checked={agreedToGuidelines}
                  onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] text-white focus:ring-2 focus:ring-white/20"
                />
                <label htmlFor="guidelines" className="text-sm text-[var(--hive-text-secondary)]">
                  I agree to the{" "}
                  <a href="/guidelines" className="underline hover:text-[var(--hive-text-primary)]">
                    community guidelines
                  </a>{" "}
                  and will moderate this space responsibly.
                </label>
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

              <Button
                type="button"
                onClick={handleCreate}
                disabled={isSubmitting}
                className="w-full bg-white text-black hover:bg-neutral-100 font-semibold"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create space"
                )}
              </Button>

              <p className="text-xs text-[var(--hive-text-tertiary)] text-center">
                You'll become the owner of this space.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="p-4 text-center">
        <p className="text-xs text-[var(--hive-text-tertiary)]">University at Buffalo</p>
      </footer>
    </div>
  );
}

function CreateSpaceFallback() {
  return (
    <div className="min-h-screen bg-[var(--hive-background-primary)] flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-[var(--hive-text-tertiary)]" />
    </div>
  );
}

export default function CreateSpacePage() {
  return (
    <Suspense fallback={<CreateSpaceFallback />}>
      <CreateSpaceContent />
    </Suspense>
  );
}
