"use client";

import { useEffect, useState, useId } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Navbar
 *
 * MONOCHROME DISCIPLINE:
 * - Logo stays white (no gold on hover)
 * - All nav elements pure grayscale
 * - CTA is white button, not gold
 * - Gold reserved for final CTA footer only
 */

function Logo({ isHovered }: { isHovered: boolean }) {
  const gradientId = useId();

  return (
    <div className="inline-flex items-center justify-center text-xl font-bold">
      <svg
        className="h-6 w-6 mr-2"
        viewBox="0 0 1500 1500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <defs>
          <linearGradient
            id={`${gradientId}-logo`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>
        <path
          d="M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z"
          fill={`url(#${gradientId}-logo)`}
          style={{
            transition: 'filter 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            filter: isHovered ? 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.3))' : 'none',
          }}
        />
      </svg>
      <span
        className="font-bold tracking-tight"
        style={{
          transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          color: '#FFFFFF',
          textShadow: isHovered ? '0 0 20px rgba(255, 255, 255, 0.2)' : 'none',
        }}
      >
        HIVE
      </span>
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#050505]/90 backdrop-blur-xl border-b border-white/[0.06]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          {/* Logo - monochrome with white glow on hover */}
          <Link
            href="/"
            className="block"
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
          >
            <Logo isHovered={logoHovered} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#product"
              className="text-[13px] text-white/40 hover:text-white transition-colors duration-200"
            >
              Product
            </Link>
            <Link
              href="#how-it-works"
              className="text-[13px] text-white/40 hover:text-white transition-colors duration-200"
            >
              How it works
            </Link>
          </div>

          {/* Auth - minimal, just log in link */}
          <div className="hidden md:flex items-center">
            <Link
              href="/auth/login"
              className="text-[13px] text-white/40 hover:text-white transition-colors duration-200"
            >
              Log in
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white/40 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden bg-[#050505]/95 backdrop-blur-xl border-b border-white/[0.06]"
          >
            <div className="px-6 py-6 space-y-4">
              <Link
                href="#product"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[14px] text-white/40 hover:text-white transition-colors py-2"
              >
                Product
              </Link>
              <Link
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[14px] text-white/40 hover:text-white transition-colors py-2"
              >
                How it works
              </Link>
              <div className="pt-4 border-t border-white/[0.06]">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-[14px] text-white/40 hover:text-white transition-colors py-2"
                >
                  Log in
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
