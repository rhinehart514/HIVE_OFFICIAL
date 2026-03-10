'use client';

/**
 * ClaimOnboarding — two-step strip for leaders who just claimed a space.
 * Step 1: Invite your people (opens existing InviteLinkModal)
 * Step 2: Create your first app (links to /build with space context)
 *
 * Auto-dismisses when the space has 1+ apps.
 */

import * as React from 'react';
import Link from 'next/link';
import { UserPlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Mono } from '@hive/ui/design-system/primitives';
import { InviteLinkModal } from './invite-link-modal';

/* ─── Prompt suggestions by space type ──────────────────────────── */

const PROMPT_SUGGESTIONS: Record<string, string> = {
  greek: "Who's coming to the mixer?",
  greek_life: "Who's coming to the mixer?",
  student: 'Vote on our next meeting topic',
  student_org: 'Vote on our next meeting topic',
  campus_living: 'What should we order for the floor?',
  residential: 'What should we order for the floor?',
  uni: 'RSVP for our next info session',
  university_org: 'RSVP for our next info session',
};

/* ─── Props ─────────────────────────────────────────────────────── */

interface ClaimOnboardingProps {
  spaceId: string;
  spaceName: string;
  spaceType?: string;
}

/* ─── Component ─────────────────────────────────────────────────── */

export function ClaimOnboarding({
  spaceId,
  spaceName,
  spaceType,
}: ClaimOnboardingProps) {
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);

  const promptHint = spaceType ? PROMPT_SUGGESTIONS[spaceType] : undefined;
  const buildHref = `/build?${new URLSearchParams({
    spaceId,
    spaceName,
    ...(promptHint ? { prompt: promptHint } : {}),
  }).toString()}`;

  return (
    <>
      <div className="rounded-2xl border border-white/[0.05] bg-card p-4">
        <Mono size="label" className="text-white/50 mb-4 block">
          GET STARTED
        </Mono>

        <div className="flex flex-col gap-3">
          {/* Step 1: Invite */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] flex-shrink-0">
              <UserPlusIcon className="w-4 h-4 text-white/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-white/70">
                Invite your people so they see what you build.
              </p>
            </div>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="px-4 py-1.5 rounded-full border border-white/[0.1] text-[13px] text-white font-medium hover:bg-white/[0.06] transition-colors duration-100 flex-shrink-0"
            >
              Invite
            </button>
          </div>

          {/* Step 2: Create first app */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] flex-shrink-0">
              <SparklesIcon className="w-4 h-4 text-[#FFD700]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-white/70">
                {promptHint
                  ? `Try: "${promptHint}"`
                  : 'Create a poll, bracket, or RSVP for your space.'}
              </p>
            </div>
            <Link
              href={buildHref}
              className="px-4 py-1.5 rounded-full bg-[#FFD700] text-black text-[13px] font-semibold hover:opacity-90 transition-opacity duration-100 flex-shrink-0"
            >
              Create app
            </Link>
          </div>
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
