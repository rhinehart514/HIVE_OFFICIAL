'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

export function CTASection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleJoinUB = useCallback(() => {
    const redirect = searchParams.get('redirect');
    const enterUrl = redirect
      ? `/enter?schoolId=ub-buffalo&domain=buffalo.edu&redirect=${encodeURIComponent(redirect)}`
      : '/enter?schoolId=ub-buffalo&domain=buffalo.edu';
    router.push(enterUrl);
  }, [router, searchParams]);

  return (
    <section className="py-20 md:py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Headline */}
          <h2 className={`${clashDisplay} text-[clamp(32px,6vw,56px)] font-semibold leading-tight text-white mb-6`}>
            Build something real.
          </h2>

          {/* Subhead */}
          <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto">
            From idea to live tool in 30 seconds. No code, no app store, no waiting.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleJoinUB}
              className="px-8 py-4 bg-[#FFD700] text-black text-base font-medium rounded-lg hover:bg-[#FFD700]/90 transition-colors flex items-center justify-center gap-2"
            >
              Join UB
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/enter')}
              className="px-8 py-4 bg-white/10 text-white text-base font-medium rounded-lg hover:bg-white/15 transition-colors"
            >
              Create a space
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
