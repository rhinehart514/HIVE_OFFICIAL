'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { buildEnterUrl } from './entry-url';

const displayFont = "font-display";

export function CTASection() {
  const searchParams = useSearchParams();
  const enterHref = buildEnterUrl(searchParams.get('redirect'));

  return (
    <section className="relative overflow-hidden bg-[var(--bg-void)] px-6 py-24 md:py-32">
      {/* Gold radial glow behind CTA */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center 60%, rgba(255,215,0,0.05) 0%, transparent 60%)',
        }}
      />
      <div className="relative mx-auto max-w-2xl text-center">
        <h2
          className={`${displayFont} mb-5 text-[clamp(32px,6vw,56px)] font-bold leading-tight tracking-[-0.03em] text-white`}
        >
          Build for
          <br />
          <span className="text-[#FFD700]">your people.</span>
        </h2>

        <p className="mx-auto mb-10 max-w-md text-base text-white/50">
          650+ orgs are already here. Build something yours actually needs.
        </p>

        <Link
          href={enterHref}
          className="inline-block rounded-full bg-[#FFD700] px-8 py-4 text-base font-semibold text-black transition-opacity hover:opacity-90"
        >
          Get started
        </Link>

        <p className="mt-4 text-[13px] text-white/50">
          Free with your .edu email
        </p>
        <p className="mt-2 font-mono text-[11px] text-white/30">
          your .edu email · takes 30 seconds
        </p>
      </div>
    </section>
  );
}
