'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { buildEnterUrl } from './entry-url';
import { colors } from '@hive/tokens';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

export function CTASection() {
  const searchParams = useSearchParams();
  const enterHref = buildEnterUrl(searchParams.get('redirect'));

  return (
    <section className="relative overflow-hidden bg-black px-6 py-32 md:py-44">
      {/* Ambient glow — green creation energy */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-[0.05]"
        style={{
          background: `radial-gradient(ellipse, ${colors.accentGreen} 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <h2
          className={`${clashDisplay} mb-5 text-[clamp(32px,6vw,56px)] font-semibold leading-tight tracking-[-0.03em] text-white`}
        >
          Nothing&apos;s been built yet.
          <br />
          <span style={{ color: colors.accentGreen }}>You&apos;re early.</span>
        </h2>

        <p className="mx-auto mb-10 max-w-md text-base text-white/40">
          Your campus is a blank canvas. The first builders shape what everyone uses.
          Be the one who built the thing everyone needed.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={enterHref}
            className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-black transition-opacity hover:opacity-90"
          >
            Build something
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <p className="mt-6 font-mono text-[11px] text-white/15">
          your .edu email · takes 30 seconds
        </p>
      </div>
    </section>
  );
}
