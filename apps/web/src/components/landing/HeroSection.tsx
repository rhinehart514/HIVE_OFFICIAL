'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { buildUbEnterUrl } from './entry-url';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

const POLL_OPTIONS = [
  { label: 'Event coordination', baseVotes: 53 },
  { label: 'Member signups', baseVotes: 35 },
  { label: 'Polls & voting', baseVotes: 23 },
  { label: 'Countdowns & reminders', baseVotes: 16 },
];

export function HeroSection() {
  const searchParams = useSearchParams();
  const enterHref = buildUbEnterUrl(searchParams.get('redirect'));
  const browseHref = buildUbEnterUrl(searchParams.get('redirect'), '/discover');

  const [votes, setVotes] = useState(POLL_OPTIONS.map((o) => o.baseVotes));
  const [userVote, setUserVote] = useState<number | null>(null);

  const totalVotes = votes.reduce((sum, v) => sum + v, 0);

  const handleVote = useCallback((index: number) => {
    if (userVote !== null) return; // Already voted
    setUserVote(index);
    setVotes((prev) => prev.map((v, i) => (i === index ? v + 1 : v)));
  }, [userVote]);

  return (
    <section className="min-h-[90vh] flex items-center px-6 pt-16">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto">
        {/* Left: Text */}
        <div>
          <h1
            className={`${clashDisplay} text-[clamp(40px,8vw,80px)] font-semibold leading-[0.92] tracking-tight text-white mb-6`}
          >
            The app UB
            <br />
            was missing.
          </h1>

          <p className="text-base lg:text-lg text-white/50 max-w-md mb-8 leading-relaxed">
            Every registered UB organization starts with a space on HIVE.
            Claim yours, run events and tools, and lead from one place.
          </p>

          {/* CTA pills */}
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <Link
              href={enterHref}
              data-testid="cta-primary"
              className="px-7 py-3.5 bg-[#FFD700] text-black text-[15px] font-medium rounded-full hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={browseHref}
              className="px-7 py-3.5 bg-[#1A1A1A] text-white text-[15px] font-medium rounded-full border border-white/[0.1] hover:bg-white/[0.06] transition-colors"
            >
              Browse spaces
            </Link>
          </div>

          <p className="mt-5 text-[11px] text-white/30 uppercase tracking-[0.15em] font-mono">
            @buffalo.edu required
          </p>
        </div>

        {/* Right: Interactive poll */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-[380px]">
            {/* Indicator */}
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD700] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFD700]" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/50">
                {userVote !== null ? 'VOTED' : 'TAP TO VOTE'}
              </span>
            </div>

            {/* Poll card */}
            <div className="rounded-2xl bg-[#0A0A0A] border border-white/[0.08] p-6">
              <p className="text-[15px] font-medium text-white mb-5">
                What does your club need most?
              </p>

              <div className="space-y-2.5">
                {POLL_OPTIONS.map((option, i) => {
                  const percent = totalVotes > 0 ? Math.round((votes[i] / totalVotes) * 100) : 0;
                  return (
                    <PollOption
                      key={option.label}
                      label={option.label}
                      percent={percent}
                      selected={userVote === i}
                      showResults={userVote !== null}
                      onClick={() => handleVote(i)}
                      disabled={userVote !== null}
                    />
                  );
                })}
              </div>

              <p className="mt-4 text-[11px] font-mono text-white/30">
                {totalVotes} votes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: reorder so CTAs are above fold */}
      <style>{`
        @media (max-width: 1023px) {
          section > div { display: flex; flex-direction: column; }
        }
      `}</style>
    </section>
  );
}

function PollOption({
  label,
  percent,
  selected,
  showResults,
  onClick,
  disabled,
}: {
  label: string;
  percent: number;
  selected?: boolean;
  showResults: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full overflow-hidden rounded-lg px-4 py-3 text-left transition-colors ${
        disabled ? '' : 'hover:bg-white/[0.06] cursor-pointer'
      } ${selected ? 'bg-[#FFD700]/[0.06] border border-[#FFD700]/20' : 'bg-white/[0.03]'}`}
    >
      {/* Fill bar (only visible after voting) */}
      {showResults && (
        <div
          className="absolute inset-y-0 left-0 bg-[#FFD700]/[0.08] transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      )}
      <div className="relative flex items-center justify-between">
        <span className={`text-[13px] ${selected ? 'text-white font-medium' : 'text-white/60'}`}>
          {label}
        </span>
        {showResults && (
          <span className={`text-[13px] font-mono ${selected ? 'text-[#FFD700]' : 'text-white/40'}`}>
            {percent}%
          </span>
        )}
      </div>
    </button>
  );
}
