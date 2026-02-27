'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { buildUbEnterUrl } from './entry-url';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

export function CTASection() {
  const searchParams = useSearchParams();
  const enterHref = buildUbEnterUrl(searchParams.get('redirect'), '/lab');

  return (
    <section className="relative overflow-hidden bg-black px-6 py-32 md:py-44">
      {/* Warm ambient glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-[0.06]"
        style={{
          background: 'radial-gradient(ellipse, #FFD700 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <h2
          className={`${clashDisplay} mb-5 text-[clamp(32px,6vw,56px)] font-semibold leading-tight tracking-tight text-white`}
        >
          Your next creation is one prompt away.
        </h2>

        <p className="mx-auto mb-10 max-w-md text-base text-white/40">
          Join students already building apps their orgs actually use. Free, instant, no code.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={enterHref}
            className="flex items-center gap-2 rounded-full bg-[#FFD700] px-8 py-4 text-base font-medium text-black transition-opacity hover:opacity-90"
          >
            Start building
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <p className="mt-6 font-mono text-[11px] text-white/15">
          @buffalo.edu · takes 30 seconds
        </p>
      </div>
    </section>
  );
}
