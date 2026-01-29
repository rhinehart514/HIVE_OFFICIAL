'use client';

/**
 * HIVE Landing Page
 * Editorial layout + worldview-aligned copy + subtle gold narrative
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import {
  motion,
  NoiseOverlay,
  Logo,
  MOTION,
} from '@hive/ui/design-system/primitives';
import { ArrowRight, X, Check } from 'lucide-react';
import { logger } from '@/lib/logger';

const EASE = MOTION.ease.premium;
const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

// ============================================
// MOTION COMPONENTS
// ============================================

function useParallax(scrollProgress: ReturnType<typeof useScroll>['scrollYProgress'], distance: number) {
  return useTransform(scrollProgress, [0, 1], [-distance, distance]);
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function StaggerText({ children, delay = 0 }: { children: string; delay?: number }) {
  return (
    <>
      {children.split(' ').map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: delay + i * 0.08, ease: EASE }}
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}

// ============================================
// DATA
// ============================================

interface School {
  id: string;
  name: string;
  domain: string;
  isActive?: boolean;
}

const fallbackSchools: School[] = [
  { id: 'ub-buffalo', name: 'University at Buffalo', domain: 'buffalo.edu', isActive: true },
];

// ============================================
// WAITLIST MODAL
// ============================================

function WaitlistModal({ school, onClose }: { school: School | null; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!school) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/waitlist/school-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), schoolName: school.name, schoolId: school.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to join waitlist');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-2xl p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/50 transition-colors">
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <motion.div
              className="w-12 h-12 rounded-full border border-[#FFD700]/30 flex items-center justify-center mx-auto mb-5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Check className="w-5 h-5 text-[#FFD700]" />
            </motion.div>
            <p className={`text-lg font-medium text-white mb-2 ${clashDisplay}`}>You&apos;re on the list</p>
            <p className="text-sm text-white/40">We&apos;ll let you know when we expand.</p>
          </div>
        ) : (
          <>
            <p className={`text-lg font-medium text-white mb-1 ${clashDisplay}`}>Get notified</p>
            <p className="text-sm text-white/40 mb-6">We&apos;ll let you know when your campus is ready.</p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#FFD700]/30 transition-colors mb-4"
              />
              {error && <p className="text-sm text-red-400/80 mb-4">{error}</p>}
              <button
                type="submit"
                disabled={!email.trim() || isSubmitting}
                className="w-full py-3 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? 'Joining...' : 'Notify me'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function LandingPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>(fallbackSchools);
  const [requestSchool, setRequestSchool] = useState<School | null>(null);
  const [mounted, setMounted] = useState(false);

  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const parallax1 = useParallax(smoothScroll, 60);
  const parallax2 = useParallax(smoothScroll, 80);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function fetchSchools() {
      try {
        const res = await fetch('/api/schools');
        if (res.ok) {
          const data = await res.json();
          setSchools(data.filter((s: School) => s?.name).map((s: School & { status?: string; active?: boolean }) => ({
            ...s,
            isActive: s.status === 'active' || s.active === true,
          })));
        }
      } catch (e) {
        logger.error('Failed to fetch schools', { component: 'LandingPage' }, e instanceof Error ? e : undefined);
      }
    }
    fetchSchools();
  }, []);

  const activeSchool = schools.find(s => s.isActive) || fallbackSchools[0];
  const handleEnter = useCallback(() => {
    router.push(`/enter?schoolId=${activeSchool.id}&domain=${activeSchool.domain}`);
  }, [router, activeSchool]);
  const handleWaitlist = useCallback(() => {
    setRequestSchool({ id: 'other', name: 'your school', domain: '', isActive: false });
  }, []);

  if (!mounted) return <div className="min-h-screen bg-[#030303]" />;

  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-x-hidden">
      <NoiseOverlay />

      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-40 px-6 py-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo variant="mark" size="sm" color="gold" />
          <div className="flex items-center gap-6">
            <Link href="/about" className="text-sm text-white/40 hover:text-white/60 transition-colors">About</Link>
            <button onClick={handleEnter} className="text-sm text-white/60 hover:text-white transition-colors">Enter</button>
          </div>
        </div>
      </motion.header>

      {/* ===== HERO ===== */}
      <section className="min-h-screen relative flex flex-col">
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 flex-1 flex flex-col">

          {/* Top tag with gold accent */}
          <motion.div
            className="mb-auto flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">
              Live at UB
            </p>
          </motion.div>

          {/* Giant headline */}
          <div className="flex-1 flex items-center py-12">
            <div className="relative">
              <h1 className={`${clashDisplay} text-[clamp(52px,13vw,150px)] font-semibold leading-[0.88] tracking-[-0.03em]`}>
                <span className="text-white block"><StaggerText delay={0.2}>Build</StaggerText></span>
                <span className="text-white/20 block"><StaggerText delay={0.35}>together.</StaggerText></span>
              </h1>

              {/* Gold accent line */}
              <motion.div
                className="absolute -left-6 top-1/2 -translate-y-1/2 w-px h-16 bg-gradient-to-b from-transparent via-[#FFD700]/40 to-transparent"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              />
            </div>
          </div>

          {/* Bottom row */}
          <motion.div
            className="mt-auto flex flex-col md:flex-row md:items-end md:justify-between gap-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="md:max-w-md">
              <p className="text-base text-white/40 leading-relaxed mb-8">
                Infrastructure for students who build. Spaces to organize.
                Tools to create. Community that persists.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleEnter}
                  className="group px-6 py-3 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                  Enter HIVE
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={handleWaitlist}
                  className="px-6 py-3 border border-white/10 text-white/50 rounded-full text-sm hover:border-white/20 hover:text-white/70 transition-all"
                >
                  Other campus
                </button>
              </div>
            </div>

            {/* Parallax number with gold tint */}
            <motion.p
              className={`${clashDisplay} hidden md:block text-[100px] font-semibold leading-none text-[#FFD700]/[0.04] select-none`}
              style={{ y: parallax1 }}
            >
              01
            </motion.p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-6 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            className="w-px h-8 bg-[#FFD700]/20"
            animate={{ scaleY: [1, 1.2, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/20">Scroll</span>
        </motion.div>
      </section>

      {/* ===== THE GAP ===== */}
      <section className="py-32 md:py-40 border-t border-white/[0.04] relative overflow-hidden">
        <motion.span
          className={`${clashDisplay} absolute -right-10 top-10 text-[200px] font-bold text-white/[0.015] select-none pointer-events-none`}
          style={{ y: parallax2 }}
        >
          ?
        </motion.span>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid md:grid-cols-12 gap-12 md:gap-20">
            {/* Left */}
            <div className="md:col-span-7">
              <div className="flex items-center gap-3 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/60" />
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">The gap</p>
              </div>
              <h2 className={`${clashDisplay} text-[clamp(32px,5.5vw,56px)] font-semibold leading-[1.05] tracking-[-0.02em]`}>
                <span className="text-white">Institutions can&apos;t build</span>
                <br />
                <span className="text-white/20">what students need.</span>
              </h2>
            </div>

            {/* Right */}
            <div className="md:col-span-5 md:pt-16 space-y-8">
              {[
                { label: 'Too slow', desc: 'Enterprise software takes years. Students need tools now.' },
                { label: 'Too rigid', desc: 'One-size-fits-all platforms. Every community is different.' },
                { label: 'Too extractive', desc: 'Platforms optimize for engagement, not outcomes.' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#FFD700]/50 mb-2">{item.label}</p>
                  <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== THE PATTERN ===== */}
      <section className="py-32 md:py-40 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/60" />
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">The pattern</p>
            </div>
            <h2 className={`${clashDisplay} text-[clamp(32px,5.5vw,56px)] font-semibold leading-[1.05] tracking-[-0.02em] max-w-3xl`}>
              <span className="text-white">Students build what&apos;s missing.</span>
              <br />
              <span className="text-white/20">Institutions adopt what works.</span>
            </h2>
            <p className="text-base text-white/30 mt-6 max-w-xl leading-relaxed">
              Facebook started in a dorm. So did most things that matter. The pattern isn&apos;t random—it&apos;s structural. We&apos;re just the infrastructure.
            </p>
          </div>

          {/* Staggered cards */}
          <div className="grid md:grid-cols-12 gap-6 md:gap-10">
            {/* Card 1 */}
            <motion.div
              className="md:col-span-6 p-8 md:p-10 border border-white/[0.06] rounded-2xl group hover:border-[#FFD700]/10 transition-all"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <p className={`${clashDisplay} text-[48px] font-semibold text-[#FFD700]/[0.08] leading-none mb-4`}>01</p>
              <h3 className={`${clashDisplay} text-xl font-medium text-white mb-2`}>Spaces</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Permanent homes for every org. Chat, members, resources—infrastructure that persists when leaders graduate.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              className="md:col-span-6 md:mt-16 p-8 md:p-10 border border-white/[0.06] rounded-2xl group hover:border-[#FFD700]/10 transition-all"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <p className={`${clashDisplay} text-[48px] font-semibold text-[#FFD700]/[0.08] leading-none mb-4`}>02</p>
              <h3 className={`${clashDisplay} text-xl font-medium text-white mb-2`}>Identity</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Campus-verified profiles. Real names, real trust. You know who you&apos;re building with.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              className="md:col-span-7 md:col-start-3 p-8 md:p-10 border border-white/[0.06] rounded-2xl group hover:border-[#FFD700]/10 transition-all"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <p className={`${clashDisplay} text-[48px] font-semibold text-[#FFD700]/[0.08] leading-none mb-4`}>03</p>
              <h3 className={`${clashDisplay} text-xl font-medium text-white mb-2`}>Tools</h3>
              <p className="text-sm text-white/40 leading-relaxed max-w-md">
                Build what your community needs. Polls, forms, schedules—no code required. Ship in minutes.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== MOMENTUM ===== */}
      <section className="py-32 md:py-40 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-16">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/60" />
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">Momentum</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-12 md:gap-20 mb-24">
            <div>
              <p className={`${clashDisplay} text-[clamp(48px,9vw,80px)] font-semibold text-white leading-none`}>
                <AnimatedCounter value={400} suffix="+" />
              </p>
              <p className="text-sm text-white/30 mt-3">Organizations ready</p>
            </div>
            <div>
              <p className={`${clashDisplay} text-[clamp(48px,9vw,80px)] font-semibold text-white leading-none`}>UB</p>
              <p className="text-sm text-white/30 mt-3">First campus</p>
            </div>
            <div>
              <p className={`${clashDisplay} text-[clamp(48px,9vw,80px)] font-semibold text-white leading-none`}>
                &apos;<AnimatedCounter value={26} />
              </p>
              <p className="text-sm text-white/30 mt-3">Expanding</p>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-12 border-t border-white/[0.04] flex flex-col md:flex-row md:items-end md:justify-between gap-10">
            <h2 className={`${clashDisplay} text-[clamp(28px,4.5vw,40px)] font-semibold leading-[1.1] tracking-[-0.02em]`}>
              <span className="text-white">Ready to build</span>
              <br />
              <span className="text-white/20">something real?</span>
            </h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleEnter}
                className="group px-8 py-4 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                Enter HIVE
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={handleWaitlist}
                className="px-8 py-4 border border-white/10 text-white/50 rounded-full text-sm hover:border-white/20 hover:text-white/70 transition-all"
              >
                Get notified
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-white/20">
          <span>&copy; {new Date().getFullYear()} HIVE</span>
          <div className="flex gap-6">
            <Link href="/legal/terms" className="hover:text-white/40 transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-white/40 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <AnimatePresence>
        {requestSchool && <WaitlistModal school={requestSchool} onClose={() => setRequestSchool(null)} />}
      </AnimatePresence>
    </div>
  );
}
