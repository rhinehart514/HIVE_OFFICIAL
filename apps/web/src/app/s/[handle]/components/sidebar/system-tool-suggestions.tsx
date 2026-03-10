'use client';

/**
 * SystemToolSuggestions - Contextual app suggestions for leaders.
 * Shows suggestion cards from system-tool-registry that link to /build.
 * Only visible to leaders when < 3 apps are placed.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';

type SpaceType = 'uni' | 'student' | 'greek' | 'residential';

interface Suggestion { name: string; description: string; prompt: string }

const S: Record<SpaceType, Suggestion[]> = {
  uni: [
    { name: 'Announcements', description: 'Post official updates for your community', prompt: 'Create an announcements board for our organization' },
    { name: 'Event RSVP', description: 'Collect RSVPs for your next event', prompt: 'Create an RSVP app for our next event' },
    { name: 'Quick Links', description: 'Share important resources in one place', prompt: 'Create a links page with our important resources' },
  ],
  student: [
    { name: 'Quick Poll', description: 'Get feedback from your members', prompt: 'Create a poll to ask our members a question' },
    { name: 'Event RSVP', description: 'See who is coming to your next meeting', prompt: 'Create an RSVP for our next club meeting' },
    { name: 'Resources', description: 'Share links and docs with members', prompt: 'Create a shared links page for our club' },
  ],
  greek: [
    { name: 'Chapter Poll', description: 'Vote on chapter decisions', prompt: 'Create a poll for our chapter to vote on' },
    { name: 'Rush Event', description: 'Collect RSVPs for rush events', prompt: 'Create an RSVP app for our rush event' },
    { name: 'Points Tracker', description: 'Track participation and engagement', prompt: 'Create a points tracker for chapter participation' },
  ],
  residential: [
    { name: 'Floor Poll', description: 'Vote on floor activities', prompt: 'Create a poll for our floor to decide an activity' },
    { name: 'Floor Events', description: 'RSVP for RA events and hangouts', prompt: 'Create an RSVP for our next floor event' },
    { name: 'Meet Your Neighbors', description: 'Introduce yourself to the floor', prompt: 'Create an introduction board for our floor' },
  ],
};

const STORAGE_KEY = 'hive:dismissed-suggestions';

function getDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function persistDismissed(ids: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids])); } catch { /* noop */ }
}

interface SystemToolSuggestionsProps {
  spaceId: string;
  spaceName: string;
  spaceType: SpaceType;
  placedToolCount: number;
  isLeader: boolean;
}

export function SystemToolSuggestions({
  spaceId, spaceName, spaceType, placedToolCount, isLeader,
}: SystemToolSuggestionsProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  React.useEffect(() => { setDismissed(getDismissed()); }, []);

  if (!isLeader || placedToolCount >= 3) return null;

  const suggestions = S[spaceType] || S.student;
  const visible = suggestions.filter((s) => !dismissed.has(`${spaceId}:${s.name}`));
  if (visible.length === 0) return null;

  const handleDismiss = (name: string) => {
    const next = new Set(dismissed);
    next.add(`${spaceId}:${name}`);
    setDismissed(next);
    persistDismissed(next);
  };

  const handleCreate = (prompt: string) => {
    const params = new URLSearchParams({ prompt, spaceId, spaceName });
    router.push(`/build?${params.toString()}`);
  };

  return (
    <div className="py-4">
      <p className="text-[11px] font-mono uppercase tracking-wider text-white/50 mb-3">
        Suggested apps
      </p>
      <div className="flex flex-col gap-3">
        {visible.slice(0, 3).map((s) => (
          <div
            key={s.name}
            className="rounded-2xl bg-[#161614] border border-white/[0.05] p-4 relative group"
          >
            <button
              onClick={() => handleDismiss(s.name)}
              className="absolute top-3 right-3 p-1 rounded-full text-white/30
                hover:text-white/50 transition-colors duration-100
                opacity-0 group-hover:opacity-100"
              aria-label={`Dismiss ${s.name} suggestion`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="text-[14px] font-medium text-white mb-1">{s.name}</p>
            <p className="text-[13px] text-white/50 mb-3 leading-snug">{s.description}</p>
            <button
              onClick={() => handleCreate(s.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                bg-[#FFD700] text-black text-[13px] font-semibold
                hover:bg-[#FFD700]/90 transition-colors duration-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Create
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

SystemToolSuggestions.displayName = 'SystemToolSuggestions';
