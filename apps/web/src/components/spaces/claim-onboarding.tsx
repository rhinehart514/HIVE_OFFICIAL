'use client';

/**
 * ClaimOnboarding — 3-step coaching card for leaders who just claimed a space.
 * Step 1: "Your space is live" (auto-complete acknowledgment)
 * Step 2: "Drop something in" (create first app, with example prompts)
 * Step 3: "Get it to your people" (share/invite)
 *
 * Visible when leader has 0 apps OR ≤1 member. Dismissable per space.
 */

import * as React from 'react';
import Link from 'next/link';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { InviteLinkModal } from './invite-link-modal';

/* ─── Prompt suggestions by space type ──────────────────────────── */

const PROMPT_SUGGESTIONS: Record<string, string[]> = {
  greek: ["Who's coming to the mixer?", 'Rate rush events'],
  greek_life: ["Who's coming to the mixer?", 'Rate rush events'],
  student: ['Vote on our next meeting topic', 'RSVP for the study session'],
  student_org: ['Vote on our next meeting topic', 'RSVP for the study session'],
  academic: ["Rate this week's readings", 'Sign up for office hours'],
  campus_living: ['What should we order for the floor?', 'Rate the dorm amenities'],
  residential: ['What should we order for the floor?', 'Rate the dorm amenities'],
  uni: ['RSVP for our next info session', 'Quick poll for your group'],
  university_org: ['RSVP for our next info session', 'Quick poll for your group'],
};

const DEFAULT_PROMPTS = ['Quick poll for your group', 'Event signup'];

/* ─── localStorage key helper ──────────────────────────────────── */

function dismissKey(spaceId: string): string {
  return `hive:claim-onboarding-dismissed:${spaceId}`;
}

/* ─── Props ─────────────────────────────────────────────────────── */

interface ClaimOnboardingProps {
  spaceId: string;
  spaceName: string;
  spaceType?: string;
  sidebarToolCount: number;
  memberCount: number;
  firstToolId?: string;
}

/* ─── Step number circle ────────────────────────────────────────── */

function StepCircle({ step, completed }: { step: number; completed: boolean }) {
  if (completed) {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FFD700] flex-shrink-0">
        <CheckIcon className="w-3 h-3 text-black" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-[#FFD700] flex-shrink-0">
      <span className="text-[11px] font-semibold text-[#FFD700]">{step}</span>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────────── */

export function ClaimOnboarding({
  spaceId,
  spaceName,
  spaceType,
  sidebarToolCount,
  memberCount,
  firstToolId,
}: ClaimOnboardingProps) {
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  /* Check localStorage dismissal on mount */
  React.useEffect(() => {
    try {
      if (localStorage.getItem(dismissKey(spaceId)) === '1') {
        setDismissed(true);
      }
    } catch {
      /* SSR or blocked storage — ignore */
    }
  }, [spaceId]);

  if (dismissed) return null;

  /* Step completion logic */
  const step1Done = true; // always complete — just acknowledgment
  const step2Done = sidebarToolCount > 0;
  const step3Done = memberCount > 1;

  /* If all steps are done, don't render */
  if (step1Done && step2Done && step3Done) return null;

  /* Current active step */
  const activeStep = !step2Done ? 2 : 3;

  /* Prompt suggestions */
  const prompts = (spaceType ? PROMPT_SUGGESTIONS[spaceType] : undefined) ?? DEFAULT_PROMPTS;

  /* Build href for create CTA */
  const buildHref = `/build?${new URLSearchParams({ spaceId, spaceName }).toString()}`;

  /* Copy first app link */
  function handleCopyAppLink() {
    if (!firstToolId) return;
    const url = `${window.location.origin}/t/${firstToolId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDismiss() {
    try {
      localStorage.setItem(dismissKey(spaceId), '1');
    } catch {
      /* blocked storage */
    }
    setDismissed(true);
  }

  return (
    <>
      <div className="rounded-2xl border border-white/[0.05] bg-card p-4 relative">
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/30 hover:text-white/50 transition-colors duration-100"
          aria-label="Dismiss onboarding"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-4">
          {/* ── Step 1: Your space is live (always completed) ── */}
          <div className="flex items-start gap-3">
            <StepCircle step={1} completed={step1Done} />
            <div className="min-w-0 pt-px">
              <p className="text-[14px] font-medium text-white/50">
                {spaceName} is yours
              </p>
            </div>
          </div>

          {/* ── Step 2: Drop something in ── */}
          <div className="flex items-start gap-3">
            <StepCircle step={2} completed={step2Done} />
            <div className="min-w-0 flex-1 pt-px">
              {step2Done ? (
                <p className="text-[14px] font-medium text-white/50">
                  First app created
                </p>
              ) : (
                <>
                  <p className="text-[15px] font-medium text-white">
                    Drop something in
                  </p>
                  <p className="text-[13px] text-white/50 mt-1">
                    Polls, brackets, signups — your people can respond right from the link, no download
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <Link
                      href={buildHref}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#FFD700] text-black text-[13px] font-semibold hover:opacity-90 transition-opacity duration-100 w-fit"
                    >
                      Create your first app
                    </Link>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {prompts.map((prompt) => {
                        const href = `/build?${new URLSearchParams({ prompt, spaceId, spaceName }).toString()}`;
                        return (
                          <Link
                            key={prompt}
                            href={href}
                            className="px-3 py-1 rounded-full border border-white/[0.1] text-[12px] text-white/50 hover:text-white/70 hover:border-white/[0.2] transition-colors duration-100"
                          >
                            {prompt}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Step 3: Get it to your people (only after step 2) ── */}
          {step2Done && (
            <div className="flex items-start gap-3">
              <StepCircle step={3} completed={step3Done} />
              <div className="min-w-0 flex-1 pt-px">
                <p className="text-[15px] font-medium text-white">
                  Get it to your people
                </p>
                <p className="text-[13px] text-white/50 mt-1">
                  Drop it in your GroupMe or text chain — no account needed to respond
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setInviteModalOpen(true)}
                    className="px-4 py-1.5 rounded-full border border-white/[0.05] text-[13px] text-white font-medium hover:bg-white/[0.10] transition-colors duration-100"
                  >
                    Invite members
                  </button>
                  {firstToolId && (
                    <button
                      onClick={handleCopyAppLink}
                      className="px-4 py-1.5 rounded-full border border-white/[0.05] text-[13px] text-white font-medium hover:bg-white/[0.10] transition-colors duration-100"
                    >
                      {copied ? 'Copied!' : 'Copy app link'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <InviteLinkModal
        spaceId={spaceId}
        spaceName={spaceName}
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </>
  );
}
