'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { buildUbEnterUrl } from './entry-url';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

export function HeroSection() {
  const searchParams = useSearchParams();

  const claimHref = buildUbEnterUrl(searchParams.get('redirect'), '/spaces?claim=true');
  const browseHref = buildUbEnterUrl(searchParams.get('redirect'), '/discover');

  return (
    <section className="min-h-[85vh] relative flex items-center justify-center">
      <div className="px-6 text-center max-w-3xl mx-auto">
        {/* Live badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--life-gold,#FFD700)]" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/50">
            UB CLUBS ARE LIVE
          </span>
        </div>

        {/* Main headline */}
        <h1
          className={`${clashDisplay} text-[clamp(48px,10vw,96px)] font-semibold leading-[0.9] tracking-tight text-white mb-8`}
        >
          Your club is
          <br />
          already here.
        </h1>

        {/* Subhead */}
        <p className="text-base lg:text-lg text-white/50 max-w-lg mx-auto mb-10 leading-relaxed">
          Every registered UB organization starts with a space on HIVE. Claim yours, set up events and tools,
          and run your community from one place.
        </p>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={claimHref}
            data-testid="cta-primary"
            className="w-full sm:w-auto px-8 py-4 bg-[var(--life-gold,#FFD700)] text-black text-base font-medium rounded-full hover:bg-[var(--life-gold,#FFD700)]/90 transition-colors flex items-center justify-center gap-2"
          >
            Claim Your Club
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href={browseHref}
            className="w-full sm:w-auto px-8 py-4 border border-white/[0.12] text-white text-base font-medium rounded-full hover:bg-white/[0.06] transition-colors"
          >
            Browse Campus Spaces
          </Link>
        </div>

        <p className="mt-4 text-xs text-white/40 uppercase tracking-[0.15em] font-mono">
          @buffalo.edu required for leadership verification
        </p>
      </div>
    </section>
  );
}
