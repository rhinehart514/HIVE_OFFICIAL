"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          {/* Logo - confident, minimal */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Hexagon mark */}
            <span className="relative w-8 h-8 flex items-center justify-center">
              <svg
                viewBox="0 0 32 32"
                className="w-full h-full text-white transition-colors duration-200 group-hover:text-gold-500"
                fill="currentColor"
              >
                <path d="M16 2L28 9v14l-12 7-12-7V9l12-7z" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-black">
                H
              </span>
            </span>
            <span className="font-manifesto text-lg font-semibold text-white tracking-tight">
              HIVE
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#product"
              className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
            >
              Product
            </Link>
            <Link
              href="#about"
              className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
            >
              About
            </Link>
          </div>

          {/* Auth - direct, no "Sign up for free!" energy */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/auth/login"
              className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
            >
              Log in
            </Link>
            <Link
              href="/auth/login?new=true"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-black bg-white rounded-md hover:bg-neutral-200 transition-colors duration-200"
            >
              Get access
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
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
                className="block text-sm text-neutral-400 hover:text-white transition-colors py-2"
              >
                Product
              </Link>
              <Link
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm text-neutral-400 hover:text-white transition-colors py-2"
              >
                About
              </Link>
              <div className="pt-4 border-t border-white/[0.06] space-y-3">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm text-neutral-400 hover:text-white transition-colors py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/login?new=true"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2.5 text-sm font-medium text-black bg-white rounded-md"
                >
                  Get access
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
