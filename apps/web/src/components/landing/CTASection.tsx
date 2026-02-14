'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { buildUbEnterUrl } from './entry-url';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

export function CTASection() {
  const searchParams = useSearchParams();
  const enterHref = buildUbEnterUrl(searchParams.get('redirect'));
  const browseHref = buildUbEnterUrl(searchParams.get('redirect'), '/discover');

  return (
    <section className="py-32 md:py-48 px-6 bg-black">
      <div className="max-w-3xl mx-auto text-center">
        <h2
          className={`${clashDisplay} text-[clamp(32px,6vw,56px)] font-semibold leading-tight text-white mb-6`}
        >
          Your club&apos;s already here.
        </h2>

        <p className="text-lg text-white/40 mb-10 max-w-xl mx-auto">
          Claim your space, verify leadership, and start running your org before the next meeting.
        </p>

        {/* Two pills */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={enterHref}
            className="px-8 py-4 bg-[#FFD700] text-black text-base font-medium rounded-full hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            Get started
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href={browseHref}
            className="px-8 py-4 bg-white/[0.06] text-white text-base font-medium rounded-full hover:bg-white/[0.1] transition-colors"
          >
            Browse spaces
          </Link>
        </div>
      </div>
    </section>
  );
}
