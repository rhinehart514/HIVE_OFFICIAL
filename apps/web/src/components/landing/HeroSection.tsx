'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { buildUbEnterUrl } from './entry-url';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

export function HeroSection() {
  const searchParams = useSearchParams();
  const enterHref = buildUbEnterUrl(searchParams.get('redirect'));
  const browseHref = buildUbEnterUrl(searchParams.get('redirect'), '/discover');

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

        {/* Right: Product mockup */}
        <div className="flex justify-center lg:justify-end">
          <ProductMockup />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Product mockup — CSS-rendered space page with deployed tools
// ─────────────────────────────────────────────────────────────────

function ProductMockup() {
  return (
    <div className="w-full max-w-[440px] select-none">
      {/* Browser chrome */}
      <div className="rounded-t-xl bg-[#161616] border border-white/[0.08] border-b-0 px-4 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-4 py-1 rounded-md bg-white/[0.04] text-[10px] text-white/30 font-mono">
            hive.app/s/ub-photo-club
          </div>
        </div>
        <div className="w-[46px]" />
      </div>

      {/* Page content */}
      <div className="rounded-b-xl bg-[#0A0A0A] border border-white/[0.08] border-t-0 overflow-hidden">
        {/* Space header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/5 border border-[#FFD700]/20 flex items-center justify-center">
              <span className="text-sm">📷</span>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white">UB Photography Club</div>
              <div className="text-[10px] text-white/30 font-mono mt-0.5">47 members</div>
            </div>
            <div className="ml-auto">
              <div className="px-3 py-1.5 rounded-full bg-[#FFD700] text-black text-[10px] font-semibold">
                Joined
              </div>
            </div>
          </div>
        </div>

        {/* Tools grid */}
        <div className="p-4 space-y-3">
          {/* Poll tool */}
          <MockPollCard />

          {/* RSVP + Countdown row */}
          <div className="grid grid-cols-2 gap-3">
            <MockRsvpCard />
            <MockCountdownCard />
          </div>

          {/* Leaderboard tool */}
          <MockLeaderboardCard />
        </div>
      </div>
    </div>
  );
}

function MockPollCard() {
  const options = [
    { label: 'Golden hour at Baird Point', pct: 42 },
    { label: 'Night shoot downtown', pct: 31 },
    { label: 'Campus architecture', pct: 27 },
  ];

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px]">📊</span>
        <span className="text-[11px] font-medium text-white/70">Next Shoot Location</span>
        <span className="ml-auto text-[9px] font-mono text-white/20">38 votes</span>
      </div>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <div key={opt.label} className="relative rounded-md overflow-hidden bg-white/[0.02]">
            <div
              className="absolute inset-y-0 left-0 bg-[#FFD700]/[0.07]"
              style={{ width: `${opt.pct}%` }}
            />
            <div className="relative flex items-center justify-between px-3 py-2">
              <span className="text-[11px] text-white/60">{opt.label}</span>
              <span className="text-[10px] font-mono text-[#FFD700]/70">{opt.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockRsvpCard() {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
      <span className="text-[10px]">🎟️</span>
      <div className="text-[11px] font-medium text-white/70 mt-2">Spring Showcase</div>
      <div className="text-[9px] text-white/30 mt-0.5">Mar 22 · Clemens Hall</div>
      <div className="mt-3 flex items-center gap-2">
        {/* Stacked avatars */}
        <div className="flex -space-x-1.5">
          {['bg-blue-400/40', 'bg-emerald-400/40', 'bg-purple-400/40', 'bg-amber-400/40'].map((bg, i) => (
            <div key={i} className={`w-4 h-4 rounded-full ${bg} border border-[#0A0A0A]`} />
          ))}
        </div>
        <span className="text-[9px] font-mono text-white/30">23 going</span>
      </div>
    </div>
  );
}

function MockCountdownCard() {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
      <span className="text-[10px]">⏳</span>
      <div className="text-[11px] font-medium text-white/70 mt-2">Submission Deadline</div>
      <div className="mt-3 flex items-center gap-1.5">
        {[
          { val: '03', unit: 'd' },
          { val: '14', unit: 'h' },
          { val: '22', unit: 'm' },
        ].map((t) => (
          <div key={t.unit} className="flex items-baseline gap-0.5">
            <span className="text-[15px] font-mono font-semibold text-white/80 tabular-nums">{t.val}</span>
            <span className="text-[8px] text-white/25">{t.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockLeaderboardCard() {
  const entries = [
    { name: 'Maya R.', pts: 340, color: 'bg-[#FFD700]' },
    { name: 'James K.', pts: 285, color: 'bg-white/40' },
    { name: 'Priya S.', pts: 260, color: 'bg-amber-700/60' },
  ];

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px]">🏆</span>
        <span className="text-[11px] font-medium text-white/70">Photo Challenge</span>
      </div>
      <div className="space-y-1.5">
        {entries.map((e, i) => (
          <div key={e.name} className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono text-white/20 w-3">{i + 1}</span>
            <div className={`w-4 h-4 rounded-full ${e.color} opacity-60`} />
            <span className="text-[11px] text-white/50 flex-1">{e.name}</span>
            <span className="text-[10px] font-mono text-white/30">{e.pts} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}
